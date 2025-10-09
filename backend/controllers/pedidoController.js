const db = require('../database');

// Listar todos os pedidos
const listarPedidos = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, u.nome_usuario 
            FROM pedidos p 
            LEFT JOIN usuarios u ON p.usuario_id = u.id_usuario 
            ORDER BY p.data_pedido DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar pedidos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Buscar pedido por ID com itens
const buscarPedidoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar dados do pedido
        const pedidoResult = await db.query(`
            SELECT p.*, u.nome_usuario, e.rua, e.numero, e.complemento, e.bairro, e.cidade, e.estado, e.cep
            FROM pedidos p 
            LEFT JOIN usuarios u ON p.usuario_id = u.id_usuario 
            LEFT JOIN enderecos e ON p.endereco_id = e.id_endereco
            WHERE p.id_pedido = $1
        `, [id]);
        
        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        
        // Buscar itens do pedido
        const itensResult = await db.query(`
            SELECT ip.*, pr.nome_produto, pr.descricao_produto 
            FROM itens_pedido ip 
            LEFT JOIN produtos pr ON ip.produto_id = pr.id_produto 
            WHERE ip.pedido_id = $1
        `, [id]);
        
        const pedido = pedidoResult.rows[0];
        pedido.itens = itensResult.rows;
        
        res.json(pedido);
    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Criar novo pedido (checkout) - CORREÇÃO COMPLETA
const criarPedido = async (req, res) => {
    const client = await db.pool.connect();
    
    try {
        const { endereco_entrega, forma_pagamento, itens, observacoes, troco_para } = req.body;

        // Verificar se o usuário está autenticado
        if (!req.session.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        const usuario_id = req.session.user.id_usuario;

        console.log('=== DADOS DO PEDIDO ===');
        console.log('Usuário:', usuario_id);
        console.log('Endereço:', endereco_entrega);
        console.log('Pagamento:', forma_pagamento);
        console.log('Itens:', itens);
        console.log('Observações:', observacoes);

        // Validações
        if (!endereco_entrega || !forma_pagamento || !itens) {
            return res.status(400).json({ error: 'Dados incompletos para o pedido' });
        }

        if (!Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ error: 'Carrinho vazio' });
        }

        // Calcular total a partir dos itens
        const total = itens.reduce((acc, item) => {
            return acc + (item.preco_unitario * item.quantidade);
        }, 0);

        // Iniciar transação
        await client.query('BEGIN');

        let endereco_id = null;

        // VERIFICAR SE USUÁRIO JÁ TEM ENDEREÇO CADASTRADO
        const enderecoExistente = await client.query(
            'SELECT id_endereco FROM enderecos WHERE usuario_id = $1',
            [usuario_id]
        );

        if (enderecoExistente.rows.length > 0) {
            // Usar endereço existente
            endereco_id = enderecoExistente.rows[0].id_endereco;
            console.log('Usando endereço existente:', endereco_id);
        } else {
            // CRIAR NOVO ENDEREÇO PARA O USUÁRIO
            // Usar um endereço temporário simples
            const enderecoResult = await client.query(
                `INSERT INTO enderecos 
                 (usuario_id, rua, numero, complemento, bairro, cidade, estado, cep) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                 RETURNING id_endereco`,
                [
                    usuario_id, 
                    'Endereço Principal', // rua
                    'S/N', // numero
                    '', // complemento
                    'Centro', // bairro
                    'Cidade', // cidade  
                    'UF', // estado
                    '00000000' // CEP
                ]
            );
            
            endereco_id = enderecoResult.rows[0].id_endereco;
            console.log('Novo endereço criado:', endereco_id);
        }

        // Criar o pedido
        const pedidoResult = await client.query(
            `INSERT INTO pedidos 
             (usuario_id, endereco_id, forma_pagamento, valor_total, observacoes, status_pedido, endereco_entrega) 
             VALUES ($1, $2, $3, $4, $5, 'pendente', $6) 
             RETURNING *`,
            [usuario_id, endereco_id, forma_pagamento, total, observacoes || '', endereco_entrega]
        );
        
        const pedido = pedidoResult.rows[0];
        
        // Adicionar itens ao pedido
        for (const item of itens) {
            await client.query(
                `INSERT INTO itens_pedido 
                 (pedido_id, produto_id, quantidade, preco_unitario, subtotal) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [pedido.id_pedido, item.id_produto, item.quantidade, item.preco_unitario, item.preco_unitario * item.quantidade]
            );
            
            // Atualizar estoque (se a coluna existir)
            try {
                await client.query(
                    'UPDATE produtos SET quantidade_estoque = quantidade_estoque - $1 WHERE id_produto = $2',
                    [item.quantidade, item.id_produto]
                );
            } catch (stockError) {
                console.log('Produto sem controle de estoque, ignorando...');
            }
        }
        
        // Se for pagamento em dinheiro e houver troco
        if (forma_pagamento === 'dinheiro' && troco_para) {
            await client.query(
                'UPDATE pedidos SET troco_para = $1 WHERE id_pedido = $2',
                [troco_para, pedido.id_pedido]
            );
        }
        
        // Commit da transação
        await client.query('COMMIT');
        
        console.log('Pedido criado com sucesso:', pedido);
        
        res.status(201).json({
            message: 'Pedido criado com sucesso!',
            id_pedido: pedido.id_pedido,
            pedido: pedido
        });
        
    } catch (error) {
        // Rollback em caso de erro
        await client.query('ROLLBACK');
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
    } finally {
        // Liberar o cliente de volta para o pool
        client.release();
    }
};

// Atualizar status do pedido
const atualizarStatusPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const { status_pedido } = req.body;
        
        const result = await db.query(
            'UPDATE pedidos SET status_pedido = $1 WHERE id_pedido = $2 RETURNING *',
            [status_pedido, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar status do pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Listar pedidos de um usuário
const listarPedidosUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const result = await db.query(`
            SELECT p.*, u.nome_usuario 
            FROM pedidos p 
            LEFT JOIN usuarios u ON p.usuario_id = u.id_usuario 
            WHERE p.usuario_id = $1 
            ORDER BY p.data_pedido DESC
        `, [usuario_id]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar pedidos do usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Deletar pedido
const deletarPedido = async (req, res) => {
    const client = await db.pool.connect();
    
    try {
        const { id } = req.params;
        
        await client.query('BEGIN');
        
        try {
            // Buscar endereço_id do pedido
            const pedidoResult = await client.query('SELECT endereco_id FROM pedidos WHERE id_pedido = $1', [id]);
            if (pedidoResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Pedido não encontrado' });
            }
            
            const endereco_id = pedidoResult.rows[0].endereco_id;

            // Deletar itens do pedido primeiro
            await client.query('DELETE FROM itens_pedido WHERE pedido_id = $1', [id]);
            
            // Deletar pedido
            await client.query('DELETE FROM pedidos WHERE id_pedido = $1', [id]);
            
            // Verificar se o endereço é usado por outros pedidos antes de deletar
            const enderecoUso = await client.query('SELECT COUNT(*) FROM pedidos WHERE endereco_id = $1', [endereco_id]);
            const count = parseInt(enderecoUso.rows[0].count);
            
            if (count === 0) {
                // Só deleta o endereço se não for usado por outros pedidos
                await client.query('DELETE FROM enderecos WHERE id_endereco = $1', [endereco_id]);
            }
            
            await client.query('COMMIT');
            
            res.json({ message: 'Pedido deletado com sucesso' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Erro ao deletar pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        client.release();
    }
};

module.exports = {
    listarPedidos,
    buscarPedidoPorId,
    criarPedido,
    atualizarStatusPedido,
    listarPedidosUsuario,
    deletarPedido
};
const db = require('../database');

// Listar todos os pedidos
const listarPedidos = async (req, res) => {
    try {
        console.log('📋 Buscando todos os pedidos...');
        
        const result = await db.query(`
            SELECT 
                p.*, 
                u.nome_usuario,
                u.email_usuario
            FROM pedidos p 
            LEFT JOIN usuarios u ON p.usuario_id = u.id_usuario 
            ORDER BY p.data_pedido DESC
        `);
        
        console.log(`✅ ${result.rows.length} pedidos encontrados`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Erro ao listar pedidos:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
};

// Buscar pedido por ID com itens
const buscarPedidoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔍 Buscando pedido ID: ${id}`);
        
        // VALIDAÇÃO DO ID
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'ID do pedido inválido' });
        }

        const pedidoId = parseInt(id);

        // Buscar dados do pedido
        const pedidoResult = await db.query(`
            SELECT 
                p.*, 
                u.nome_usuario,
                u.email_usuario
            FROM pedidos p 
            LEFT JOIN usuarios u ON p.usuario_id = u.id_usuario 
            WHERE p.id_pedido = $1
        `, [pedidoId]);
        
        console.log('Resultado da busca do pedido:', pedidoResult.rows);
        
        if (pedidoResult.rows.length === 0) {
            console.log(`❌ Pedido ${id} não encontrado no banco`);
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        
        // Buscar itens do pedido
        const itensResult = await db.query(`
            SELECT 
                ip.*, 
                pr.nome_produto, 
                pr.descricao_produto 
            FROM itens_pedido ip 
            LEFT JOIN produtos pr ON ip.produto_id = pr.id_produto 
            WHERE ip.pedido_id = $1
        `, [pedidoId]);
        
        console.log('Itens encontrados:', itensResult.rows);
        
        const pedido = pedidoResult.rows[0];
        
        // GARANTIR que os itens têm os campos necessários CORRETAMENTE
        pedido.itens = (itensResult.rows || []).map(item => {
            // Converter para números para evitar erros no frontend
            const quantidade = Number(item.quantidade) || 0;
            const preco_unitario = Number(item.preco_unitario) || 0;
            const subtotal = Number(item.subtotal) || (quantidade * preco_unitario);
            
            return {
                id_produto: item.produto_id,
                nome_produto: item.nome_produto || 'Produto não encontrado',
                descricao_produto: item.descricao_produto || '',
                quantidade: quantidade,
                preco_unitario: preco_unitario,
                subtotal: subtotal
            };
        });
        
        console.log(`✅ Pedido ${id} encontrado com ${pedido.itens.length} itens`);
        console.log('Dados finais do pedido:', {
            id: pedido.id_pedido,
            usuario: pedido.nome_usuario,
            status: pedido.status_pedido,
            total: pedido.valor_total,
            forma_pagamento: pedido.forma_pagamento,
            troco_para: pedido.troco_para,
            itens: pedido.itens.map(item => ({
                nome: item.nome_produto,
                quantidade: item.quantidade,
                preco: item.preco_unitario,
                subtotal: item.subtotal
            }))
        });
        
        res.json(pedido);
        
    } catch (error) {
        console.error('❌ Erro ao buscar pedido:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message,
            stack: error.stack
        });
    }
};

// Criar novo pedido - CORRIGIDO com forma_pagamento e troco_para
const criarPedido = async (req, res) => {
    console.log('🆕 Iniciando criação de pedido...');
    
    try {
        const { endereco_entrega, forma_pagamento, itens, observacoes, troco_para } = req.body;

        // Verificar se o usuário está autenticado
        if (!req.session.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        const usuario_id = req.session.user.id_usuario;

        console.log('=== DADOS DO PEDIDO ===');
        console.log('Usuário:', usuario_id);
        console.log('Endereço entrega:', endereco_entrega);
        console.log('Pagamento:', forma_pagamento);
        console.log('Troco para:', troco_para);
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
            const preco = Number(item.preco_unitario) || 0;
            const quantidade = Number(item.quantidade) || 0;
            return acc + (preco * quantidade);
        }, 0);

        console.log(`💰 Total do pedido: R$ ${total.toFixed(2)}`);

        // Usar transação
        const resultadoPedido = await db.transaction(async (client) => {
            console.log('💾 Inserindo pedido no banco...');
            
            // Criar o pedido - CORRIGIDO: sem data_atualizacao
            const pedidoResult = await client.query(
                `INSERT INTO pedidos 
                 (usuario_id, forma_pagamento, valor_total, observacoes, status_pedido, endereco_entrega, troco_para) 
                 VALUES ($1, $2, $3, $4, 'pendente', $5, $6) 
                 RETURNING *`,
                [
                    usuario_id, 
                    forma_pagamento, 
                    total, 
                    observacoes || '', 
                    endereco_entrega, 
                    troco_para || null
                ]
            );
            
            const pedido = pedidoResult.rows[0];
            console.log(`✅ Pedido criado - ID: ${pedido.id_pedido}`);
            
            // Adicionar itens ao pedido
            console.log(`🛒 Adicionando ${itens.length} itens ao pedido...`);
            for (const item of itens) {
                const quantidade = Number(item.quantidade) || 0;
                const preco_unitario = Number(item.preco_unitario) || 0;
                const subtotal = quantidade * preco_unitario;
                
                await client.query(
                    `INSERT INTO itens_pedido 
                     (pedido_id, produto_id, quantidade, preco_unitario, subtotal) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [pedido.id_pedido, item.id_produto, quantidade, preco_unitario, subtotal]
                );
                
                console.log(`✅ Item: ${item.nome_produto} x ${quantidade} - R$ ${subtotal.toFixed(2)}`);
            }
            
            return pedido;
        });
        
        console.log(`🎉 Pedido #${resultadoPedido.id_pedido} criado com sucesso!`);
        
        res.status(201).json({
            message: 'Pedido criado com sucesso!',
            id_pedido: resultadoPedido.id_pedido,
            pedido: resultadoPedido
        });
        
    } catch (error) {
        console.error('❌ ERRO CRÍTICO ao criar pedido:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor ao criar pedido',
            message: error.message,
            details: error.detail
        });
    }
};

// Atualizar status do pedido - CORRIGIDO: sem data_atualizacao
const atualizarStatusPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const { status_pedido } = req.body;
        
        console.log(`🔄 Atualizando pedido ${id} para status: ${status_pedido}`);
        
        // VALIDAÇÃO DO ID
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'ID do pedido inválido' });
        }
        
        const pedidoId = parseInt(id);
        
        // CORREÇÃO: Removido data_atualizacao da query
        const result = await db.query(
            'UPDATE pedidos SET status_pedido = $1 WHERE id_pedido = $2 RETURNING *',
            [status_pedido, pedidoId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        
        console.log(`✅ Status do pedido ${id} atualizado para: ${status_pedido}`);
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar status do pedido:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
};

// Listar pedidos de um usuário
const listarPedidosUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        
        console.log(`📋 Buscando pedidos do usuário: ${usuario_id}`);
        
        // VALIDAÇÃO DO ID
        if (!usuario_id || isNaN(usuario_id)) {
            return res.status(400).json({ error: 'ID do usuário inválido' });
        }
        
        const userId = parseInt(usuario_id);
        
        const result = await db.query(`
            SELECT p.*, u.nome_usuario 
            FROM pedidos p 
            LEFT JOIN usuarios u ON p.usuario_id = u.id_usuario 
            WHERE p.usuario_id = $1 
            ORDER BY p.data_pedido DESC
        `, [userId]);
        
        console.log(`✅ ${result.rows.length} pedidos encontrados para usuário ${usuario_id}`);
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Erro ao listar pedidos do usuário:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
};

// Deletar pedido
const deletarPedido = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🗑️ Tentando excluir pedido: ${id}`);
        
        // VALIDAÇÃO DO ID
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'ID do pedido inválido' });
        }
        
        const pedidoId = parseInt(id);
        
        const resultado = await db.transaction(async (client) => {
            // Deletar itens do pedido primeiro
            const itensDeletados = await client.query('DELETE FROM itens_pedido WHERE pedido_id = $1 RETURNING *', [pedidoId]);
            console.log(`🗑️ ${itensDeletados.rows.length} itens deletados`);
            
            // Deletar pedido
            const result = await client.query('DELETE FROM pedidos WHERE id_pedido = $1 RETURNING *', [pedidoId]);
            
            if (result.rows.length === 0) {
                throw new Error('Pedido não encontrado');
            }
            
            return result.rows[0];
        });
        
        console.log(`✅ Pedido ${id} excluído com sucesso`);
        res.json({ 
            message: 'Pedido deletado com sucesso', 
            pedido: resultado 
        });
        
    } catch (error) {
        console.error('❌ Erro ao deletar pedido:', error);
        if (error.message === 'Pedido não encontrado') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
};

// Função auxiliar para debug - ver todos os pedidos no banco
const debugPedidos = async (req, res) => {
    try {
        console.log('🐛 DEBUG: Verificando todos os pedidos no banco...');
        
        const pedidosResult = await db.query('SELECT * FROM pedidos ORDER BY id_pedido');
        const itensResult = await db.query('SELECT * FROM itens_pedido ORDER BY pedido_id');
        
        console.log(`📦 Total de pedidos: ${pedidosResult.rows.length}`);
        console.log(`🛒 Total de itens: ${itensResult.rows.length}`);
        
        pedidosResult.rows.forEach(pedido => {
            console.log(`Pedido #${pedido.id_pedido}:`, {
                usuario: pedido.usuario_id,
                status: pedido.status_pedido,
                total: pedido.valor_total,
                forma_pagamento: pedido.forma_pagamento,
                troco_para: pedido.troco_para,
                endereco: pedido.endereco_entrega
            });
        });
        
        res.json({
            pedidos: pedidosResult.rows,
            itens: itensResult.rows
        });
        
    } catch (error) {
        console.error('❌ Erro no debug:', error);
        res.status(500).json({ error: error.message });
    }
};

// Função para criar a coluna data_atualizacao se necessário
const criarColunaDataAtualizacao = async (req, res) => {
    try {
        console.log('🔧 Verificando se a coluna data_atualizacao existe...');
        
        // Verificar se a coluna existe
        const checkResult = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'pedidos' AND column_name = 'data_atualizacao'
        `);
        
        if (checkResult.rows.length === 0) {
            console.log('📝 Criando coluna data_atualizacao...');
            await db.query('ALTER TABLE pedidos ADD COLUMN data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            console.log('✅ Coluna data_atualizacao criada com sucesso!');
            res.json({ message: 'Coluna data_atualizacao criada com sucesso!' });
        } else {
            console.log('✅ Coluna data_atualizacao já existe');
            res.json({ message: 'Coluna data_atualizacao já existe' });
        }
        
    } catch (error) {
        console.error('❌ Erro ao criar coluna:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    listarPedidos,
    buscarPedidoPorId,
    criarPedido,
    atualizarStatusPedido,
    listarPedidosUsuario,
    deletarPedido,
    debugPedidos,
    criarColunaDataAtualizacao
};
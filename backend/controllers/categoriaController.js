const db = require('../database');

// Listar todas as categorias
const listarCategorias = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categorias ORDER BY nome_categoria');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar categorias:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Buscar categoria por ID
const buscarCategoriaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM categorias WHERE id_categoria = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar categoria:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Criar nova categoria
const criarCategoria = async (req, res) => {
    try {
        const { nome_categoria, descricao_categoria } = req.body;
        
        // Validar campos obrigatórios
        if (!nome_categoria || nome_categoria.trim() === '') {
            return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
        }
        
        const result = await db.query(
            'INSERT INTO categorias (nome_categoria, descricao_categoria) VALUES ($1, $2) RETURNING *',
            [nome_categoria.trim(), descricao_categoria?.trim() || null]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Já existe uma categoria com este nome' });
        }
        
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Atualizar categoria
const atualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_categoria, descricao_categoria } = req.body;
        
        // Validar campos obrigatórios
        if (!nome_categoria || nome_categoria.trim() === '') {
            return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
        }
        
        // Verificar se a categoria existe
        const categoriaExistente = await db.query(
            'SELECT * FROM categorias WHERE id_categoria = $1',
            [id]
        );
        
        if (categoriaExistente.rows.length === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }
        
        const result = await db.query(
            'UPDATE categorias SET nome_categoria = $1, descricao_categoria = $2 WHERE id_categoria = $3 RETURNING *',
            [nome_categoria.trim(), descricao_categoria?.trim() || null, id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Já existe uma categoria com este nome' });
        }
        
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Deletar categoria - CORRIGIDA
const deletarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`Tentando excluir categoria ID: ${id}`);
        
        // Verificar se a categoria existe
        const categoriaExistente = await db.query(
            'SELECT * FROM categorias WHERE id_categoria = $1',
            [id]
        );
        
        if (categoriaExistente.rows.length === 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }
        
        // Verificar se existem produtos ATIVOS associados a esta categoria
        const produtosAtivos = await db.query(
            'SELECT 1 FROM produtos WHERE categoria_id = $1 AND ativo = true LIMIT 1',
            [id]
        );
        
        if (produtosAtivos.rows.length > 0) {
            return res.status(400).json({
                error: 'Não é possível deletar categoria que possui produtos ativos associados. Desative os produtos primeiro.'
            });
        }
        
        // Se há produtos inativos, vamos desassociá-los (definir categoria_id como NULL)
        const produtosInativos = await db.query(
            'SELECT COUNT(*) as total FROM produtos WHERE categoria_id = $1 AND ativo = false',
            [id]
        );
        
        if (parseInt(produtosInativos.rows[0].total) > 0) {
            console.log(`Desassociando ${produtosInativos.rows[0].total} produtos inativos da categoria ${id}`);
            
            await db.query(
                'UPDATE produtos SET categoria_id = NULL WHERE categoria_id = $1 AND ativo = false',
                [id]
            );
        }
        
        // Agora podemos deletar a categoria
        const result = await db.query(
            'DELETE FROM categorias WHERE id_categoria = $1 RETURNING id_categoria', 
            [id]
        );
        
        console.log(`Categoria ${id} excluída com sucesso`);
        
        res.json({ 
            message: 'Categoria deletada com sucesso',
            produtos_afetados: parseInt(produtosInativos.rows[0].total) || 0
        });
        
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        
        // Verificar se é erro de violação de foreign key
        if (error.code === '23503') {
            // Buscar informações sobre os produtos que estão causando o problema
            try {
                const produtosAssociados = await db.query(
                    'SELECT COUNT(*) as total, SUM(CASE WHEN ativo = true THEN 1 ELSE 0 END) as ativos FROM produtos WHERE categoria_id = $1',
                    [req.params.id]
                );
                
                const total = parseInt(produtosAssociados.rows[0].total);
                const ativos = parseInt(produtosAssociados.rows[0].ativos);
                
                if (ativos > 0) {
                    return res.status(400).json({
                        error: `Não é possível deletar categoria. Existem ${ativos} produto(s) ativo(s) associado(s). Desative os produtos primeiro.`
                    });
                } else {
                    return res.status(400).json({
                        error: `Não é possível deletar categoria. Existem ${total} produto(s) associado(s), mesmo estando inativos.`
                    });
                }
            } catch (err) {
                return res.status(400).json({
                    error: 'Não é possível deletar categoria que possui produtos associados'
                });
            }
        }
        
        res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
    }
};

module.exports = {
    listarCategorias,
    buscarCategoriaPorId,
    criarCategoria,
    atualizarCategoria,
    deletarCategoria
};
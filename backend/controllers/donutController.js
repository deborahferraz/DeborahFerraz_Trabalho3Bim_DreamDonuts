const db = require('../database');

// Listar todos os produtos ativos
const listarDonuts = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, c.nome_categoria 
            FROM produtos p 
            LEFT JOIN categorias c ON p.categoria_id = c.id_categoria 
            WHERE p.ativo = true 
            ORDER BY p.nome_produto
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar donuts:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Buscar donut por ID
const buscarDonutPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT p.*, c.nome_categoria 
            FROM produtos p 
            LEFT JOIN categorias c ON p.categoria_id = c.id_categoria 
            WHERE p.id_produto = $1 AND p.ativo = true
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Donut não encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar donut:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Criar novo donut
const criarDonut = async (req, res) => {
    try {
        const { nome_produto, descricao_produto, preco_produto, quantidade_estoque, categoria_id, imagem_produto } = req.body;
        
        const result = await db.query(
            'INSERT INTO produtos (nome_produto, descricao_produto, preco_produto, quantidade_estoque, categoria_id, imagem_produto) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [nome_produto, descricao_produto, preco_produto, quantidade_estoque, categoria_id, imagem_produto]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar donut:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Atualizar donut
const atualizarDonut = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_produto, descricao_produto, preco_produto, quantidade_estoque, categoria_id, imagem_produto } = req.body;
        
        const result = await db.query(
            'UPDATE produtos SET nome_produto = $1, descricao_produto = $2, preco_produto = $3, quantidade_estoque = $4, categoria_id = $5, imagem_produto = $6 WHERE id_produto = $7 RETURNING *',
            [nome_produto, descricao_produto, preco_produto, quantidade_estoque, categoria_id, imagem_produto, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Donut não encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar donut:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Deletar donut (soft delete)
const deletarDonut = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query('UPDATE produtos SET ativo = false WHERE id_produto = $1 RETURNING id_produto', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Donut não encontrado' });
        }
        
        res.json({ message: 'Donut deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar donut:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Listar donuts por categoria
const listarDonutsPorCategoria = async (req, res) => {
    try {
        const { categoria_id } = req.params;
        const result = await db.query(`
            SELECT p.*, c.nome_categoria 
            FROM produtos p 
            LEFT JOIN categorias c ON p.categoria_id = c.id_categoria 
            WHERE p.categoria_id = $1 AND p.ativo = true 
            ORDER BY p.nome_produto
        `, [categoria_id]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar donuts por categoria:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

module.exports = {
    listarDonuts,
    buscarDonutPorId,
    criarDonut,
    atualizarDonut,
    deletarDonut,
    listarDonutsPorCategoria
};


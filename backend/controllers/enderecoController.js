const db = require('../database');

// Listar todos os endereços
const listarEnderecos = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT e.*, u.nome_usuario 
            FROM enderecos e 
            LEFT JOIN usuarios u ON e.usuario_id = u.id_usuario 
            ORDER BY e.id_endereco
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar endereços:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Buscar endereço por ID
const buscarEnderecoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT e.*, u.nome_usuario 
            FROM enderecos e 
            LEFT JOIN usuarios u ON e.usuario_id = u.id_usuario 
            WHERE e.id_endereco = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Endereço não encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar endereço:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Buscar endereço por usuário
const buscarEnderecoPorUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const result = await db.query(`
            SELECT e.*, u.nome_usuario 
            FROM enderecos e 
            LEFT JOIN usuarios u ON e.usuario_id = u.id_usuario 
            WHERE e.usuario_id = $1
        `, [usuario_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Endereço não encontrado para este usuário' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar endereço por usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Criar novo endereço
const criarEndereco = async (req, res) => {
    try {
        const { usuario_id, rua, numero, complemento, bairro, cidade, estado, cep } = req.body;
        
        // Verificar se o usuário já possui endereço (relacionamento 1:1)
        const enderecoExistente = await db.query('SELECT id_endereco FROM enderecos WHERE usuario_id = $1', [usuario_id]);
        if (enderecoExistente.rows.length > 0) {
            return res.status(400).json({ error: 'Usuário já possui um endereço cadastrado' });
        }
        
        const result = await db.query(
            'INSERT INTO enderecos (usuario_id, rua, numero, complemento, bairro, cidade, estado, cep) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [usuario_id, rua, numero, complemento, bairro, cidade, estado, cep]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar endereço:', error);
        
        // Verificar se é erro de violação de unique constraint
        if (error.code === '23505') {
            return res.status(400).json({
                error: 'Usuário já possui um endereço cadastrado'
            });
        }
        
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Atualizar endereço
const atualizarEndereco = async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario_id, rua, numero, complemento, bairro, cidade, estado, cep } = req.body;
        
        // Verificar se está tentando alterar para um usuário que já possui endereço
        if (usuario_id) {
            const enderecoExistente = await db.query('SELECT id_endereco FROM enderecos WHERE usuario_id = $1 AND id_endereco != $2', [usuario_id, id]);
            if (enderecoExistente.rows.length > 0) {
                return res.status(400).json({ error: 'Usuário já possui um endereço cadastrado' });
            }
        }
        
        const result = await db.query(
            'UPDATE enderecos SET usuario_id = $1, rua = $2, numero = $3, complemento = $4, bairro = $5, cidade = $6, estado = $7, cep = $8 WHERE id_endereco = $9 RETURNING *',
            [usuario_id, rua, numero, complemento, bairro, cidade, estado, cep, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Endereço não encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar endereço:', error);
        
        // Verificar se é erro de violação de unique constraint
        if (error.code === '23505') {
            return res.status(400).json({
                error: 'Usuário já possui um endereço cadastrado'
            });
        }
        
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Deletar endereço
const deletarEndereco = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query('DELETE FROM enderecos WHERE id_endereco = $1 RETURNING id_endereco', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Endereço não encontrado' });
        }
        
        res.json({ message: 'Endereço deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar endereço:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

module.exports = {
    listarEnderecos,
    buscarEnderecoPorId,
    buscarEnderecoPorUsuario,
    criarEndereco,
    atualizarEndereco,
    deletarEndereco
};
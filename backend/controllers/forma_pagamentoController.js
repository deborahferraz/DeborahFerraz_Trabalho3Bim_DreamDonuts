const { query } = require('../database');

// Função para converter valor para booleano
function parseAtivo(valor) {
  if (typeof valor === 'boolean') return valor;
  if (!valor) return false;
  const str = String(valor).toLowerCase();
  return str === 'true' || str === '1' || str === 'sim' || str === 'yes';
}

exports.listarForma_pagamentos = async (req, res) => {
  try {
    console.log('📋 Controller: Listando formas de pagamento');
    const result = await query('SELECT * FROM formas_pagamento ORDER BY id_forma_pagamento');
    console.log(`✅ Controller: ${result.rows.length} formas de pagamento encontradas`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Controller: Erro ao listar formas de pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.criarForma_pagamento = async (req, res) => {
  try {
    const { nome_forma_pagamento, ativo } = req.body;

    if (!nome_forma_pagamento) {
      return res.status(400).json({
        error: 'O nome da forma de pagamento é obrigatório'
      });
    }

    const ativoBool = parseAtivo(ativo);

    const result = await query(
      'INSERT INTO formas_pagamento (nome_forma_pagamento, ativo) VALUES ($1, $2) RETURNING *',
      [nome_forma_pagamento, ativoBool]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar forma de pagamento:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({
        error: 'Forma de pagamento já existe'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterForma_pagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM formas_pagamento WHERE id_forma_pagamento = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Forma de pagamento não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter forma de pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarForma_pagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome_forma_pagamento, ativo } = req.body;

    if (!nome_forma_pagamento) {
      return res.status(400).json({ error: 'Nome da forma de pagamento é obrigatório' });
    }

    const ativoBool = parseAtivo(ativo);

    const result = await query(
      'UPDATE formas_pagamento SET nome_forma_pagamento = $1, ativo = $2 WHERE id_forma_pagamento = $3 RETURNING *',
      [nome_forma_pagamento, ativoBool, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Forma de pagamento não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar forma de pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarForma_pagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const result = await query(
      'DELETE FROM formas_pagamento WHERE id_forma_pagamento = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Forma de pagamento não encontrada' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar forma de pagamento:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar forma de pagamento com pedidos associados'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
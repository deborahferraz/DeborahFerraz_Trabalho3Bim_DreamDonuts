const db = require("../database");
const path = require("path");

// Converter campo ativo (qualquer formato → boolean)
function parseAtivo(valor) {
  if (typeof valor === 'boolean') return valor;
  if (!valor) return false;
  const str = String(valor).toLowerCase();
  return str === 'true' || str === '1' || str === 'sim' || str === 'yes';
}

// Função para verificar se categoria existe
async function verificarCategoriaExiste(categoria_id) {
  if (!categoria_id) return true; // Categoria opcional
  
  try {
    const result = await db.query(
      'SELECT 1 FROM categorias WHERE id_categoria = $1',
      [categoria_id]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Erro ao verificar categoria:', error);
    return false;
  }
}

// Listar todos
exports.listarProdutos = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id_produto, nome_produto, descricao_produto, preco_produto, 
              quantidade_estoque, imagem_produto, categoria_id, ativo, data_criacao
       FROM produtos
       ORDER BY id_produto`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).json({ error: "Erro ao listar produtos" });
  }
};

// Obter por ID
exports.obterProduto = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id_produto, nome_produto, descricao_produto, preco_produto, 
              quantidade_estoque, imagem_produto, categoria_id, ativo, data_criacao
       FROM produtos
       WHERE id_produto = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
};

// Criar
exports.criarProduto = async (req, res) => {
  try {
    const {
      id_produto, // ID específico que queremos usar
      nome_produto,
      descricao_produto,
      preco_produto,
      quantidade_estoque,
      categoria_id,
      ativo
    } = req.body;

    console.log('=== DADOS RECEBIDOS ===');
    console.log('id_produto:', id_produto);
    console.log('categoria_id:', categoria_id);

    // Validar se a categoria existe (se foi fornecida)
    if (categoria_id && categoria_id !== '') {
      const categoriaExiste = await verificarCategoriaExiste(categoria_id);
      if (!categoriaExiste) {
        return res.status(400).json({ error: "Categoria não encontrada" });
      }
    }

    // Verificar se há arquivo de imagem enviado
    const imagem_produto = req.file ? `/uploads/${req.file.filename}` : null;
    const ativoBool = parseAtivo(ativo);

    let query, values;

    if (id_produto && id_produto !== '') {
      // FORÇAR a inserção com ID específico
      query = `INSERT INTO produtos 
        (id_produto, nome_produto, descricao_produto, preco_produto, quantidade_estoque, 
         imagem_produto, categoria_id, ativo, data_criacao)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`;
      values = [
        parseInt(id_produto),
        nome_produto,
        descricao_produto || '',
        parseFloat(preco_produto) || 0,
        parseInt(quantidade_estoque) || 0,
        imagem_produto,
        categoria_id ? parseInt(categoria_id) : null,
        ativoBool
      ];
    } else {
      // Inserção normal sem ID específico
      query = `INSERT INTO produtos 
        (nome_produto, descricao_produto, preco_produto, quantidade_estoque, 
         imagem_produto, categoria_id, ativo, data_criacao)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`;
      values = [
        nome_produto,
        descricao_produto || '',
        parseFloat(preco_produto) || 0,
        parseInt(quantidade_estoque) || 0,
        imagem_produto,
        categoria_id ? parseInt(categoria_id) : null,
        ativoBool
      ];
    }

    console.log('Query:', query);
    console.log('Values:', values);

    const result = await db.query(query, values);

    console.log('Produto criado:', result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    
    // Verificar se é erro de ID duplicado
    if (err.code === '23505') {
      res.status(400).json({ error: "Já existe um produto com este ID" });
    } else if (err.code === '23503') {
      res.status(400).json({ error: "Categoria não encontrada" });
    } else {
      res.status(500).json({ error: "Erro ao criar produto: " + err.message });
    }
  }
};

// Atualizar
exports.atualizarProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome_produto,
      descricao_produto,
      preco_produto,
      quantidade_estoque,
      categoria_id,
      ativo
    } = req.body;

    // Validar se a categoria existe (se foi fornecida)
    if (categoria_id && categoria_id !== '') {
      const categoriaExiste = await verificarCategoriaExiste(categoria_id);
      if (!categoriaExiste) {
        return res.status(400).json({ error: "Categoria não encontrada" });
      }
    }

    // Manter imagem existente se não houver nova imagem
    let imagem_produto = req.body.imagem_produto || null;
    if (req.file) {
      imagem_produto = `/uploads/${req.file.filename}`;
    }

    const ativoBool = parseAtivo(ativo);

    const result = await db.query(
      `UPDATE produtos
       SET nome_produto=$1, descricao_produto=$2, preco_produto=$3, 
           quantidade_estoque=$4, imagem_produto=$5, categoria_id=$6, ativo=$7
       WHERE id_produto=$8
       RETURNING *`,
      [
        nome_produto,
        descricao_produto,
        preco_produto,
        quantidade_estoque,
        imagem_produto,
        categoria_id ? parseInt(categoria_id) : null,
        ativoBool,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    
    if (err.code === '23503') {
      res.status(400).json({ error: "Categoria não encontrada" });
    } else {
      res.status(500).json({ error: "Erro ao atualizar produto" });
    }
  }
};

// Deletar
exports.deletarProduto = async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM produtos WHERE id_produto=$1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }
    res.json({ message: "Produto deletado com sucesso" });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    res.status(500).json({ error: "Erro ao deletar produto" });
  }
};

// Função para abrir página do CRUD (se necessário)
exports.abrirCrudProduto = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/admin/produtos.html'));
};
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

// Configuração de Upload (multer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Rotas do CRUD de Produtos

// Página do CRUD (frontend)
router.get('/abrirCrudProduto', produtoController.abrirCrudProduto);

// API REST
router.get('/', produtoController.listarProdutos);                                    // Listar todos
router.post('/', upload.single('imagem_produto'), produtoController.criarProduto);   // Criar novo (com upload)
router.get('/:id', produtoController.obterProduto);                                  // Buscar por ID
router.put('/:id', upload.single('imagem_produto'), produtoController.atualizarProduto); // Atualizar por ID (com upload)
router.delete('/:id', produtoController.deletarProduto);                             // Deletar por ID

module.exports = router;

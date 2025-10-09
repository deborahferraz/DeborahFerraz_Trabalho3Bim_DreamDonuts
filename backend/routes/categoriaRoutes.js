const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

// Listar todas as categorias
router.get('/', categoriaController.listarCategorias);

// Buscar categoria por ID
router.get('/:id', categoriaController.buscarCategoriaPorId);

// Criar nova categoria
router.post('/', categoriaController.criarCategoria);

// Atualizar categoria
router.put('/:id', categoriaController.atualizarCategoria);

// Deletar categoria
router.delete('/:id', categoriaController.deletarCategoria);

module.exports = router;


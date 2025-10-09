const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Listar todos os usuários
router.get('/', usuarioController.listarUsuarios);

// Buscar usuário por ID
router.get('/:id', usuarioController.buscarUsuarioPorId);

// Criar novo usuário
router.post('/', usuarioController.criarUsuario);

// Atualizar usuário
router.put('/:id', usuarioController.atualizarUsuario);

// Deletar usuário
router.delete('/:id', usuarioController.deletarUsuario);

module.exports = router;


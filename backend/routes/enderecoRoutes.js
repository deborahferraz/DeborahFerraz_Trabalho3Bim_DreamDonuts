const express = require('express');
const router = express.Router();
const enderecoController = require('../controllers/enderecoController');

// Listar todos os endereços
router.get('/', enderecoController.listarEnderecos);

// Buscar endereço por ID
router.get('/:id', enderecoController.buscarEnderecoPorId);

// Buscar endereço por usuário
router.get('/usuario/:usuario_id', enderecoController.buscarEnderecoPorUsuario);

// Criar novo endereço
router.post('/', enderecoController.criarEndereco);

// Atualizar endereço
router.put('/:id', enderecoController.atualizarEndereco);

// Deletar endereço
router.delete('/:id', enderecoController.deletarEndereco);

module.exports = router;


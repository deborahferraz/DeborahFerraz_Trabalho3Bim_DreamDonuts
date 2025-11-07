const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// Listar todos os pedidos
router.get('/', pedidoController.listarPedidos);

// Buscar pedido por ID
router.get('/:id', pedidoController.buscarPedidoPorId);

// Criar novo pedido
router.post('/', pedidoController.criarPedido);

// Atualizar status do pedido
router.put('/:id/status', pedidoController.atualizarStatusPedido);

// Listar pedidos de um usuário
router.get('/usuario/:usuario_id', pedidoController.listarPedidosUsuario);

// Deletar pedido
router.delete('/:id', pedidoController.deletarPedido);

// Rota de debug (opcional)
router.get('/debug/todos', pedidoController.debugPedidos);

// Rota para criar coluna data_atualizacao (opcional)
router.get('/debug/criar-coluna', pedidoController.criarColunaDataAtualizacao);

module.exports = router;
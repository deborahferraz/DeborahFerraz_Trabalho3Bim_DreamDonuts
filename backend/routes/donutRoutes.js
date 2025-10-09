const express = require('express');
const router = express.Router();
const donutController = require('../controllers/donutController');

// Listar todos os donuts
router.get('/', donutController.listarDonuts);

// Buscar donut por ID
router.get('/:id', donutController.buscarDonutPorId);

// Criar novo donut
router.post('/', donutController.criarDonut);

// Atualizar donut
router.put('/:id', donutController.atualizarDonut);

// Deletar donut
router.delete('/:id', donutController.deletarDonut);

// Listar donuts por categoria
router.get('/categoria/:categoria_id', donutController.listarDonutsPorCategoria);

module.exports = router;


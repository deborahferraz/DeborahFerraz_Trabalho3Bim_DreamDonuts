// Configuração da API
const API_BASE_URL = 'http://localhost:3001';

// Estado da aplicação
let carrinho = [];
let usuarioLogado = null;

// Elementos do DOM
const orderItems = document.getElementById('orderItems');
const orderTotal = document.getElementById('orderTotal');
const paymentForm = document.getElementById('paymentForm');
const paymentMethod = document.getElementById('paymentMethod');
const cardFields = document.getElementById('cardFields');
const pixFields = document.getElementById('pixFields');
const cashFields = document.getElementById('cashFields');
const modal = document.getElementById('modalConfirmacao');
const modalOverlay = document.getElementById('modalOverlay');
const modalMessage = document.getElementById('modalMessage');
const pixCode = document.getElementById('pixCode');
const pixCodeText = document.getElementById('pixCodeText');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await verificarLogin();
    carregarCarrinhoLocalStorage();
    configurarEventListeners();
    renderizarResumo();
});

// Verificar se o usuário está logado
async function verificarLogin() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verificar`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Erro na verificação de login');
        }
        
        const data = await response.json();
        
        if (data.logged) {
            usuarioLogado = {
                id_usuario: data.id_usuario,
                nome_usuario: data.nome_usuario,
                papel: data.papel
            };
        } else {
            alert('Você precisa estar logado para acessar esta página.');
            window.location.href = '/auth/login.html';
        }
    } catch (error) {
        console.error('Erro ao verificar login:', error);
        alert('Erro ao verificar login. Redirecionando...');
        window.location.href = '/auth/login.html';
    }
}

// Configurar event listeners
function configurarEventListeners() {
    paymentMethod.addEventListener('change', mostrarCamposFormaPagamento);
    paymentForm.addEventListener('submit', processarPagamento);
    
    // Formatação automática dos campos de cartão
    const cardNumber = document.getElementById('cardNumber');
    const cardExpiry = document.getElementById('cardExpiry');
    
    if (cardNumber) {
        cardNumber.addEventListener('input', formatarNumeroCartao);
    }
    
    if (cardExpiry) {
        cardExpiry.addEventListener('input', formatarValidadeCartao);
    }
}

// Carregar carrinho do localStorage
function carregarCarrinhoLocalStorage() {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        try {
            carrinho = JSON.parse(carrinhoSalvo);
        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
            carrinho = [];
        }
    }
    
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio.');
        window.location.href = '/loja/index.html';
    }
}

// Renderizar resumo do pedido
function renderizarResumo() {
    orderItems.innerHTML = '';
    let total = 0;
    
    carrinho.forEach(item => {
        const subtotal = item.preco_produto * item.quantidade;
        total += subtotal;
        
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <div class="item-info">
                <div class="item-name">${item.nome_produto}</div>
                <div class="item-quantity">Quantidade: ${item.quantidade}</div>
            </div>
            <div class="item-price">R$ ${subtotal.toFixed(2).replace('.', ',')}</div>
        `;
        orderItems.appendChild(orderItem);
    });
    
    orderTotal.textContent = total.toFixed(2).replace('.', ',');
}

// Mostrar campos específicos da forma de pagamento
function mostrarCamposFormaPagamento() {
    const method = paymentMethod.value;
    
    // Esconder todos os campos
    cardFields.style.display = 'none';
    pixFields.style.display = 'none';
    cashFields.style.display = 'none';
    
    // Mostrar campos específicos
    if (method === 'cartao_credito' || method === 'cartao_debito') {
        cardFields.style.display = 'block';
    }
    
    if (method === 'pix') {
        pixFields.style.display = 'block';
    }
    
    if (method === 'dinheiro') {
        cashFields.style.display = 'block';
    }
}

// Formatação do número do cartão
function formatarNumeroCartao(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    e.target.value = value.substring(0, 19);
}

// Formatação da validade do cartão
function formatarValidadeCartao(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value.substring(0, 5);
}

// Processar pagamento
async function processarPagamento(e) {
    e.preventDefault();
    
    const method = paymentMethod.value;
    const deliveryAddress = document.getElementById('deliveryAddress').value;
    const orderNotes = document.getElementById('orderNotes').value;
    
    // Validar campos obrigatórios
    if (!method) {
        alert('Selecione uma forma de pagamento.');
        return;
    }
    
    if (!deliveryAddress.trim()) {
        alert('Digite o endereço de entrega.');
        return;
    }
    
    const btnConfirm = document.querySelector('.btn-confirm');
    btnConfirm.textContent = 'Processando...';
    btnConfirm.disabled = true;
    
    try {
        // Preparar dados do pedido
        const itens = carrinho.map(item => ({
            id_produto: item.id_produto,
            quantidade: item.quantidade,
            preco_unitario: item.preco_produto
        }));
        
        const dadosPedido = {
            endereco_entrega: deliveryAddress,
            forma_pagamento: method,
            observacoes: orderNotes,
            itens: itens
        };
        
        // Adicionar dados específicos do pagamento
        if (method === 'dinheiro') {
            const cashAmount = document.getElementById('cashAmount').value;
            if (cashAmount) {
                dadosPedido.troco_para = parseFloat(cashAmount);
            }
        }
        
        console.log('Enviando pedido:', dadosPedido);
        
        // Enviar pedido para o backend
        const response = await fetch(`${API_BASE_URL}/pedido`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(dadosPedido)
        });
        
        if (response.ok) {
            const resultado = await response.json();
            console.log('Pedido criado com sucesso:', resultado);
            
            // Limpar carrinho
            carrinho = [];
            localStorage.removeItem('carrinho');
            
            // Mostrar modal de confirmação
            mostrarModalConfirmacao(method, resultado);
        } else {
            let errorMessage = 'Erro ao processar pedido';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
                console.error('Erro ao parsear resposta de erro:', parseError);
            }
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
        alert('Erro ao processar pedido: ' + error.message);
    } finally {
        btnConfirm.textContent = 'Confirmar Pedido';
        btnConfirm.disabled = false;
    }
}

// Mostrar modal de confirmação
function mostrarModalConfirmacao(method, resultado) {
    if (method === 'pix') {
        modalMessage.textContent = 'Pedido confirmado! Use o código PIX abaixo para pagamento:';
        pixCodeText.textContent = gerarCodigoPix();
        pixCode.style.display = 'block';
    } else {
        modalMessage.textContent = `Seu pedido foi confirmado com sucesso! Número do pedido: ${resultado.id_pedido || 'N/A'}`;
        pixCode.style.display = 'none';
    }
    
    modal.classList.add('show');
    modalOverlay.classList.add('show');
}

// Gerar código PIX (simulado)
function gerarCodigoPix() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Copiar código PIX
function copiarPix() {
    const codigo = pixCodeText.textContent;
    navigator.clipboard.writeText(codigo).then(() => {
        const btnCopy = document.querySelector('.btn-copy');
        const originalText = btnCopy.textContent;
        btnCopy.textContent = 'Copiado!';
        setTimeout(() => {
            btnCopy.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar código PIX');
    });
}

// Voltar ao carrinho
function voltarCarrinho() {
    window.location.href = '/loja/index.html';
}

// Fechar modal
function fecharModal() {
    modal.classList.remove('show');
    modalOverlay.classList.remove('show');
    window.location.href = '/loja/index.html';
}

// Fechar modal clicando no overlay
modalOverlay.addEventListener('click', fecharModal);
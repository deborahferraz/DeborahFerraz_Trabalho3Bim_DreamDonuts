// Configuração da API
const API_BASE_URL = 'http://localhost:3001';

// Estado da aplicação
let carrinho = [];
let usuarioLogado = null;
let totalPedido = 0;

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
const pixAmount = document.getElementById('pixAmount');
const pixAmountDisplay = document.getElementById('pixAmountDisplay');
const pixValueDisplay = document.getElementById('pixValueDisplay');
const addressInfo = document.getElementById('addressInfo');
const savedAddress = document.getElementById('savedAddress');
const btnChangeAddress = document.getElementById('btnChangeAddress');
const deliveryAddress = document.getElementById('deliveryAddress');
const qrcodeContainer = document.getElementById('qrcode');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await verificarLogin();
    await carregarEnderecoUsuario();
    await carregarFormasPagamento();
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
            console.log('Usuário logado:', usuarioLogado);
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

// Carregar formas de pagamento da API - CORRIGIDA
async function carregarFormasPagamento() {
    try {
        const response = await fetch(`${API_BASE_URL}/forma_pagamento`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const formasPagamento = await response.json();
            
            // FILTRAR APENAS FORMAS DE PAGAMENTO ATIVAS
            const formasAtivas = formasPagamento.filter(forma => forma.ativo === true);
            
            console.log(`📋 Formas de pagamento carregadas: ${formasPagamento.length} total, ${formasAtivas.length} ativas`);
            console.log('🔍 Formas de pagamento recebidas da API:', formasPagamento);
            console.log('✅ Formas de pagamento ativas após filtro:', formasAtivas);
            
            preencherFormasPagamento(formasAtivas);
        } else {
            console.log('Usando formas de pagamento padrão (filtradas)');
            // Fallback com apenas formas ativas
            const formasPadraoAtivas = [
                { nome_forma_pagamento: 'PIX', ativo: true },
                { nome_forma_pagamento: 'Cartão de Crédito', ativo: true },
                { nome_forma_pagamento: 'Cartão de Débito', ativo: true },
                { nome_forma_pagamento: 'Dinheiro', ativo: true }
            ];
            preencherFormasPagamento(formasPadraoAtivas);
        }
    } catch (error) {
        console.error('Erro ao carregar formas de pagamento:', error);
        // Fallback em caso de erro
        const formasPadraoAtivas = [
            { nome_forma_pagamento: 'PIX', ativo: true },
            { nome_forma_pagamento: 'Cartão de Crédito', ativo: true },
            { nome_forma_pagamento: 'Cartão de Débito', ativo: true },
            { nome_forma_pagamento: 'Dinheiro', ativo: true }
        ];
        preencherFormasPagamento(formasPadraoAtivas);
    }
}

// Preencher select com formas de pagamento - CORRIGIDA
function preencherFormasPagamento(formasPagamento) {
    const select = document.getElementById('paymentMethod');
    
    console.log('🎯 Preenchendo select com formas de pagamento:', formasPagamento);
    
    // Limpar opções exceto a primeira
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Adicionar formas de pagamento ativas (já filtradas)
    if (formasPagamento.length > 0) {
        formasPagamento.forEach(forma => {
            const option = document.createElement('option');
            option.value = forma.nome_forma_pagamento.toLowerCase().replace(/\s+/g, '_');
            option.textContent = forma.nome_forma_pagamento;
            select.appendChild(option);
        });
        console.log(`✅ ${formasPagamento.length} formas de pagamento ativas adicionadas ao select`);
    } else {
        // Fallback para formas padrão ativas
        console.log('⚠️ Nenhuma forma de pagamento ativa encontrada, usando fallback');
        const formasPadrao = [
            { value: 'pix', text: 'PIX' },
            { value: 'cartao_credito', text: 'Cartão de Crédito' },
            { value: 'cartao_debito', text: 'Cartão de Débito' },
            { value: 'dinheiro', text: 'Dinheiro' }
        ];
        
        formasPadrao.forEach(forma => {
            const option = document.createElement('option');
            option.value = forma.value;
            option.textContent = forma.text;
            select.appendChild(option);
        });
    }
}

// Carregar endereço do usuário
async function carregarEnderecoUsuario() {
    if (!usuarioLogado) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/endereco/usuario/${usuarioLogado.id_usuario}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const enderecos = await response.json();
            // Pega o primeiro endereço (ou o último)
            const endereco = Array.isArray(enderecos) ? enderecos[0] : enderecos;
            console.log('Endereço encontrado:', endereco);
            preencherEndereco(endereco);
        } else {
            console.log('Usuário não tem endereço cadastrado');
            mostrarCampoEnderecoManual();
        }
    } catch (error) {
        console.error('Erro ao carregar endereço:', error);
        mostrarCampoEnderecoManual();
    }
}

// Preencher endereço cadastrado
function preencherEndereco(endereco) {
    if (!endereco) return;
    
    const enderecoCompleto = `${endereco.rua || ''}, ${endereco.numero || ''}${endereco.complemento ? ' - ' + endereco.complemento : ''} - ${endereco.bairro || ''}, ${endereco.cidade || ''} - ${endereco.estado || ''}, CEP: ${endereco.cep || ''}`;
    
    if (enderecoCompleto.trim().length > 10) {
        savedAddress.textContent = enderecoCompleto;
        deliveryAddress.value = enderecoCompleto;
        addressInfo.style.display = 'block';
        
        // Configurar botão de alterar endereço
        btnChangeAddress.addEventListener('click', function() {
            addressInfo.style.display = 'none';
            deliveryAddress.value = '';
            deliveryAddress.focus();
        });
    } else {
        mostrarCampoEnderecoManual();
    }
}

// Mostrar campo de endereço manual
function mostrarCampoEnderecoManual() {
    addressInfo.style.display = 'none';
    deliveryAddress.placeholder = 'Digite seu endereço completo (rua, número, bairro, cidade, estado, CEP)';
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
            console.log('Carrinho carregado:', carrinho);
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
    totalPedido = 0;
    
    if (carrinho.length === 0) {
        orderItems.innerHTML = '<div class="order-item"><div class="item-info">Carrinho vazio</div></div>';
        orderTotal.textContent = '0,00';
        return;
    }
    
    carrinho.forEach(item => {
        const subtotal = item.preco_produto * item.quantidade;
        totalPedido += subtotal;
        
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
    
    orderTotal.textContent = totalPedido.toFixed(2).replace('.', ',');
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
    const deliveryAddressValue = deliveryAddress.value;
    const orderNotes = document.getElementById('orderNotes').value;
    
    // Validar campos obrigatórios
    if (!method) {
        alert('Selecione uma forma de pagamento.');
        return;
    }
    
    if (!deliveryAddressValue.trim()) {
        alert('Digite o endereço de entrega.');
        return;
    }
    
    const btnConfirm = document.querySelector('.btn-confirm');
    const originalText = btnConfirm.textContent;
    btnConfirm.textContent = 'Processando...';
    btnConfirm.disabled = true;
    
    try {
        // Preparar dados do pedido
        const itens = carrinho.map(item => ({
            id_produto: item.id_produto,
            nome_produto: item.nome_produto,
            quantidade: item.quantidade,
            preco_unitario: parseFloat(item.preco_produto)
        }));
        
        const dadosPedido = {
            endereco_entrega: deliveryAddressValue,
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
        
        console.log('Enviando pedido para o backend:', dadosPedido);
        
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
            console.log('✅ Pedido criado com sucesso:', resultado);
            
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
                console.error('❌ Erro do servidor:', errorData);
            } catch (parseError) {
                console.error('Erro ao parsear resposta de erro:', parseError);
            }
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('❌ Erro ao processar pagamento:', error);
        alert('Erro ao processar pedido: ' + error.message);
    } finally {
        btnConfirm.textContent = originalText;
        btnConfirm.disabled = false;
    }
}

// Mostrar modal de confirmação - CORRIGIDO
function mostrarModalConfirmacao(method, resultado) {
    if (method === 'pix') {
        modalMessage.textContent = 'Pedido confirmado! Use o QR Code PIX abaixo para pagamento:';
        const valorFormatado = totalPedido.toFixed(2);
        pixAmount.textContent = valorFormatado.replace('.', ',');
        pixAmountDisplay.textContent = valorFormatado.replace('.', ',');
        pixValueDisplay.textContent = valorFormatado.replace('.', ',');
        
        // Gerar QR Code PIX
        gerarQRCodePIX(totalPedido);
        
        pixCode.style.display = 'block';
    } else {
        modalMessage.textContent = `✅ Pedido #${resultado.id_pedido} confirmado com sucesso!`;
        pixCode.style.display = 'none';
    }
    
    modal.classList.add('show');
    modalOverlay.classList.add('show');
}

// GERAR PIX PAYLOAD
function gerarPixPayload({ chave, nome, cidade, valor, txid }) {
    function campo(id, valor) {
        const tamanho = valor.length.toString().padStart(2, "0");
        return id + tamanho + valor;
    }

    const gui = campo("00", "br.gov.bcb.pix");
    const chavePix = campo("01", chave);
    const merchantAccountInfo = campo("26", gui + chavePix);

    const payloadSemCRC =
        "000201" +
        "010212" +
        merchantAccountInfo +
        "52040000" +
        "5303986" +
        campo("54", valor) +
        "5802BR" +
        campo("59", nome) +
        campo("60", cidade) +
        campo("62", campo("05", txid)) +
        "6304";

    const crc = crc16(payloadSemCRC);
    return payloadSemCRC + crc;
}

// CRC16
function crc16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
        }
    }
    crc &= 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Gerar QR Code PIX
function gerarQRCodePIX(valor) {
    // Limpar QR Code anterior
    qrcodeContainer.innerHTML = '';
    
    // Verificar se a biblioteca QRCode está disponível
    if (typeof qrcode === 'undefined') {
        console.error('Biblioteca QRCode não carregada');
        mostrarQRCodeFallback(valor);
        return;
    }
    
    try {
        const payloadPix = gerarPixPayload({
            chave: "12340687969",
            nome: "Deborah Ferraz Pontes",
            cidade: "Peabiru",
            valor: valor.toFixed(2),
            txid: "PIX123ABC"
        });

        console.log('Payload PIX gerado:', payloadPix);
        
        const qr = qrcode(0, 'M');
        qr.addData(payloadPix);
        qr.make();
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 250;
        canvas.width = size;
        canvas.height = size;
        
        const cellSize = size / qr.getModuleCount();
        
        // Fundo branco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        
        // Desenhar módulos do QR Code
        ctx.fillStyle = '#000000';
        for (let row = 0; row < qr.getModuleCount(); row++) {
            for (let col = 0; col < qr.getModuleCount(); col++) {
                if (qr.isDark(row, col)) {
                    ctx.fillRect(
                        col * cellSize,
                        row * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
        
        qrcodeContainer.appendChild(canvas);
        pixCodeText.textContent = payloadPix;
        
        console.log('✅ QR Code PIX gerado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao gerar QR Code:', error);
        mostrarQRCodeFallback(valor);
    }
}

// Mostrar fallback se o QR Code falhar
function mostrarQRCodeFallback(valor) {
    qrcodeContainer.innerHTML = `
        <div style="text-align: center; color: #666; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 10px;">📱</div>
            <p style="font-size: 1.1rem; font-weight: bold; color: #2d4a2d; margin-bottom: 1rem;">
                Pagamento PIX - Valor: R$ ${valor.toFixed(2)}
            </p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px; text-align: left; border: 1px solid #ddd;">
                <p style="margin: 0.5rem 0;"><strong>Chave PIX:</strong> 44997353860</p>
                <p style="margin: 0.5rem 0;"><strong>Nome:</strong> Deborah Ferraz Pontes</p>
                <p style="margin: 0.5rem 0;"><strong>Cidade:</strong> Peabiru - PR</p>
                <p style="margin: 0.5rem 0;"><strong>Valor:</strong> R$ ${valor.toFixed(2)}</p>
                <p style="margin: 0.5rem 0;"><strong>Banco:</strong> Inter</p>
                <p style="margin: 1rem 0 0.5rem 0; font-weight: bold;">Instruções:</p>
                <ol style="margin: 0 0 0 1.2rem; padding: 0; font-size: 0.9rem;">
                    <li style="margin-bottom: 0.3rem;">Abra seu app do banco</li>
                    <li style="margin-bottom: 0.3rem;">Selecione PIX</li>
                    <li style="margin-bottom: 0.3rem;">Escolha "Pagar com chave"</li>
                    <li style="margin-bottom: 0.3rem;">Digite: <strong>44997353860</strong></li>
                    <li style="margin-bottom: 0.3rem;">Confirme o valor de <strong>R$ ${valor.toFixed(2)}</strong></li>
                    <li>Finalize o pagamento</li>
                </ol>
            </div>
        </div>
    `;
}

// Copiar código PIX
function copiarPix() {
    const codigo = pixCodeText.textContent;
    navigator.clipboard.writeText(codigo).then(() => {
        const btnCopy = document.querySelector('.btn-copy');
        const originalText = btnCopy.textContent;
        btnCopy.textContent = 'Copiado!';
        btnCopy.style.background = '#28a745';
        setTimeout(() => {
            btnCopy.textContent = originalText;
            btnCopy.style.background = '#ff6b6b';
        }, 2000);
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        const textArea = document.createElement('textarea');
        textArea.value = codigo;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const btnCopy = document.querySelector('.btn-copy');
        const originalText = btnCopy.textContent;
        btnCopy.textContent = 'Copiado!';
        btnCopy.style.background = '#28a745';
        setTimeout(() => {
            btnCopy.textContent = originalText;
            btnCopy.style.background = '#ff6b6b';
        }, 2000);
    });
}

// Voltar ao carrinho
function voltarCarrinho() {
    window.location.href = '/loja/index.html';
}

// Fechar modal - CORRIGIDO
function fecharModal() {
    modal.classList.remove('show');
    modalOverlay.classList.remove('show');
    // Redirecionar para a loja ao invés de pedido.html que não existe
    window.location.href = '/loja/index.html';
}

// Fechar modal clicando no overlay
modalOverlay.addEventListener('click', fecharModal);
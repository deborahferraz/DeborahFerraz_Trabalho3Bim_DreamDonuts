// Configuração da API
const API_BASE_URL = 'http://localhost:3001';

// Estado da aplicação
let produtos = [];
let carrinho = [];
let usuarioLogado = null;

// Elementos do DOM
const productGrid = document.getElementById('productGrid');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const nomeUsuario = document.getElementById('nomeUsuario');
const btnLogout = document.getElementById('btnLogout');
const btnFinalizarPedido = document.getElementById('btnFinalizarPedido');
const btnAdmin = document.getElementById('btnAdmin');
const modal = document.getElementById('modalConfirmacao');
const modalOverlay = document.getElementById('modalOverlay');

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    configurarEventListeners();
    await verificarLogin();
    await carregarCategorias();
    await carregarProdutos();
    carregarCarrinhoLocalStorage();
});

// -------- VERIFICAÇÃO DE LOGIN - CORRIGIDA --------
async function verificarLogin() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verificar`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.logged && data.id_usuario) {
            usuarioLogado = {
                id_usuario: data.id_usuario,
                nome_usuario: data.nome_usuario,
                email_usuario: data.email_usuario,
                papel: data.papel || 'cliente'
            };
            
            // Atualizar header
            nomeUsuario.textContent = `Bem-vindo, ${usuarioLogado.nome_usuario}!`;
            document.getElementById('authButtons').style.display = 'none';
            document.getElementById('userInfo').style.display = 'flex';

            // Mostrar botão admin apenas se for administrador
            if (usuarioLogado.papel === 'admin' && btnAdmin) {
                btnAdmin.style.display = 'inline-block';
            } else if (btnAdmin) {
                btnAdmin.style.display = 'none';
            }
        } else {
            usuarioLogado = null;
            document.getElementById('authButtons').style.display = 'flex';
            document.getElementById('userInfo').style.display = 'none';
            if (btnAdmin) btnAdmin.style.display = 'none';
        }

        atualizarCarrinho();
    } catch (error) {
        console.error('Erro ao verificar login:', error);
        usuarioLogado = null;
        if (btnAdmin) btnAdmin.style.display = 'none';
    }
}

// -------- LOGOUT - CORRIGIDO --------
async function logout() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, { 
            method: 'POST', 
            credentials: 'include' 
        });
        
        if (response.ok) {
            // Limpar dados locais
            localStorage.removeItem('carrinho');
            carrinho = [];
            usuarioLogado = null;
            
            // Atualizar UI
            document.getElementById('authButtons').style.display = 'flex';
            document.getElementById('userInfo').style.display = 'none';
            if (btnAdmin) btnAdmin.style.display = 'none';
            
            atualizarCarrinho();
            
            // Recarregar para garantir estado limpo
            window.location.reload();
        }
    } catch (err) {
        console.error('Erro no logout:', err);
        alert('Erro ao fazer logout. Tente novamente.');
    }
}

// Configurar event listeners
function configurarEventListeners() {
    // Filtros (delegation)
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('filter-btn')) {
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filtrarProdutos(e.target.dataset.categoria);
        }
    });

    if (btnLogout) btnLogout.addEventListener('click', logout);
}

// Carregar categorias da API
async function carregarCategorias() {
    try {
        const response = await fetch(`${API_BASE_URL}/categoria`);
        if (response.ok) {
            const categorias = await response.json();
            renderizarCategorias(categorias);
        } else {
            console.error('Erro ao carregar categorias');
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

// Renderizar botões de categorias
function renderizarCategorias(categorias) {
    const filterButtons = document.querySelector('.filter-buttons');
    if (!filterButtons) return;
    
    // Limpar botões existentes (exceto o "Todos")
    filterButtons.innerHTML = '<button class="filter-btn active" data-categoria="todos">Todos</button>';
    
    // Adicionar botões das categorias
    categorias.forEach(categoria => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.dataset.categoria = categoria.id_categoria;
        button.textContent = categoria.nome_categoria;
        filterButtons.appendChild(button);
    });
}

// Carregar produtos da API
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_BASE_URL}/donuts`);
        if (response.ok) {
            produtos = await response.json();

            // converte preco_produto para número (garantia extra)
            produtos = produtos.map(p => ({
                ...p,
                preco_produto: Number(p.preco_produto)
            }));

            renderizarProdutos(produtos);
        } else {
            usarProdutosExemplo();
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        usarProdutosExemplo();
    }
}


// Produtos de fallback
function usarProdutosExemplo() {
    produtos = [
        { id_produto:1, nome_produto:'Donut Glazed', descricao_produto:'Donut clássico', preco_produto:4.50, categoria_id:1 },
        { id_produto:2, nome_produto:'Donut Chocolate', descricao_produto:'Cobertura de chocolate', preco_produto:5.00, categoria_id:1 },
        { id_produto:3, nome_produto:'Donut Morango', descricao_produto:'Cobertura de morango', preco_produto:5.50, categoria_id:1 }
    ];
    renderizarProdutos(produtos);
}

// Renderizar produtos
function renderizarProdutos(produtosParaRenderizar) {
    productGrid.innerHTML = '';
    produtosParaRenderizar.forEach(produto => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Usar imagem real do produto ou fallback para emoji
        const imagemSrc = produto.imagem_produto ? `${API_BASE_URL}${produto.imagem_produto}` : null;
        const imagemHtml = imagemSrc ? 
            `<img src="${imagemSrc}" alt="${produto.nome_produto}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
             <div class="product-image-fallback" style="display:none;">🍩</div>` :
            `<div class="product-image-fallback">🍩</div>`;
        
        productCard.innerHTML = `
            <div class="product-image">
                ${imagemHtml}
            </div>
            <div class="product-info">
                <h3 class="product-name">${produto.nome_produto}</h3>
                <p class="product-description">${produto.descricao_produto || ''}</p>
                <div class="product-price">R$ ${produto.preco_produto.toFixed(2).replace('.', ',')}</div>
                <div class="product-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="alterarQuantidade(${produto.id_produto}, -1)">-</button>
                        <input type="number" class="quantity-input" id="qty-${produto.id_produto}" value="1" min="1" max="10">
                        <button class="quantity-btn" onclick="alterarQuantidade(${produto.id_produto}, 1)">+</button>
                    </div>
                    <button class="btn-add-cart" data-prod="${produto.id_produto}" onclick="adicionarAoCarrinho(event, ${produto.id_produto})">
                        Adicionar
                    </button>
                </div>
            </div>
        `;
        productGrid.appendChild(productCard);
    });
}

function alterarQuantidade(produtoId, delta) {
    const input = document.getElementById(`qty-${produtoId}`);
    if (!input) return;
    let quantidade = parseInt(input.value) + delta;
    if (isNaN(quantidade)) quantidade = 1;
    if (quantidade < 1) quantidade = 1;
    if (quantidade > 10) quantidade = 10;
    input.value = quantidade;
}

function adicionarAoCarrinho(ev, produtoId) {
    const produto = produtos.find(p => p.id_produto === produtoId);
    const quantidadeInput = document.getElementById(`qty-${produtoId}`);
    const quantidade = parseInt(quantidadeInput?.value || '1');
    if (!produto) return;
    const itemExistente = carrinho.find(item => item.id_produto === produtoId);
    if (itemExistente) itemExistente.quantidade += quantidade;
    else carrinho.push({ id_produto: produto.id_produto, nome_produto: produto.nome_produto, preco_produto: produto.preco_produto, quantidade });
    atualizarCarrinho();
    salvarCarrinhoLocalStorage();

    const btn = document.querySelector(`.btn-add-cart[data-prod="${produtoId}"]`);
    if (btn) {
        const txt = btn.textContent;
        btn.textContent = 'Adicionado!';
        btn.disabled = true;
        setTimeout(()=>{ btn.textContent = txt; btn.disabled = false; }, 900);
    }
}

function atualizarCarrinho() {
    const totalItens = carrinho.reduce((t,i)=>t+i.quantidade,0);
    cartCount.textContent = totalItens;
    cartItems.innerHTML = '';

    if (carrinho.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <p>Seu carrinho está vazio</p>
                <p>Adicione alguns donuts deliciosos!</p>
            </div>
        `;
        if (btnFinalizarPedido) { 
            btnFinalizarPedido.style.display = 'none'; 
            btnFinalizarPedido.disabled = true; 
        }
    } else {
        carrinho.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nome_produto}</div>
                    <div class="cart-item-price">R$ ${item.preco_produto.toFixed(2).replace('.', ',')}</div>
                    <div class="cart-item-quantity">
                        <button class="cart-quantity-btn" onclick="alterarQuantidadeCarrinho(${item.id_produto}, -1)">-</button>
                        <span class="cart-quantity-display">${item.quantidade}</span>
                        <button class="cart-quantity-btn" onclick="alterarQuantidadeCarrinho(${item.id_produto}, 1)">+</button>
                        <button class="cart-quantity-btn" onclick="removerDoCarrinho(${item.id_produto})" style="background: #e74c3c; margin-left: 10px;">🗑️</button>
                    </div>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });

        // mostrar botão de pagamento somente se usuário logado
        if (usuarioLogado && btnFinalizarPedido) {
            btnFinalizarPedido.style.display = 'block';
            btnFinalizarPedido.disabled = false;
        } else if (btnFinalizarPedido) {
            btnFinalizarPedido.style.display = 'none';
            btnFinalizarPedido.disabled = true;
        }
    }

    const total = carrinho.reduce((t,i)=>t + (i.preco_produto * i.quantidade), 0);
    cartTotal.textContent = total.toFixed(2).replace('.', ',');
}

function alterarQuantidadeCarrinho(produtoId, delta) {
    const item = carrinho.find(x => x.id_produto === produtoId);
    if (!item) return;
    item.quantidade += delta;
    if (item.quantidade <= 0) removerDoCarrinho(produtoId);
    else { atualizarCarrinho(); salvarCarrinhoLocalStorage(); }
}

function removerDoCarrinho(produtoId) {
    carrinho = carrinho.filter(i => i.id_produto !== produtoId);
    atualizarCarrinho();
    salvarCarrinhoLocalStorage();
}

function toggleCarrinho() {
    cartSidebar.classList.toggle('open');
    cartOverlay.classList.toggle('show');
}

// FUNÇÃO CORRIGIDA - REDIRECIONAMENTO PARA PAGAMENTO
async function finalizarPedido() {
    if (!usuarioLogado) {
        alert("Você precisa fazer login para finalizar o pedido.");
        window.location.href = "/auth/login.html";
        return;
    }
    if (carrinho.length === 0) return;
    
    // REDIRECIONAMENTO CORRETO PARA A ROTA DO SERVIDOR
    window.location.href = "/pagamento";
}

function mostrarModal() {
    modal.classList.add('show');
    modalOverlay.classList.add('show');
}
function fecharModal() {
    modal.classList.remove('show');
    modalOverlay.classList.remove('show');
}

async function logout() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
        if (response.ok) {
            localStorage.removeItem('carrinho');
            usuarioLogado = null;
            document.getElementById('authButtons').style.display = 'flex';
            document.getElementById('userInfo').style.display = 'none';
            if (btnAdmin) btnAdmin.style.display = 'none';
            atualizarCarrinho();
            window.location.reload();
        }
    } catch (err) {
        console.error('Erro no logout:', err);
        window.location.reload();
    }
}

function salvarCarrinhoLocalStorage() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}
function carregarCarrinhoLocalStorage() {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
        try { carrinho = JSON.parse(carrinhoSalvo); } catch(_) { carrinho = []; }
        atualizarCarrinho();
    }
}

// fechar overlays com clique fora
document.addEventListener('click', (e) => { if (e.target === cartOverlay) toggleCarrinho(); });
document.addEventListener('click', (e) => { if (e.target === modalOverlay) fecharModal(); });

// Filtrar produtos por categoria
function filtrarProdutos(categoriaId) {
    let produtosFiltrados = [];
    if (categoriaId === 'todos') {
        produtosFiltrados = produtos;
    } else {
        produtosFiltrados = produtos.filter(produto => produto.categoria_id == categoriaId);
    }
    renderizarProdutos(produtosFiltrados);
}
let produtoAtual = null;
let modoAtual = 'visualizacao'; // 'visualizacao', 'edicao', 'adicao'
let categoriasDisponiveis = [];

// -------- CARREGAR CATEGORIAS DISPONÍVEIS --------
async function carregarCategorias() {
    try {
        const response = await fetch('http://localhost:3001/categoria');
        if (response.ok) {
            categoriasDisponiveis = await response.json();
            console.log('Categorias carregadas:', categoriasDisponiveis);
            
            // Atualizar a dica de categorias disponíveis
            atualizarDicaCategorias();
        }
    } catch (erro) {
        console.error('Erro ao carregar categorias:', erro);
    }
}

// -------- ATUALIZAR DICA DE CATEGORIAS --------
function atualizarDicaCategorias() {
    const dicaCategoria = document.getElementById('dica-categoria');
    if (!dicaCategoria) return;

    if (categoriasDisponiveis.length > 0) {
        const idsCategorias = categoriasDisponiveis.map(cat => cat.id_categoria).join(', ');
        dicaCategoria.innerHTML = `Categorias válidas: ${idsCategorias}`;
    } else {
        dicaCategoria.innerHTML = 'Nenhuma categoria cadastrada';
    }
}

// -------- VALIDAR CATEGORIA --------
function validarCategoria(categoriaId) {
    if (!categoriaId || categoriaId === '') return true; // Permite vazio/null
    
    const id = parseInt(categoriaId);
    const categoriaExiste = categoriasDisponiveis.some(cat => cat.id_categoria === id);
    
    if (!categoriaExiste) {
        mostrarMensagem(`Categoria ID ${categoriaId} não existe! Use uma categoria válida.`, 'error');
        return false;
    }
    
    return true;
}

// -------- CONTROLE DE BOTÕES --------
function atualizarBotoes() {
    const btnAdicionar = document.getElementById('btn-adicionar');
    const btnAlterar = document.getElementById('btn-alterar');
    const btnExcluir = document.getElementById('btn-excluir');
    const btnSalvar = document.getElementById('btn-salvar');

    // Esconder todos inicialmente
    btnAdicionar.style.display = 'none';
    btnAlterar.style.display = 'none';
    btnExcluir.style.display = 'none';
    btnSalvar.style.display = 'none';

    if (modoAtual === 'visualizacao') {
        if (produtoAtual) {
            // Produto encontrado - mostrar Alterar e Excluir
            btnAlterar.style.display = 'inline-block';
            btnExcluir.style.display = 'inline-block';
        } else {
            // Produto não encontrado - mostrar Adicionar apenas se tiver ID na busca
            const idBuscado = document.getElementById('buscar-id').value;
            if (idBuscado) {
                btnAdicionar.style.display = 'inline-block';
            }
        }
    } else if (modoAtual === 'edicao' || modoAtual === 'adicao') {
        // Modo edição ou adição - mostrar Salvar
        btnSalvar.style.display = 'inline-block';
    }
}

// -------- BUSCAR PRODUTO --------
async function buscarProduto() {
    const id = document.getElementById('buscar-id').value;
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'error');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3001/produto/${id}`);
        if (!response.ok) throw new Error('Produto não encontrado');

        produtoAtual = await response.json();
        preencherFormulario(produtoAtual);
        habilitarFormulario(false);
        modoAtual = 'visualizacao';
        atualizarBotoes();
    } catch (erro) {
        // Produto não encontrado - mostrar botão Adicionar
        produtoAtual = null;
        limparFormulario();
        document.getElementById('display_id').value = id;
        document.getElementById('id_produto').value = id;
        habilitarFormulario(false);
        modoAtual = 'visualizacao';
        atualizarBotoes();
    }
}

// -------- PREENCHER FORMULÁRIO --------
function preencherFormulario(produto) {
    document.getElementById('id_produto').value = produto.id_produto;
    document.getElementById('display_id').value = produto.id_produto;
    document.getElementById('nome_produto').value = produto.nome_produto;
    document.getElementById('descricao_produto').value = produto.descricao_produto || '';
    document.getElementById('preco_produto').value = produto.preco_produto;
    document.getElementById('quantidade_estoque').value = produto.quantidade_estoque;
    document.getElementById('categoria_id').value = produto.categoria_id || '';
    document.getElementById('ativo').value = produto.ativo ? 'true' : 'false';
}

// -------- LIMPAR FORMULÁRIO --------
function limparFormulario() {
    document.getElementById('form-produto').reset();
    document.getElementById('id_produto').value = '';
    document.getElementById('display_id').value = '';
}

// -------- HABILITAR/DESABILITAR FORMULÁRIO --------
function habilitarFormulario(habilitar) {
    const campos = ['nome_produto', 'descricao_produto', 'preco_produto', 
                   'quantidade_estoque', 'imagem_produto', 'categoria_id', 'ativo'];
    campos.forEach(campo => {
        document.getElementById(campo).disabled = !habilitar;
    });
}

// -------- MODO ADICIONAR --------
function modoAdicionar() {
    const idBuscado = document.getElementById('buscar-id').value;
    if (!idBuscado) {
        mostrarMensagem('Primeiro busque por um ID para adicionar um produto com esse ID', 'error');
        return;
    }

    // Configurar o ID para o novo produto
    document.getElementById('id_produto').value = idBuscado;
    document.getElementById('display_id').value = idBuscado;
    
    // Limpar outros campos e habilitar formulário
    document.getElementById('nome_produto').value = '';
    document.getElementById('descricao_produto').value = '';
    document.getElementById('preco_produto').value = '';
    document.getElementById('quantidade_estoque').value = '';
    document.getElementById('categoria_id').value = '';
    document.getElementById('ativo').value = 'true';
    
    habilitarFormulario(true);
    modoAtual = 'adicao';
    produtoAtual = null;
    atualizarBotoes();
}

// -------- MODO EDITAR --------
function modoEditar() {
    if (!produtoAtual) return;
    habilitarFormulario(true);
    modoAtual = 'edicao';
    atualizarBotoes();
}

// -------- CANCELAR BUSCA --------
function cancelarBusca() {
    document.getElementById('buscar-id').value = '';
    limparFormulario();
    habilitarFormulario(false);
    produtoAtual = null;
    modoAtual = 'visualizacao';
    atualizarBotoes();
}

// -------- SALVAR PRODUTO --------
const form = document.getElementById('form-produto');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar categoria antes de enviar
    const categoriaId = document.getElementById('categoria_id').value;
    if (!validarCategoria(categoriaId)) {
        return; // Impede o envio se a categoria for inválida
    }

    const formData = new FormData();
    const fileInput = document.getElementById('imagem_produto');

    // Adicionar campos ao FormData
    formData.append('nome_produto', document.getElementById('nome_produto').value);
    formData.append('descricao_produto', document.getElementById('descricao_produto').value);
    formData.append('preco_produto', document.getElementById('preco_produto').value.replace(',', '.'));
    formData.append('quantidade_estoque', document.getElementById('quantidade_estoque').value);
    formData.append('categoria_id', categoriaId);
    
    const ativoValue = document.getElementById('ativo').value === 'true';
    formData.append('ativo', ativoValue);

    // SEMPRE enviar o id_produto no modo adição
    const idProduto = document.getElementById('id_produto').value;
    if (modoAtual === 'adicao' && idProduto) {
        formData.append('id_produto', idProduto);
    }

    if (fileInput.files[0]) {
        formData.append('imagem_produto', fileInput.files[0]);
    }

    try {
        let response;
        if (modoAtual === 'edicao') {
            // Editar produto existente
            response = await fetch(`http://localhost:3001/produto/${produtoAtual.id_produto}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            // Adicionar novo produto
            response = await fetch('http://localhost:3001/produto', {
                method: 'POST',
                body: formData
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao salvar produto');
        }

        const produtoSalvo = await response.json();
        mostrarMensagem('Produto salvo com sucesso!', 'success');
        
        // Atualizar a busca com o produto salvo
        document.getElementById('buscar-id').value = produtoSalvo.id_produto;
        await buscarProduto();
        carregarProdutos();
    } catch (erro) {
        console.error('Erro ao salvar produto:', erro);
        mostrarMensagem('Erro ao salvar produto: ' + erro.message, 'error');
    }
});

// -------- EXCLUIR PRODUTO --------
async function excluirProduto() {
    if (!produtoAtual || !confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
        const response = await fetch(`http://localhost:3001/produto/${produtoAtual.id_produto}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Erro ao excluir produto');

        mostrarMensagem('Produto excluído com sucesso!', 'success');
        cancelarBusca();
        carregarProdutos();
    } catch (erro) {
        console.error('Erro ao excluir produto:', erro);
        mostrarMensagem('Erro ao excluir produto', 'error');
    }
}

// -------- CARREGAR PRODUTOS --------
async function carregarProdutos() {
    try {
        const response = await fetch('http://localhost:3001/produto');
        if (!response.ok) throw new Error('Erro ao buscar produtos');

        const produtos = await response.json();
        const tabela = document.getElementById('lista-produtos');
        tabela.innerHTML = '';

        produtos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.id_produto}</td>
                <td>${p.nome_produto}</td>
                <td>${p.descricao_produto || ''}</td>
                <td>R$ ${(parseFloat(p.preco_produto) || 0).toFixed(2)}</td>
                <td>${p.quantidade_estoque}</td>
                <td><img src="${p.imagem_produto || ''}" alt="img" width="50"></td>
                <td>${p.categoria_id}</td>
                <td>${p.ativo ? 'Sim' : 'Não'}</td>
                <td>${new Date(p.data_criacao).toLocaleDateString()}</td>
            `;
            tabela.appendChild(tr);
        });
    } catch (erro) {
        console.error('Erro ao carregar produtos:', erro);
    }
}

// -------- MOSTRAR MENSAGEM --------
function mostrarMensagem(msg, tipo) {
    // Remove mensagens existentes
    const mensagensExistentes = document.querySelectorAll('.mensagem-flutuante');
    mensagensExistentes.forEach(msg => msg.remove());

    const mensagem = document.createElement('div');
    mensagem.className = `mensagem-flutuante ${tipo}`;
    mensagem.textContent = msg;
    mensagem.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    if (tipo === 'error') {
        mensagem.style.backgroundColor = '#dc3545';
    } else if (tipo === 'success') {
        mensagem.style.backgroundColor = '#28a745';
    } else {
        mensagem.style.backgroundColor = '#17a2b8';
    }

    document.body.appendChild(mensagem);

    setTimeout(() => {
        mensagem.remove();
    }, 5000);
}

// -------- INICIAR --------
document.addEventListener('DOMContentLoaded', async () => {
    await carregarCategorias(); // Carrega categorias primeiro
    carregarProdutos();
    habilitarFormulario(false);
    atualizarBotoes();
});
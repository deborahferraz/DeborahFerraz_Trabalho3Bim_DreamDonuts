const API_URL = "/categoria";
let categoriaAtual = null;
let modoAtual = 'visualizacao'; // 'visualizacao', 'edicao', 'adicao'

document.addEventListener("DOMContentLoaded", () => {
  carregarCategorias();
  habilitarFormulario(false);
  atualizarBotoes();
});

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
        if (categoriaAtual) {
            // Categoria encontrada - mostrar Alterar e Excluir
            btnAlterar.style.display = 'inline-block';
            btnExcluir.style.display = 'inline-block';
        } else {
            // Categoria não encontrada - mostrar Adicionar apenas se tiver ID na busca
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

// -------- BUSCAR CATEGORIA --------
async function buscarCategoria() {
    const id = document.getElementById('buscar-id').value;
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Categoria não encontrada');

        categoriaAtual = await response.json();
        preencherFormulario(categoriaAtual);
        habilitarFormulario(false);
        modoAtual = 'visualizacao';
        atualizarBotoes();
        mostrarMensagem('Categoria encontrada!', 'success');
    } catch (erro) {
        // Categoria não encontrada - mostrar botão Adicionar
        categoriaAtual = null;
        limparFormulario();
        document.getElementById('display_id').value = id;
        habilitarFormulario(false);
        modoAtual = 'visualizacao';
        atualizarBotoes();
        mostrarMensagem('Categoria não encontrada', 'info');
    }
}

// -------- PREENCHER FORMULÁRIO --------
function preencherFormulario(categoria) {
    document.getElementById('id_categoria').value = categoria.id_categoria;
    document.getElementById('display_id').value = categoria.id_categoria;
    document.getElementById('nome_categoria').value = categoria.nome_categoria;
    document.getElementById('descricao_categoria').value = categoria.descricao_categoria || '';
}

// -------- LIMPAR FORMULÁRIO --------
function limparFormulario() {
    document.getElementById('form-categoria').reset();
    document.getElementById('id_categoria').value = '';
    document.getElementById('display_id').value = '';
}

// -------- HABILITAR/DESABILITAR FORMULÁRIO --------
function habilitarFormulario(habilitar) {
    const campos = ['nome_categoria', 'descricao_categoria'];
    campos.forEach(campo => {
        document.getElementById(campo).disabled = !habilitar;
    });
}

// -------- MODO ADICIONAR --------
function modoAdicionar() {
    const idBuscado = document.getElementById('buscar-id').value;
    if (!idBuscado) {
        mostrarMensagem('Primeiro busque por um ID para verificar disponibilidade', 'error');
        return;
    }

    // Configurar para nova categoria
    document.getElementById('display_id').value = 'Nova categoria';
    
    // Limpar outros campos e habilitar formulário
    document.getElementById('nome_categoria').value = '';
    document.getElementById('descricao_categoria').value = '';
    
    habilitarFormulario(true);
    modoAtual = 'adicao';
    categoriaAtual = null;
    atualizarBotoes();
}

// -------- MODO EDITAR --------
function modoEditar() {
    if (!categoriaAtual) return;
    habilitarFormulario(true);
    modoAtual = 'edicao';
    atualizarBotoes();
}

// -------- CANCELAR BUSCA --------
function cancelarBusca() {
    document.getElementById('buscar-id').value = '';
    limparFormulario();
    habilitarFormulario(false);
    categoriaAtual = null;
    modoAtual = 'visualizacao';
    atualizarBotoes();
}

// -------- SALVAR CATEGORIA --------
const form = document.getElementById('form-categoria');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const categoria = {
        nome_categoria: document.getElementById('nome_categoria').value.trim(),
        descricao_categoria: document.getElementById('descricao_categoria').value.trim()
    };

    // Validações
    if (!categoria.nome_categoria) {
        mostrarMensagem('Nome da categoria é obrigatório', 'error');
        return;
    }

    try {
        let response;
        if (modoAtual === 'edicao') {
            // Editar categoria existente
            response = await fetch(`${API_URL}/${categoriaAtual.id_categoria}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoria)
            });
        } else {
            // Adicionar nova categoria
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoria)
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao salvar categoria');
        }

        const categoriaSalva = await response.json();
        mostrarMensagem('Categoria salva com sucesso!', 'success');
        
        // Atualizar a busca com a categoria salva
        document.getElementById('buscar-id').value = categoriaSalva.id_categoria;
        await buscarCategoria();
        carregarCategorias();
    } catch (erro) {
        console.error('Erro ao salvar categoria:', erro);
        mostrarMensagem('Erro ao salvar categoria: ' + erro.message, 'error');
    }
});

// -------- EXCLUIR CATEGORIA - CORRIGIDA --------
async function excluirCategoria() {
    if (!categoriaAtual) return;
    
    if (!confirm('Tem certeza que deseja excluir esta categoria?\n\nProdutos inativos associados serão desvinculados automaticamente.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${categoriaAtual.id_categoria}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao excluir categoria');
        }

        const result = await response.json();
        
        let mensagem = 'Categoria excluída com sucesso!';
        if (result.produtos_afetados > 0) {
            mensagem += ` ${result.produtos_afetados} produto(s) inativo(s) foram desvinculado(s).`;
        }
        
        mostrarMensagem(mensagem, 'success');
        cancelarBusca();
        carregarCategorias();
    } catch (erro) {
        console.error('Erro ao excluir categoria:', erro);
        mostrarMensagem('Erro ao excluir categoria: ' + erro.message, 'error');
    }
}

// -------- CARREGAR CATEGORIAS --------
async function carregarCategorias() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Erro ao buscar categorias');

        const categorias = await response.json();
        const tabela = document.getElementById('lista-categorias');
        tabela.innerHTML = '';

        categorias.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.id_categoria}</td>
                <td>${c.nome_categoria}</td>
                <td>${c.descricao_categoria || ''}</td>
            `;
            tabela.appendChild(tr);
        });
    } catch (erro) {
        console.error('Erro ao carregar categorias:', erro);
        mostrarMensagem('Erro ao carregar categorias', 'error');
    }
}

// -------- FUNÇÕES AUXILIARES --------
function mostrarMensagem(msg, tipo) {
    const container = document.getElementById('messageContainer');
    container.textContent = msg;
    container.className = `message ${tipo}`;
    container.style.display = 'block';
    
    setTimeout(() => {
        container.textContent = '';
        container.className = 'message-container';
        container.style.display = 'none';
    }, 5000);
}
// FORMA_PAGAMENTO.JS - CARREGADO!
console.log('✅ forma_pagamento.js carregado com sucesso!');

let formaPagamentoAtual = null;
let modoAtual = 'visualizacao';

// -------- DEBUG DE CARREGAMENTO --------
console.log('🔧 Inicializando CRUD Formas de Pagamento');
console.log('📡 URL da API:', '/forma_pagamento');

// -------- CONTROLE DE BOTÕES --------
function atualizarBotoes() {
    console.log('🔄 Atualizando botões, modo:', modoAtual);
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
        if (formaPagamentoAtual) {
            btnAlterar.style.display = 'inline-block';
            btnExcluir.style.display = 'inline-block';
            console.log('✅ Mostrando botões Alterar/Excluir');
        } else {
            const idBuscado = document.getElementById('buscar-id').value;
            if (idBuscado) {
                btnAdicionar.style.display = 'inline-block';
                console.log('✅ Mostrando botão Adicionar');
            }
        }
    } else if (modoAtual === 'edicao' || modoAtual === 'adicao') {
        btnSalvar.style.display = 'inline-block';
        console.log('✅ Mostrando botão Salvar');
    }
}

// -------- BUSCAR FORMA DE PAGAMENTO --------
async function buscarFormaPagamento() {
    const id = document.getElementById('buscar-id').value;
    console.log('🔍 Buscando forma de pagamento ID:', id);
    
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'error');
        return;
    }

    try {
        const response = await fetch(`/forma_pagamento/${id}`);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Forma de pagamento não encontrada');
        }

        formaPagamentoAtual = await response.json();
        console.log('✅ Forma de pagamento encontrada:', formaPagamentoAtual);
        
        preencherFormulario(formaPagamentoAtual);
        habilitarFormulario(false);
        modoAtual = 'visualizacao';
        atualizarBotoes();
        mostrarMensagem('Forma de pagamento encontrada!', 'success');
    } catch (erro) {
        console.log('❌ Forma de pagamento não encontrada, permitindo adição');
        formaPagamentoAtual = null;
        limparFormulario();
        document.getElementById('display_id').value = id;
        document.getElementById('id_forma_pagamento').value = id;
        habilitarFormulario(false);
        modoAtual = 'visualizacao';
        atualizarBotoes();
        mostrarMensagem('Forma de pagamento não encontrada. Você pode adicionar uma nova.', 'info');
    }
}

// -------- PREENCHER FORMULÁRIO --------
function preencherFormulario(formaPagamento) {
    console.log('📝 Preenchendo formulário com:', formaPagamento);
    document.getElementById('id_forma_pagamento').value = formaPagamento.id_forma_pagamento;
    document.getElementById('display_id').value = formaPagamento.id_forma_pagamento;
    document.getElementById('nome_forma_pagamento').value = formaPagamento.nome_forma_pagamento || '';
    document.getElementById('ativo').value = formaPagamento.ativo ? 'true' : 'false';
}

// -------- LIMPAR FORMULÁRIO --------
function limparFormulario() {
    console.log('🧹 Limpando formulário');
    document.getElementById('form-forma-pagamento').reset();
    document.getElementById('id_forma_pagamento').value = '';
    document.getElementById('display_id').value = '';
}

// -------- HABILITAR/DESABILITAR FORMULÁRIO --------
function habilitarFormulario(habilitar) {
    console.log('🎛️ Habilitando formulário:', habilitar);
    const campos = ['nome_forma_pagamento', 'ativo'];
    campos.forEach(campo => {
        document.getElementById(campo).disabled = !habilitar;
    });
}

// -------- MODO ADICIONAR --------
function modoAdicionar() {
    const idBuscado = document.getElementById('buscar-id').value;
    console.log('➕ Modo adicionar para ID:', idBuscado);
    
    if (!idBuscado) {
        mostrarMensagem('Primeiro busque por um ID para adicionar uma forma de pagamento com esse ID', 'error');
        return;
    }

    document.getElementById('id_forma_pagamento').value = idBuscado;
    document.getElementById('display_id').value = idBuscado;
    document.getElementById('nome_forma_pagamento').value = '';
    document.getElementById('ativo').value = 'true';
    
    habilitarFormulario(true);
    modoAtual = 'adicao';
    formaPagamentoAtual = null;
    atualizarBotoes();
    mostrarMensagem('Preencha os dados da nova forma de pagamento', 'info');
}

// -------- MODO EDITAR --------
function modoEditar() {
    console.log('✏️ Modo editar');
    if (!formaPagamentoAtual) return;
    habilitarFormulario(true);
    modoAtual = 'edicao';
    atualizarBotoes();
    mostrarMensagem('Altere os dados da forma de pagamento', 'info');
}

// -------- CANCELAR BUSCA --------
function cancelarBusca() {
    console.log('❌ Cancelando busca');
    document.getElementById('buscar-id').value = '';
    limparFormulario();
    habilitarFormulario(false);
    formaPagamentoAtual = null;
    modoAtual = 'visualizacao';
    atualizarBotoes();
    mostrarMensagem('Busca cancelada', 'info');
}

// -------- SALVAR FORMA DE PAGAMENTO --------
const form = document.getElementById('form-forma-pagamento');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('💾 Salvando forma de pagamento...');

    const formData = {
        nome_forma_pagamento: document.getElementById('nome_forma_pagamento').value,
        ativo: document.getElementById('ativo').value
    };

    console.log('📦 Dados a serem enviados:', formData);

    if (!formData.nome_forma_pagamento.trim()) {
        mostrarMensagem('O nome da forma de pagamento é obrigatório', 'error');
        return;
    }

    try {
        let response;
        if (modoAtual === 'edicao') {
            console.log('🔄 Editando forma de pagamento existente');
            response = await fetch(`/forma_pagamento/${formaPagamentoAtual.id_forma_pagamento}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        } else {
            console.log('🆕 Adicionando nova forma de pagamento');
            response = await fetch('/forma_pagamento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        }

        console.log('📡 Status da resposta:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao salvar forma de pagamento');
        }

        const formaPagamentoSalva = await response.json();
        console.log('✅ Forma de pagamento salva:', formaPagamentoSalva);
        
        mostrarMensagem('Forma de pagamento salva com sucesso!', 'success');
        
        document.getElementById('buscar-id').value = formaPagamentoSalva.id_forma_pagamento;
        await buscarFormaPagamento();
        carregarFormasPagamento();
    } catch (erro) {
        console.error('❌ Erro ao salvar forma de pagamento:', erro);
        mostrarMensagem('Erro ao salvar forma de pagamento: ' + erro.message, 'error');
    }
});

// -------- EXCLUIR FORMA DE PAGAMENTO --------
async function excluirFormaPagamento() {
    console.log('🗑️ Excluindo forma de pagamento');
    if (!formaPagamentoAtual || !confirm('Tem certeza que deseja excluir esta forma de pagamento?')) return;

    try {
        const response = await fetch(`/forma_pagamento/${formaPagamentoAtual.id_forma_pagamento}`, {
            method: 'DELETE'
        });
        
        console.log('📡 Status da exclusão:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao excluir forma de pagamento');
        }

        mostrarMensagem('Forma de pagamento excluída com sucesso!', 'success');
        cancelarBusca();
        carregarFormasPagamento();
    } catch (erro) {
        console.error('❌ Erro ao excluir forma de pagamento:', erro);
        mostrarMensagem('Erro ao excluir forma de pagamento: ' + erro.message, 'error');
    }
}

// -------- CARREGAR FORMAS DE PAGAMENTO --------
async function carregarFormasPagamento() {
    console.log('📋 Carregando lista de formas de pagamento...');
    try {
        const response = await fetch('/forma_pagamento');
        console.log('📡 Status da lista:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro do servidor:', errorText);
            throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
        }

        const formasPagamento = await response.json();
        console.log('✅ Formas de pagamento carregadas:', formasPagamento.length);
        
        const tabela = document.getElementById('lista-formas-pagamento');
        tabela.innerHTML = '';

        if (formasPagamento.length === 0) {
            tabela.innerHTML = '<tr><td colspan="3" style="text-align: center;">Nenhuma forma de pagamento cadastrada</td></tr>';
            return;
        }

        formasPagamento.forEach(fp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${fp.id_forma_pagamento}</td>
                <td>${fp.nome_forma_pagamento}</td>
                <td>${fp.ativo ? 'Sim' : 'Não'}</td>
            `;
            tabela.appendChild(tr);
        });
    } catch (erro) {
        console.error('❌ Erro ao carregar formas de pagamento:', erro);
        const tabela = document.getElementById('lista-formas-pagamento');
        tabela.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #dc3545;">Erro ao carregar formas de pagamento: ' + erro.message + '</td></tr>';
    }
}

// -------- MOSTRAR MENSAGEM --------
function mostrarMensagem(msg, tipo) {
    console.log(`💬 Mensagem [${tipo}]:`, msg);
    const mensagensExistentes = document.querySelectorAll('.mensagem-flutuante');
    mensagensExistentes.forEach(msg => msg.remove());

    const mensagem = document.createElement('div');
    mensagem.className = `mensagem-flutuante ${tipo}`;
    mensagem.textContent = msg;

    document.body.appendChild(mensagem);

    setTimeout(() => {
        mensagem.remove();
    }, 5000);
}

// -------- INICIAR --------
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM Carregado - Iniciando aplicação...');
    console.log('📍 URL atual:', window.location.href);
    
    // Testar conexão com a API
    try {
        const testResponse = await fetch('/health');
        console.log('🏥 Health check:', testResponse.status);
    } catch (error) {
        console.error('❌ Servidor não está respondendo:', error);
        mostrarMensagem('Erro de conexão com o servidor', 'error');
    }
    
    await carregarFormasPagamento();
    habilitarFormulario(false);
    atualizarBotoes();
    
    console.log('✅ Aplicação inicializada com sucesso!');
});
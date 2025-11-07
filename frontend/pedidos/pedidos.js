const API_URL = "http://localhost:3001/pedido";
let pedidoAtual = null;
let modoAtual = 'visualizacao';

document.addEventListener("DOMContentLoaded", () => {
  carregarPedidos();
  habilitarFormulario(false);
  atualizarBotoes();
});

// -------- CONTROLE DE BOTÕES - CORRIGIDO --------
function atualizarBotoes() {
    const btnAlterar = document.getElementById('btn-alterar');
    const btnExcluir = document.getElementById('btn-excluir');
    const formActions = document.getElementById('form-actions');

    // Resetar todos os botões
    btnAlterar.style.display = 'none';
    btnExcluir.style.display = 'none';
    if (formActions) {
        formActions.style.display = 'none';
    }

    if (modoAtual === 'visualizacao' && pedidoAtual) {
        // Modo visualização - mostrar Alterar/Excluir
        btnAlterar.style.display = 'inline-block';
        btnExcluir.style.display = 'inline-block';
    } else if (modoAtual === 'edicao' && pedidoAtual) {
        // Modo edição - mostrar Salvar/Cancelar
        if (formActions) {
            formActions.style.display = 'flex';
        }
    }
}

// -------- BUSCAR PEDIDO --------
async function buscarPedido() {
    const idInput = document.getElementById('buscar-id');
    const id = idInput.value.trim();
    
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'error');
        return;
    }

    // Validar se é número
    if (isNaN(id)) {
        mostrarMensagem('ID deve ser um número válido', 'error');
        return;
    }

    try {
        console.log(`🔍 Buscando pedido ID: ${id}`);
        
        const response = await fetch(`${API_URL}/${id}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Pedido não encontrado');
            } else if (response.status === 400) {
                throw new Error('ID do pedido inválido');
            }
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        pedidoAtual = await response.json();
        console.log('✅ Pedido encontrado:', pedidoAtual);
        
        preencherFormulario(pedidoAtual);
        habilitarFormulario(false);
        modoAtual = 'visualizacao';
        atualizarBotoes();
        mostrarMensagem(`Pedido #${pedidoAtual.id_pedido} encontrado!`, 'success');
        
    } catch (erro) {
        console.error('❌ Erro ao buscar pedido:', erro);
        pedidoAtual = null;
        limparFormulario();
        habilitarFormulario(false);
        modoAtual = 'visualizacao';
        atualizarBotoes();
        mostrarMensagem(erro.message, 'error');
    }
}

// -------- PREENCHER FORMULÁRIO --------
function preencherFormulario(pedido) {
    console.log('Preenchendo formulário com:', pedido);
    
    document.getElementById('id_pedido').value = pedido.id_pedido || '';
    document.getElementById('display_id').value = pedido.id_pedido || '';
    document.getElementById('usuario_id').value = pedido.usuario_id || '';
    document.getElementById('nome_usuario').value = pedido.nome_usuario || 'N/A';
    document.getElementById('status_pedido').value = pedido.status_pedido || 'pendente';
    document.getElementById('valor_total').value = pedido.valor_total ? `R$ ${parseFloat(pedido.valor_total).toFixed(2)}` : 'R$ 0,00';
    document.getElementById('data_pedido').value = pedido.data_pedido ? new Date(pedido.data_pedido).toLocaleString('pt-BR') : '';
    document.getElementById('observacoes').value = pedido.observacoes || '';

    // Preencher endereço
    preencherEndereco(pedido);
    
    // Preencher itens do pedido
    preencherItensPedido(pedido.itens || []);
}

function preencherEndereco(pedido) {
    const container = document.getElementById('endereco-info');
    
    // Usar endereco_entrega que é salvo no pedido
    if (pedido.endereco_entrega) {
        container.innerHTML = `
            <p><strong>Endereço de Entrega:</strong></p>
            <p style="background: #f0f8ff; padding: 10px; border-radius: 5px; border-left: 4px solid #2d4a2d;">
                ${pedido.endereco_entrega}
            </p>
        `;
    } else {
        container.innerHTML = '<p>Endereço não informado</p>';
    }
}

// -------- PREENCHER ITENS PEDIDO --------
function preencherItensPedido(itens) {
    const tbody = document.getElementById('itens-pedido');
    const totalElement = document.getElementById('total-pedido');
    
    tbody.innerHTML = '';
    
    if (!itens || itens.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum item encontrado</td></tr>';
        totalElement.textContent = 'R$ 0,00';
        return;
    }

    let total = 0;
    
    itens.forEach(item => {
        // Garantir que os valores são números
        const quantidade = Number(item.quantidade) || 0;
        const precoUnitario = Number(item.preco_unitario) || 0;
        const subtotal = Number(item.subtotal) || (quantidade * precoUnitario);
        
        total += subtotal;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nome_produto || 'Produto não encontrado'}</td>
            <td>${quantidade}</td>
            <td>R$ ${precoUnitario.toFixed(2)}</td>
            <td>R$ ${subtotal.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    totalElement.textContent = `R$ ${total.toFixed(2)}`;
}

// -------- LIMPAR FORMULÁRIO --------
function limparFormulario() {
    document.getElementById('form-pedido').reset();
    document.getElementById('id_pedido').value = '';
    document.getElementById('display_id').value = '';
    document.getElementById('endereco-info').innerHTML = '';
    document.getElementById('itens-pedido').innerHTML = '';
    document.getElementById('total-pedido').textContent = 'R$ 0,00';
    
    // Garantir que os botões de edição estão escondidos
    const formActions = document.getElementById('form-actions');
    if (formActions) {
        formActions.style.display = 'none';
    }
}

// -------- HABILITAR/DESABILITAR FORMULÁRIO --------
function habilitarFormulario(habilitar) {
    const campos = ['status_pedido'];
    campos.forEach(campo => {
        const element = document.getElementById(campo);
        if (element) {
            element.disabled = !habilitar;
        }
    });
}

// -------- MODO EDITAR - CORRIGIDO --------
function modoEditar() {
    if (!pedidoAtual) {
        mostrarMensagem('Nenhum pedido selecionado para editar', 'error');
        return;
    }
    
    habilitarFormulario(true);
    modoAtual = 'edicao';
    atualizarBotoes();
    
    mostrarMensagem('Modo de edição ativado. Altere o status do pedido e clique em Salvar.', 'info');
}

// -------- CANCELAR EDIÇÃO - NOVA FUNÇÃO --------
function cancelarEdicao() {
    if (!pedidoAtual) return;
    
    // Restaurar dados originais
    preencherFormulario(pedidoAtual);
    habilitarFormulario(false);
    modoAtual = 'visualizacao';
    atualizarBotoes();
    
    mostrarMensagem('Edição cancelada. Alterações não salvas.', 'warning');
}

// -------- SALVAR PEDIDO - CORRIGIDO --------
const form = document.getElementById('form-pedido');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (modoAtual !== 'edicao' || !pedidoAtual) {
        return;
    }

    const dadosAtualizacao = {
        status_pedido: document.getElementById('status_pedido').value
    };

    // Mostrar loading
    const btnSalvar = document.querySelector('.btn-save');
    const textoOriginal = btnSalvar.textContent;
    btnSalvar.textContent = 'Salvando...';
    btnSalvar.disabled = true;

    try {
        const response = await fetch(`${API_URL}/${pedidoAtual.id_pedido}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(dadosAtualizacao)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Erro ${response.status}: ${response.statusText}`);
        }

        const pedidoAtualizado = await response.json();
        
        mostrarMensagem(`✅ Status do pedido atualizado para: ${getStatusText(dadosAtualizacao.status_pedido)}`, 'success');
        
        // Atualizar interface
        await buscarPedido();
        await carregarPedidos();
        
        // Voltar para modo visualização
        modoAtual = 'visualizacao';
        habilitarFormulario(false);
        atualizarBotoes();
        
    } catch (erro) {
        console.error('Erro ao atualizar pedido:', erro);
        mostrarMensagem('❌ Erro ao atualizar pedido: ' + erro.message, 'error');
    } finally {
        // Restaurar botão
        btnSalvar.textContent = textoOriginal;
        btnSalvar.disabled = false;
    }
});

// -------- CANCELAR BUSCA --------
function cancelarBusca() {
    document.getElementById('buscar-id').value = '';
    limparFormulario();
    habilitarFormulario(false);
    pedidoAtual = null;
    modoAtual = 'visualizacao';
    atualizarBotoes();
    mostrarMensagem('Busca cancelada', 'info');
}

// -------- EXCLUIR PEDIDO --------
async function excluirPedido() {
    if (!pedidoAtual) {
        mostrarMensagem('Nenhum pedido selecionado para excluir', 'error');
        return;
    }

    if (!confirm(`Tem certeza que deseja excluir o pedido #${pedidoAtual.id_pedido}? Esta ação não pode ser desfeita.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${pedidoAtual.id_pedido}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        mostrarMensagem('✅ ' + (resultado.message || 'Pedido excluído com sucesso!'), 'success');
        cancelarBusca();
        await carregarPedidos();
    } catch (erro) {
        console.error('Erro ao excluir pedido:', erro);
        mostrarMensagem('❌ Erro ao excluir pedido: ' + erro.message, 'error');
    }
}

// -------- CARREGAR PEDIDOS --------
async function carregarPedidos() {
    try {
        const response = await fetch(API_URL, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const pedidos = await response.json();
        const tabela = document.getElementById('lista-pedidos');
        tabela.innerHTML = '';

        if (pedidos.length === 0) {
            tabela.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum pedido cadastrado</td></tr>';
            return;
        }

        pedidos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.id_pedido}</td>
                <td>${p.nome_usuario || `Usuário ${p.usuario_id}`}</td>
                <td>
                    <span class="status-badge status-${p.status_pedido}">
                        ${getStatusText(p.status_pedido)}
                    </span>
                </td>
                <td>R$ ${p.valor_total ? parseFloat(p.valor_total).toFixed(2) : '0,00'}</td>
                <td>${p.data_pedido ? new Date(p.data_pedido).toLocaleDateString('pt-BR') : ''}</td>
                <td>${p.forma_pagamento ? formatarPagamento(p.forma_pagamento) : 'N/A'}</td>
            `;
            
            // Adicionar clique para carregar pedido
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', () => {
                document.getElementById('buscar-id').value = p.id_pedido;
                buscarPedido();
            });
            
            tabela.appendChild(tr);
        });
    } catch (erro) {
        console.error('Erro ao carregar pedidos:', erro);
        mostrarMensagem('❌ Erro ao carregar pedidos: ' + erro.message, 'error');
    }
}

// -------- FUNÇÕES AUXILIARES --------
function mostrarMensagem(msg, tipo) {
    // Remover mensagens existentes
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
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    if (tipo === 'error') {
        mensagem.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
    } else if (tipo === 'success') {
        mensagem.style.background = 'linear-gradient(135deg, #28a745, #218838)';
    } else if (tipo === 'info') {
        mensagem.style.background = 'linear-gradient(135deg, #17a2b8, #138496)';
    } else if (tipo === 'warning') {
        mensagem.style.background = 'linear-gradient(135deg, #ffc107, #e0a800)';
        mensagem.style.color = 'black';
    }
    
    document.body.appendChild(mensagem);

    setTimeout(() => {
        if (mensagem.parentNode) {
            mensagem.remove();
        }
    }, 5000);
}

function getStatusText(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'confirmado': 'Confirmado',
        'preparando': 'Preparando',
        'saiu_entrega': 'Saiu para Entrega',
        'entregue': 'Entregue',
        'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
}

function formatarPagamento(forma) {
    const formas = {
        'cartao_credito': 'Cartão Crédito',
        'cartao_debito': 'Cartão Débito',
        'pix': 'PIX',
        'dinheiro': 'Dinheiro'
    };
    return formas[forma] || forma;
}

// Adicionar estilos para os status
const style = document.createElement('style');
style.textContent = `
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: bold;
        text-transform: uppercase;
    }
    .status-pendente { background: #fff3cd; color: #856404; }
    .status-confirmado { background: #d1ecf1; color: #0c5460; }
    .status-preparando { background: #ffeaa7; color: #856404; }
    .status-saiu_entrega { background: #b8daff; color: #004085; }
    .status-entregue { background: #d4edda; color: #155724; }
    .status-cancelado { background: #f8d7da; color: #721c24; }
    
    #lista-pedidos tr:hover {
        background-color: #f0fff0 !important;
        cursor: pointer;
    }
    
    .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 2px solid #e0f2e0;
    }
    
    .btn-save {
        background: linear-gradient(135deg, #28a745, #218838);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .btn-save:hover {
        background: linear-gradient(135deg, #218838, #1e7e34);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
    }
    
    .btn-save:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
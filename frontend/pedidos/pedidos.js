const API_URL = "http://localhost:3001/pedido";
let pedidoAtual = null;
let modoAtual = 'visualizacao';

document.addEventListener("DOMContentLoaded", () => {
  carregarPedidos();
  habilitarFormulario(false);
  atualizarBotoes();
});

// -------- CONTROLE DE BOTÕES --------
function atualizarBotoes() {
    const btnAlterar = document.getElementById('btn-alterar');
    const btnExcluir = document.getElementById('btn-excluir');

    btnAlterar.style.display = 'none';
    btnExcluir.style.display = 'none';

    if (modoAtual === 'visualizacao' && pedidoAtual) {
        btnAlterar.style.display = 'inline-block';
        btnExcluir.style.display = 'inline-block';
    }
}

// -------- BUSCAR PEDIDO --------
async function buscarPedido() {
    const id = document.getElementById('buscar-id').value;
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Pedido não encontrado');
            }
            throw new Error('Erro na requisição');
        }

        pedidoAtual = await response.json();
        preencherFormulario(pedidoAtual);
        habilitarFormulario(false);
        modoAtual = 'visualizacao';
        atualizarBotoes();
        mostrarMensagem('Pedido encontrado!', 'success');
    } catch (erro) {
        pedidoAtual = null;
        limparFormulario();
        habilitarFormulario(false);
        modoAtual = 'visualizacao';
        atualizarBotoes();
        mostrarMensagem('Pedido não encontrado.', 'error');
    }
}

// -------- PREENCHER FORMULÁRIO --------
function preencherFormulario(pedido) {
    document.getElementById('id_pedido').value = pedido.id_pedido || '';
    document.getElementById('display_id').value = pedido.id_pedido || '';
    document.getElementById('usuario_id').value = pedido.usuario_id || '';
    document.getElementById('nome_usuario').value = pedido.nome_usuario || '';
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
    
    // Priorizar endereço_entrega se existir, senão usar dados do endereço
    if (pedido.endereco_entrega) {
        container.innerHTML = `
            <p><strong>Endereço de Entrega:</strong></p>
            <p>${pedido.endereco_entrega}</p>
        `;
    } else if (pedido.rua && pedido.numero) {
        container.innerHTML = `
            <p><strong>${pedido.rua}, ${pedido.numero}</strong></p>
            <p>${pedido.complemento ? pedido.complemento + ' - ' : ''}${pedido.bairro}</p>
            <p>${pedido.cidade} - ${pedido.estado}</p>
            <p>CEP: ${pedido.cep || ''}</p>
        `;
    } else {
        container.innerHTML = '<p>Endereço não encontrado</p>';
    }
}

function preencherItensPedido(itens) {
    const tbody = document.getElementById('itens-pedido');
    const totalElement = document.getElementById('total-pedido');
    
    tbody.innerHTML = '';
    
    if (itens.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum item encontrado</td></tr>';
        totalElement.textContent = 'R$ 0,00';
        return;
    }

    let total = 0;
    
    itens.forEach(item => {
        const subtotal = item.subtotal || (item.quantidade * item.preco_unitario) || 0;
        total += subtotal;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nome_produto || 'Produto não encontrado'}</td>
            <td>${item.quantidade || 0}</td>
            <td>R$ ${item.preco_unitario ? parseFloat(item.preco_unitario).toFixed(2) : '0,00'}</td>
            <td>R$ ${parseFloat(subtotal).toFixed(2)}</td>
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

// -------- MODO EDITAR --------
function modoEditar() {
    if (!pedidoAtual) {
        mostrarMensagem('Nenhum pedido selecionado para editar', 'error');
        return;
    }
    habilitarFormulario(true);
    modoAtual = 'edicao';
    atualizarBotoes();
    mostrarMensagem('Modo de edição ativado. Altere o status do pedido.', 'info');
}

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

// -------- SALVAR PEDIDO --------
const form = document.getElementById('form-pedido');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (modoAtual !== 'edicao' || !pedidoAtual) {
        return;
    }

    const dadosAtualizacao = {
        status_pedido: document.getElementById('status_pedido').value
    };

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
        
        mostrarMensagem(`Status do pedido atualizado para: ${dadosAtualizacao.status_pedido}`, 'success');
        
        // Atualizar interface
        await buscarPedido();
        await carregarPedidos();
        
        // Voltar para modo visualização
        modoAtual = 'visualizacao';
        habilitarFormulario(false);
        atualizarBotoes();
        
    } catch (erro) {
        console.error('Erro ao atualizar pedido:', erro);
        mostrarMensagem('Erro ao atualizar pedido: ' + erro.message, 'error');
    }
});

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
        mostrarMensagem(resultado.message || 'Pedido excluído com sucesso!', 'success');
        cancelarBusca();
        await carregarPedidos();
    } catch (erro) {
        console.error('Erro ao excluir pedido:', erro);
        mostrarMensagem('Erro ao excluir pedido: ' + erro.message, 'error');
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
            tabela.appendChild(tr);
        });
    } catch (erro) {
        console.error('Erro ao carregar pedidos:', erro);
        mostrarMensagem('Erro ao carregar pedidos: ' + erro.message, 'error');
    }
}

// -------- FUNÇÕES AUXILIARES --------
function mostrarMensagem(msg, tipo) {
    const mensagensExistentes = document.querySelectorAll('.mensagem-flutuante');
    mensagensExistentes.forEach(msg => msg.remove());

    const mensagem = document.createElement('div');
    mensagem.className = `mensagem-flutuante ${tipo}`;
    mensagem.textContent = msg;
    
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
`;
document.head.appendChild(style);
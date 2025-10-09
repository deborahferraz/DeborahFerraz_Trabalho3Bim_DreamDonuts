const API_URL = "http://localhost:3001/endereco";
let enderecoAtual = null;
let modoAtual = 'visualizacao';

document.addEventListener("DOMContentLoaded", () => {
  carregarEnderecos();
  habilitarFormulario(false);
  atualizarBotoes();
  
  // Adicionar formatação automática do CEP
  const cepInput = document.getElementById("cep");
  if (cepInput) {
    cepInput.addEventListener("input", formatarCEP);
  }
});

// -------- CONTROLE DE BOTÕES --------
function atualizarBotoes() {
    const btnAdicionar = document.getElementById('btn-adicionar');
    const btnAlterar = document.getElementById('btn-alterar');
    const btnExcluir = document.getElementById('btn-excluir');
    const btnSalvar = document.getElementById('btn-salvar');

    btnAdicionar.style.display = 'none';
    btnAlterar.style.display = 'none';
    btnExcluir.style.display = 'none';
    btnSalvar.style.display = 'none';

    if (modoAtual === 'visualizacao') {
        if (enderecoAtual) {
            btnAlterar.style.display = 'inline-block';
            btnExcluir.style.display = 'inline-block';
        } else {
            const idBuscado = document.getElementById('buscar-id').value;
            if (idBuscado) {
                btnAdicionar.style.display = 'inline-block';
            }
        }
    } else if (modoAtual === 'edicao' || modoAtual === 'adicao') {
        btnSalvar.style.display = 'inline-block';
    }
}

// -------- BUSCAR ENDEREÇO --------
async function buscarEndereco() {
    const id = document.getElementById('buscar-id').value;
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Endereço não encontrado');
            }
            throw new Error('Erro na requisição');
        }

        enderecoAtual = await response.json();
        preencherFormulario(enderecoAtual);
        habilitarFormulario(false);
        modoAtual = 'visualizacao';
        atualizarBotoes();
        mostrarMensagem('Endereço encontrado!', 'success');
    } catch (erro) {
        enderecoAtual = null;
        limparFormulario();
        document.getElementById('display_id').value = id;
        document.getElementById('id_endereco').value = id;
        habilitarFormulario(false);
        modoAtual = 'visualizacao';
        atualizarBotoes();
        mostrarMensagem('Endereço não encontrado. Você pode criar um novo endereço com este ID.', 'info');
    }
}

// -------- PREENCHER FORMULÁRIO --------
function preencherFormulario(endereco) {
    document.getElementById('id_endereco').value = endereco.id_endereco || '';
    document.getElementById('display_id').value = endereco.id_endereco || '';
    document.getElementById('usuario_id').value = endereco.usuario_id || '';
    document.getElementById('rua').value = endereco.rua || '';
    document.getElementById('numero').value = endereco.numero || '';
    document.getElementById('complemento').value = endereco.complemento || '';
    document.getElementById('bairro').value = endereco.bairro || '';
    document.getElementById('cidade').value = endereco.cidade || '';
    document.getElementById('estado').value = endereco.estado || '';
    document.getElementById('cep').value = endereco.cep || '';
}

// -------- LIMPAR FORMULÁRIO --------
function limparFormulario() {
    document.getElementById('form-endereco').reset();
    document.getElementById('id_endereco').value = '';
    document.getElementById('display_id').value = '';
}

// -------- HABILITAR/DESABILITAR FORMULÁRIO --------
function habilitarFormulario(habilitar) {
    const campos = ['usuario_id', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep'];
    campos.forEach(campo => {
        const element = document.getElementById(campo);
        if (element) {
            element.disabled = !habilitar;
        }
    });
}

// -------- MODO ADICIONAR --------
function modoAdicionar() {
    const idBuscado = document.getElementById('buscar-id').value;
    if (!idBuscado) {
        mostrarMensagem('Primeiro busque por um ID para adicionar um endereço com esse ID', 'error');
        return;
    }

    document.getElementById('id_endereco').value = idBuscado;
    document.getElementById('display_id').value = idBuscado;
    
    // Limpar e preparar formulário para novo endereço
    document.getElementById('usuario_id').value = '';
    document.getElementById('rua').value = '';
    document.getElementById('numero').value = '';
    document.getElementById('complemento').value = '';
    document.getElementById('bairro').value = '';
    document.getElementById('cidade').value = '';
    document.getElementById('estado').value = '';
    document.getElementById('cep').value = '';
    
    habilitarFormulario(true);
    modoAtual = 'adicao';
    enderecoAtual = null;
    atualizarBotoes();
    mostrarMensagem('Modo de adição ativado. Preencha os dados do novo endereço.', 'info');
}

// -------- MODO EDITAR --------
function modoEditar() {
    if (!enderecoAtual) {
        mostrarMensagem('Nenhum endereço selecionado para editar', 'error');
        return;
    }
    habilitarFormulario(true);
    modoAtual = 'edicao';
    atualizarBotoes();
    mostrarMensagem('Modo de edição ativado. Faça as alterações necessárias.', 'info');
}

// -------- CANCELAR BUSCA --------
function cancelarBusca() {
    document.getElementById('buscar-id').value = '';
    limparFormulario();
    habilitarFormulario(false);
    enderecoAtual = null;
    modoAtual = 'visualizacao';
    atualizarBotoes();
    mostrarMensagem('Busca cancelada', 'info');
}

// -------- SALVAR ENDEREÇO --------
const form = document.getElementById('form-endereco');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const endereco = {
        usuario_id: parseInt(document.getElementById('usuario_id').value),
        rua: document.getElementById('rua').value.trim(),
        numero: document.getElementById('numero').value.trim(),
        complemento: document.getElementById('complemento').value.trim(),
        bairro: document.getElementById('bairro').value.trim(),
        cidade: document.getElementById('cidade').value.trim(),
        estado: document.getElementById('estado').value,
        cep: limparCEP(document.getElementById('cep').value)
    };

    // Validações
    if (!endereco.usuario_id || !endereco.rua || !endereco.numero || !endereco.bairro || !endereco.cidade || !endereco.estado || !endereco.cep) {
        mostrarMensagem('Todos os campos obrigatórios devem ser preenchidos', 'error');
        return;
    }

    try {
        let response;
        const idEndereco = document.getElementById('id_endereco').value;

        if (modoAtual === 'edicao') {
            // EDITAR endereço existente
            response = await fetch(`${API_URL}/${enderecoAtual.id_endereco}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(endereco)
            });
        } else {
            // ADICIONAR novo endereço
            endereco.id_endereco = parseInt(idEndereco);
            
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(endereco)
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Erro ${response.status}: ${response.statusText}`);
        }

        const enderecoSalvo = await response.json();
        
        mostrarMensagem(`Endereço ${modoAtual === 'edicao' ? 'atualizado' : 'criado'} com sucesso! ID: ${enderecoSalvo.id_endereco}`, 'success');
        
        // Atualizar interface
        document.getElementById('buscar-id').value = enderecoSalvo.id_endereco;
        await buscarEndereco();
        await carregarEnderecos();
        
        // Voltar para modo visualização
        modoAtual = 'visualizacao';
        habilitarFormulario(false);
        atualizarBotoes();
        
    } catch (erro) {
        console.error('Erro ao salvar endereço:', erro);
        
        // Tratamento específico para erro de usuário já ter endereço
        if (erro.message.includes('já possui um endereço cadastrado')) {
            mostrarMensagem('Erro: Este usuário já possui um endereço cadastrado', 'error');
        } else {
            mostrarMensagem('Erro ao salvar endereço: ' + erro.message, 'error');
        }
    }
});

// -------- EXCLUIR ENDEREÇO --------
async function excluirEndereco() {
    if (!enderecoAtual) {
        mostrarMensagem('Nenhum endereço selecionado para excluir', 'error');
        return;
    }

    if (!confirm(`Tem certeza que deseja excluir o endereço "${enderecoAtual.rua}, ${enderecoAtual.numero}" (ID: ${enderecoAtual.id_endereco})?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${enderecoAtual.id_endereco}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        mostrarMensagem(resultado.message || 'Endereço excluído com sucesso!', 'success');
        cancelarBusca();
        await carregarEnderecos();
    } catch (erro) {
        console.error('Erro ao excluir endereço:', erro);
        mostrarMensagem('Erro ao excluir endereço: ' + erro.message, 'error');
    }
}

// -------- CARREGAR ENDEREÇOS --------
async function carregarEnderecos() {
    try {
        const response = await fetch(API_URL, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const enderecos = await response.json();
        const tabela = document.getElementById('lista-enderecos');
        tabela.innerHTML = '';

        if (enderecos.length === 0) {
            tabela.innerHTML = '<tr><td colspan="9" style="text-align: center;">Nenhum endereço cadastrado</td></tr>';
            return;
        }

        enderecos.forEach(e => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${e.id_endereco}</td>
                <td>${e.usuario_id || ''}</td>
                <td>${e.nome_usuario || ''}</td>
                <td>${e.rua || ''}</td>
                <td>${e.numero || ''}</td>
                <td>${e.bairro || ''}</td>
                <td>${e.cidade || ''}</td>
                <td>${e.estado || ''}</td>
                <td>${e.cep || ''}</td>
            `;
            tabela.appendChild(tr);
        });
    } catch (erro) {
        console.error('Erro ao carregar endereços:', erro);
        mostrarMensagem('Erro ao carregar endereços: ' + erro.message, 'error');
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

function formatarCEP(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 8) {
        value = value.substring(0, 8);
    }
    
    if (value.length > 5) {
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    e.target.value = value;
}

function limparCEP(cep) {
    return cep.replace(/\D/g, '');
}
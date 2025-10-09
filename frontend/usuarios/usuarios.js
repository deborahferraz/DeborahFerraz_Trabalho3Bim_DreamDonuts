const API_URL = "http://localhost:3001/api/usuarios";
let usuarioAtual = null;
let modoAtual = 'visualizacao';

document.addEventListener("DOMContentLoaded", () => {
  carregarUsuarios();
  habilitarFormulario(false);
  atualizarBotoes();
  
  // Adicionar formatação automática do CPF
  const cpfInput = document.getElementById("cpf_usuario");
  if (cpfInput) {
    cpfInput.addEventListener("input", formatarCPF);
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
        if (usuarioAtual) {
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

// -------- BUSCAR USUÁRIO --------
async function buscarUsuario() {
    const id = document.getElementById('buscar-id').value;
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Usuário não encontrado');
            }
            throw new Error('Erro na requisição');
        }

        usuarioAtual = await response.json();
        preencherFormulario(usuarioAtual);
        habilitarFormulario(false);
        modoAtual = 'visualizacao';
        atualizarBotoes();
        mostrarMensagem('Usuário encontrado!', 'success');
    } catch (erro) {
        usuarioAtual = null;
        limparFormulario();
        document.getElementById('display_id').value = id;
        document.getElementById('id_usuario').value = id;
        habilitarFormulario(false);
        modoAtual = 'visualizacao';
        atualizarBotoes();
        mostrarMensagem('Usuário não encontrado. Você pode criar um novo usuário com este ID.', 'info');
    }
}

// -------- PREENCHER FORMULÁRIO --------
function preencherFormulario(usuario) {
    document.getElementById('id_usuario').value = usuario.id_usuario || '';
    document.getElementById('display_id').value = usuario.id_usuario || '';
    document.getElementById('nome_usuario').value = usuario.nome_usuario || '';
    document.getElementById('email_usuario').value = usuario.email_usuario || '';
    document.getElementById('senha_usuario').value = ''; // Sempre limpar senha por segurança
    document.getElementById('cpf_usuario').value = usuario.cpf_usuario || '';
    
    if (usuario.nascimento_usuario) {
        const data = new Date(usuario.nascimento_usuario);
        document.getElementById('nascimento_usuario').value = data.toISOString().split('T')[0];
    } else {
        document.getElementById('nascimento_usuario').value = '';
    }
    
    document.getElementById('ativo').value = usuario.ativo ? 'true' : 'false';
    document.getElementById('papel').value = usuario.papel || 'usuario';
}

// -------- LIMPAR FORMULÁRIO --------
function limparFormulario() {
    document.getElementById('form-usuario').reset();
    document.getElementById('id_usuario').value = '';
    document.getElementById('display_id').value = '';
}

// -------- HABILITAR/DESABILITAR FORMULÁRIO --------
function habilitarFormulario(habilitar) {
    const campos = ['nome_usuario', 'email_usuario', 'senha_usuario', 
                   'cpf_usuario', 'nascimento_usuario', 'ativo', 'papel'];
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
        mostrarMensagem('Primeiro busque por um ID para adicionar um usuário com esse ID', 'error');
        return;
    }

    document.getElementById('id_usuario').value = idBuscado;
    document.getElementById('display_id').value = idBuscado;
    
    // Limpar e preparar formulário para novo usuário
    document.getElementById('nome_usuario').value = '';
    document.getElementById('email_usuario').value = '';
    document.getElementById('senha_usuario').value = '';
    document.getElementById('cpf_usuario').value = '';
    document.getElementById('nascimento_usuario').value = '';
    document.getElementById('ativo').value = 'true';
    document.getElementById('papel').value = 'usuario';
    
    habilitarFormulario(true);
    modoAtual = 'adicao';
    usuarioAtual = null;
    atualizarBotoes();
    mostrarMensagem('Modo de adição ativado. Preencha os dados do novo usuário.', 'info');
}

// -------- MODO EDITAR --------
function modoEditar() {
    if (!usuarioAtual) {
        mostrarMensagem('Nenhum usuário selecionado para editar', 'error');
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
    usuarioAtual = null;
    modoAtual = 'visualizacao';
    atualizarBotoes();
    mostrarMensagem('Busca cancelada', 'info');
}

// -------- SALVAR USUÁRIO --------
const form = document.getElementById('form-usuario');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = {
        nome_usuario: document.getElementById('nome_usuario').value.trim(),
        email_usuario: document.getElementById('email_usuario').value.trim(),
        senha_usuario: document.getElementById('senha_usuario').value,
        cpf_usuario: limparCPF(document.getElementById('cpf_usuario').value),
        nascimento_usuario: document.getElementById('nascimento_usuario').value,
        ativo: document.getElementById('ativo').value === 'true',
        papel: document.getElementById('papel').value
    };

    // Validações
    if (!usuario.nome_usuario || !usuario.email_usuario) {
        mostrarMensagem('Nome e email são obrigatórios', 'error');
        return;
    }

    if (modoAtual === 'adicao' && !usuario.senha_usuario) {
        mostrarMensagem('Senha é obrigatória para novo usuário', 'error');
        return;
    }

    if (usuario.cpf_usuario && usuario.cpf_usuario.length !== 11) {
        mostrarMensagem('CPF deve ter 11 dígitos', 'error');
        return;
    }

    try {
        let response;
        const idUsuario = document.getElementById('id_usuario').value;

        if (modoAtual === 'edicao') {
            // EDITAR usuário existente
            response = await fetch(`${API_URL}/${usuarioAtual.id_usuario}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(usuario)
            });
        } else {
            // ADICIONAR novo usuário
            usuario.id_usuario = parseInt(idUsuario);
            
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(usuario)
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Erro ${response.status}: ${response.statusText}`);
        }

        const usuarioSalvo = await response.json();
        
        mostrarMensagem(`Usuário ${modoAtual === 'edicao' ? 'atualizado' : 'criado'} com sucesso! ID: ${usuarioSalvo.id_usuario}`, 'success');
        
        // Atualizar interface
        document.getElementById('buscar-id').value = usuarioSalvo.id_usuario;
        await buscarUsuario();
        await carregarUsuarios();
        
        // Voltar para modo visualização
        modoAtual = 'visualizacao';
        habilitarFormulario(false);
        atualizarBotoes();
        
    } catch (erro) {
        console.error('Erro ao salvar usuário:', erro);
        mostrarMensagem('Erro ao salvar usuário: ' + erro.message, 'error');
    }
});

// -------- EXCLUIR USUÁRIO --------
async function excluirUsuario() {
    if (!usuarioAtual) {
        mostrarMensagem('Nenhum usuário selecionado para excluir', 'error');
        return;
    }

    if (!confirm(`Tem certeza que deseja excluir o usuário "${usuarioAtual.nome_usuario}" (ID: ${usuarioAtual.id_usuario})?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${usuarioAtual.id_usuario}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        mostrarMensagem(resultado.message || 'Usuário excluído com sucesso!', 'success');
        cancelarBusca();
        await carregarUsuarios();
    } catch (erro) {
        console.error('Erro ao excluir usuário:', erro);
        mostrarMensagem('Erro ao excluir usuário: ' + erro.message, 'error');
    }
}

// -------- CARREGAR USUÁRIOS --------
async function carregarUsuarios() {
    try {
        const response = await fetch(API_URL, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const usuarios = await response.json();
        const tabela = document.getElementById('lista-usuarios');
        tabela.innerHTML = '';

        if (usuarios.length === 0) {
            tabela.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum usuário cadastrado</td></tr>';
            return;
        }

        usuarios.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.id_usuario}</td>
                <td>${u.nome_usuario || ''}</td>
                <td>${u.email_usuario || ''}</td>
                <td>${u.cpf_usuario || ''}</td>
                <td>${u.ativo ? 'Sim' : 'Não'}</td>
                <td>${u.papel || 'usuario'}</td>
                <td>${u.data_cadastro ? new Date(u.data_cadastro).toLocaleDateString('pt-BR') : ''}</td>
            `;
            tabela.appendChild(tr);
        });
    } catch (erro) {
        console.error('Erro ao carregar usuários:', erro);
        mostrarMensagem('Erro ao carregar usuários: ' + erro.message, 'error');
    }
}

// -------- FUNÇÕES AUXILIARES --------
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
    } else if (tipo === 'info') {
        mensagem.style.backgroundColor = '#17a2b8';
    } else {
        mensagem.style.backgroundColor = '#ffc107';
        mensagem.style.color = 'black';
    }

    document.body.appendChild(mensagem);

    setTimeout(() => {
        mensagem.remove();
    }, 5000);
}

function formatarCPF(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 11) {
        value = value.substring(0, 11);
    }
    
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    e.target.value = value;
}

function limparCPF(cpf) {
    return cpf.replace(/\D/g, '');
}
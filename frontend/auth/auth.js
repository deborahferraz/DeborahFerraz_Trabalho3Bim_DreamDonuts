const API_BASE_URL = 'http://localhost:3001';

// Utilitário para mensagens de feedback
export function mostrarMensagem(el, texto, tipo = 'erro') {
  el.textContent = texto;
  el.className = `mensagem ${tipo}`;
  el.style.display = 'block';
  setTimeout(() => (el.style.display = 'none'), 4000);
}

// Verifica sessão
export async function verificarSessao() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verificar`, {
      credentials: 'include'
    });
    return await response.json();
  } catch (err) {
    console.error('Erro ao verificar sessão:', err);
    return { logged: false };
  }
}

// Faz login
export async function login(email, senha) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        email_usuario: email, 
        senha_usuario: senha 
      })
    });
    return await response.json();
  } catch (err) {
    console.error('Erro no login:', err);
    return { error: 'Erro de conexão com o servidor' };
  }
}

// Faz registro
export async function registrar(dados) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(dados)
    });
    return await response.json();
  } catch (err) {
    console.error('Erro no registro:', err);
    return { error: 'Erro de conexão com o servidor' };
  }
}

// Logout
export async function logout() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return await response.json();
  } catch (err) {
    console.error('Erro no logout:', err);
    return { error: 'Erro de conexão' };
  }
}
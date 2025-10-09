const API_BASE_URL = 'http://localhost:3001';

// Utilitário para mensagens de feedback
export function mostrarMensagem(el, texto, tipo = 'erro') {
  el.textContent = texto;
  el.className = `mensagem ${tipo}`;
  el.style.display = 'block';
  setTimeout(() => (el.style.display = 'none'), 4000);
}

// Verifica sessão e retorna { logged, nome }
export async function verificarSessao() {
  try {
    const r = await fetch(`${API_BASE_URL}/auth/user`, {
      credentials: 'include'
    });
    return await r.json();
  } catch (err) {
    console.error('Erro ao verificar sessão:', err);
    return { logged: false };
  }
}

// Faz login
export async function login(email, senha) {
  const r = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email_usuario: email, senha_usuario: senha })
  });
  return await r.json();
}

// Faz registro
export async function registrar(dados) {
  const r = await fetch(`${API_BASE_URL}/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(dados)
  });
  return await r.json();
}

// Logout
export async function logout() {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
}

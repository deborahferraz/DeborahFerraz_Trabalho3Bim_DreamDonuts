import { login, mostrarMensagem } from './auth.js';

const loginForm = document.getElementById('loginForm');
const mensagem = document.getElementById('mensagem');

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();
  if (!email || !senha) return mostrarMensagem(mensagem, 'Preencha todos os campos.');

  const btn = loginForm.querySelector('.btn-login');
  const original = btn.textContent;
  btn.textContent = 'Entrando...';
  btn.disabled = true;

  try {
   const data = await login(email, senha);
if (data.user && data.user.id_usuario) {
  mostrarMensagem(mensagem, 'Login realizado! Redirecionando...', 'sucesso');
  setTimeout(() => (window.location.href = '../loja/index.html'), 1200);
} else {
  mostrarMensagem(mensagem, data.error || 'Email ou senha inválidos.');
}
  } catch (err) {
    console.error(err);
    mostrarMensagem(mensagem, 'Erro de conexão.');
  } finally {
    btn.textContent = original;
    btn.disabled = false;
  }
});

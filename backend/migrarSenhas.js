// migrarSenhas.js
const bcrypt = require('bcrypt');
const db = require('./database');

async function migrarSenhas() {
  try {
    const result = await db.query('SELECT id_usuario, senha_usuario FROM usuarios');

    for (const user of result.rows) {
      const { id_usuario, senha_usuario } = user;

      // Se já for hash bcrypt (começa com "$2b$"), pula
      if (senha_usuario && senha_usuario.startsWith('$2b$')) {
        console.log(`Usuário ${id_usuario} já tem senha hashada, pulando.`);
        continue;
      }

      // Gera hash
      const hash = await bcrypt.hash(senha_usuario, 10);

      // Atualiza no banco
      await db.query(
        'UPDATE usuarios SET senha_usuario = $1 WHERE id_usuario = $2',
        [hash, id_usuario]
      );

      console.log(`Senha do usuário ${id_usuario} migrada com sucesso!`);
    }

    console.log('✅ Migração concluída!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro na migração:', err);
    process.exit(1);
  }
}

migrarSenhas();

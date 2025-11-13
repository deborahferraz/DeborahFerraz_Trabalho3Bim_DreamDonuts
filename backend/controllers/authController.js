const db = require('../database');
const bcrypt = require('bcrypt');

// -------- REGISTRO --------
exports.registro = async (req, res) => {
  const {
    name, email, password, cpf, birthdate,
    cidade, estado, rua, numero, cep, complemento, bairro
  } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });

  // Validação de CPF
  if (cpf && cpf.length !== 11) {
    return res.status(400).json({ error: 'CPF deve ter 11 dígitos.' });
  }

  // Validação de CEP
  if (cep && cep.length !== 8) {
    return res.status(400).json({ error: 'CEP deve ter 8 dígitos.' });
  }

  try {
    // Verificar email duplicado
    const dup = await db.query(
      'SELECT 1 FROM usuarios WHERE email_usuario=$1', [email]);
    if (dup.rows.length)
      return res.status(400).json({ error: 'E-mail já cadastrado.' });

    const hash = await bcrypt.hash(password, 10);

    // Inserir usuário
    const { rows } = await db.query(
      `INSERT INTO usuarios
         (nome_usuario, email_usuario, senha_usuario, cpf_usuario,
          nascimento_usuario, data_cadastro, ativo, papel)
       VALUES ($1,$2,$3,$4,$5,NOW(),true,'cliente')
       RETURNING id_usuario, nome_usuario, email_usuario, papel`,
      [name, email, hash, cpf || null, birthdate || null]
    );
    const user = rows[0];

    // Inserir endereço (agora obrigatório)
    await db.query(
      `INSERT INTO enderecos
         (usuario_id, rua, numero, complemento, bairro, cidade, estado, cep)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [user.id_usuario, rua, numero,
       complemento || null, bairro,
       cidade, estado, cep]
    );

    // Criar sessão
    req.session.user = user;
    
    res.json({ 
      message: 'Usuário registrado com sucesso.', 
      user,
      logged: true 
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    
    // Tratamento específico para erro de endereço duplicado
    if (err.code === '23505' && err.constraint === 'enderecos_usuario_id_key') {
      return res.status(400).json({ error: 'Usuário já possui um endereço cadastrado.' });
    }
    
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
};

// -------- LOGIN --------
exports.login = async (req, res) => {
  const { email_usuario, senha_usuario } = req.body;
  
  if (!email_usuario || !senha_usuario)
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });

  try {
    const { rows } = await db.query(
      'SELECT id_usuario, nome_usuario, email_usuario, senha_usuario, papel FROM usuarios WHERE email_usuario=$1 AND ativo=true',
      [email_usuario]
    );
    
    if (!rows.length) 
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });

    const user = rows[0];
    const ok = await bcrypt.compare(senha_usuario, user.senha_usuario);
    
    if (!ok) 
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });

    // Remover senha do objeto user
    const { senha_usuario: _, ...userWithoutPassword } = user;
    
    // Criar sessão
    req.session.user = userWithoutPassword;
    
    res.json({ 
      message: 'Login efetuado com sucesso.', 
      user: userWithoutPassword,
      logged: true 
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro ao efetuar login.' });
  }
};

// -------- LOGOUT --------
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao destruir sessão:', err);
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    
    res.clearCookie('donutshop.sid');
    res.json({ 
      message: 'Logout realizado com sucesso.',
      logged: false 
    });
  });
};

// -------- VERIFICAR SESSÃO --------
exports.verificarLogin = (req, res) => {
  if (req.session.user) {
    return res.json({ 
      logged: true, 
      ...req.session.user 
    });
  }
  res.json({ logged: false });
};
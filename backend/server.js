// backend/server.js – DreamDonuts
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');

const db = require('./database');
const authController = require('./controllers/authController');
const usuarioController = require('./controllers/usuarioController');

const app = express();
const HOST = 'localhost';
const PORT_FIXA = 3001;
const caminhoFrontend = path.join(__dirname, '../frontend');

// -------- Configuração de Upload (multer) --------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// -------- Middlewares --------
app.use(express.static(caminhoFrontend));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cookieParser());
app.use(express.json());

app.use(
  session({
    secret: 'donuts-secret-123',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, sameSite: 'lax' }
  })
);

// -------- CORS --------
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    `http://${HOST}:${PORT_FIXA}`
  ];
  if (allowedOrigins.includes(req.headers.origin)) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use((req, _res, next) => {
  req.db = db;
  next();
});

// -------- Rotas de autenticação --------
app.post('/register', authController.registro);
app.use('/auth', require('./routes/authRoutes'));

app.get('/auth/verificar', (req, res) => {
  if (req.session?.user) {
    return res.json({
      logged: true,
      id_usuario: req.session.user.id_usuario,
      nome_usuario: req.session.user.nome_usuario,
      email_usuario: req.session.user.email_usuario,
      papel: req.session.user.papel
    });
  }
  res.json({ logged: false });
});

// -------- Servir páginas dos CRUDs --------
app.use('/usuarios', express.static(path.join(__dirname, '../frontend/usuarios')));
app.use('/enderecos', express.static(path.join(__dirname, '../frontend/enderecos')));
app.use('/forma_pagamento', express.static(path.join(__dirname, '../frontend/forma_pagamento')));
app.use('/pagamento', express.static(path.join(__dirname, '../frontend/pagamento')));
app.use('/pedido', express.static(path.join(__dirname, '../frontend/pedido')));

// -------- Rota PRINCIPAL para forma_pagamento --------
app.get('/forma_pagamento', (_req, res) => {
  console.log('📁 Servindo forma_pagamento.html');
  res.sendFile(path.join(__dirname, '../frontend/forma_pagamento/forma_pagamento.html'));
});

// -------- Rotas de fallback para evitar cache --------
app.get('/formas-pagamento', (_req, res) => {
  console.log('🔄 Redirecionando de formas-pagamento para forma_pagamento');
  res.redirect('/forma_pagamento');
});

app.get('/formas-pagamento.html', (_req, res) => {
  console.log('🔄 Redirecionando de formas-pagamento.html');
  res.redirect('/forma_pagamento');
});

app.get('/pagamento', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pagamento/pagamento.html'));
});

app.get('/pedido', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pedido/pedido.html'));
});

// -------- API de usuários --------
app.use('/api/usuarios', usuarioController);

// -------- Rotas modulares dos CRUDs --------
app.use('/produto', require('./routes/produtoRoutes'));
app.use('/categoria', require('./routes/categoriaRoutes'));
app.use('/pedido', require('./routes/pedidoRoutes'));
app.use('/endereco', require('./routes/enderecoRoutes'));
app.use('/forma_pagamento', require('./routes/forma_pagamentoRoutes'));

// -------- Rota principal (loja) --------
app.use(express.static(path.join(__dirname, '../frontend/loja')));
app.get('/', (_req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/loja/index.html'))
);


// -------- Produtos para loja --------
app.get('/donuts', async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT id_produto, nome_produto, descricao_produto, preco_produto, imagem_produto, categoria_id
       FROM produtos
       WHERE ativo = true
       ORDER BY data_criacao DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
    res.status(500).json({ error: 'Erro ao carregar produtos' });
  }
});

// -------- Health check --------
app.get('/health', async (_req, res) => {
  try {
    const ok = await db.testConnection();
    res.status(ok ? 200 : 500).json({
      status: ok ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

// -------- Erros --------
app.use((err, _req, res, _next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.use((req, res) => {
  console.log(`❌ Rota não encontrada: ${req.originalUrl}`);
  res.status(404).json({ error: 'Rota não encontrada', rota: req.originalUrl });
});

// -------- Inicialização --------
(async () => {
  const ok = await db.testConnection();
  if (!ok) {
    console.error('❌ Falha na conexão com PostgreSQL');
    process.exit(1);
  }
  const PORT = process.env.PORT || PORT_FIXA;
  app.listen(PORT, () =>
    console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`)
  );
})();
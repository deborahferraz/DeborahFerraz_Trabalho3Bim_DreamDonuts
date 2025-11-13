// backend/server.js – DreamDonuts
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');

const db = require('./database');
const authController = require('./controllers/authController');

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

// -------- SESSION CONFIG - CORRIGIDA --------
app.use(
  session({
    name: 'donutshop.sid',
    secret: 'donuts-secret-123-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      httpOnly: true, 
      secure: false, 
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
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
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// -------- Middleware de Banco de Dados --------
app.use((req, _res, next) => {
  req.db = db;
  next();
});

// -------- MIDDLEWARE DE AUTENTICAÇÃO --------
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Não autorizado' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.papel === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
  }
};

// -------- Rotas de Autenticação --------
app.post('/register', authController.registro);
app.use('/auth', require('./routes/authRoutes'));

// -------- Rota de Verificação de Sessão - CORRIGIDA --------
app.get('/auth/verificar', (req, res) => {
  if (req.session.user) {
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

// -------- API de formas de pagamento --------
app.get('/forma_pagamento', async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT id_forma_pagamento, nome_forma_pagamento, ativo 
       FROM formas_pagamento 
       ORDER BY id_forma_pagamento`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao carregar formas de pagamento:', err);
    res.status(500).json({ error: 'Erro ao carregar formas de pagamento' });
  }
});

// -------- Servir páginas dos CRUDs --------
app.use('/usuarios', express.static(path.join(__dirname, '../frontend/usuarios')));
app.use('/enderecos', express.static(path.join(__dirname, '../frontend/enderecos')));
app.use('/pagamento', express.static(path.join(__dirname, '../frontend/pagamento')));
app.use('/formas-pagamento', express.static(path.join(__dirname, '../frontend/formas-pagamento')));

// -------- Rotas principais --------
app.get('/formas-pagamento', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/formas-pagamento/formas-pagamento.html'));
});

app.get('/pagamento', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pagamento/pagamento.html'));
});

app.get('/pedidos', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pedidos/pedidos.html'));
});

// -------- API de usuários (protegida) --------
app.use('/api/usuarios', requireAuth, require('./controllers/usuarioController'));

// -------- Rotas modulares dos CRUDs --------
app.use('/produto', require('./routes/produtoRoutes'));
app.use('/categoria', require('./routes/categoriaRoutes'));
app.use('/pedido', requireAuth, require('./routes/pedidoRoutes'));
app.use('/endereco', requireAuth, require('./routes/enderecoRoutes'));
app.use('/api/formas_pagamento', requireAuth, require('./routes/forma_pagamentoRoutes'));

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

// -------- Categorias --------
app.get('/categoria', async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT id_categoria, nome_categoria, descricao_categoria
       FROM categorias
       WHERE ativo = true
       ORDER BY nome_categoria`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
    res.status(500).json({ error: 'Erro ao carregar categorias' });
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

// -------- Middleware de Erros --------
app.use((err, _req, res, _next) => {
  console.error('❌ Erro não tratado:', err.message);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

app.use((req, res) => {
  console.log(`❌ Rota não encontrada: ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Rota não encontrada', 
    rota: req.originalUrl 
  });
});

// -------- Inicialização --------
(async () => {
  const ok = await db.testConnection();
  if (!ok) {
    console.error('❌ Falha na conexão com PostgreSQL');
    process.exit(1);
  }
  
  console.log('✅ Banco de dados conectado com sucesso!');
  
  const PORT = process.env.PORT || PORT_FIXA;
  app.listen(PORT, () =>
    console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`)
  );
})();
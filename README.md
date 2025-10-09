# 🍩 Donut Shop - Sistema Completo de Loja Online

## 📋 Descrição do Projeto

Este é um projeto completo de uma loja de donuts desenvolvido em HTML, CSS, JavaScript e Node.js com PostgreSQL. O sistema inclui funcionalidades de autenticação, carrinho de compras, painel administrativo com CRUDs completos e interface responsiva.

## 🚀 Funcionalidades

### 🔐 Sistema de Autenticação
- Login e registro de usuários
- Autenticação com cookies
- Controle de sessão
- Logout seguro

### 🛒 Loja Online
- Catálogo de produtos (donuts)
- Carrinho de compras interativo
- Sistema de pedidos
- Interface responsiva

### 👨‍💼 Painel Administrativo
- **CRUD Categorias** (Tabela sem dependências)
- **CRUD Produtos** (Relacionamento 1:N com categorias)
- **CRUD Usuários** (Relacionamento 1:1 com endereços)
- **CRUD Pedidos** (Relacionamento N:M com produtos)
- **CRUD Endereços** (Relacionamento 1:1 com usuários)
- **CRUD Formas de Pagamento** (Tabela sem dependências)

### 🗄️ Banco de Dados
- PostgreSQL com esquema completo
- Relacionamentos 1:1, 1:N e N:M
- Dados de exemplo pré-carregados
- Integridade referencial

## 🛠️ Tecnologias Utilizadas

### Frontend
- HTML5
- CSS3 (com design responsivo)
- JavaScript (ES6+)
- Interface moderna e intuitiva

### Backend
- Node.js
- Express.js
- PostgreSQL
- Cookie-based authentication
- CORS habilitado

### Estrutura MVC
- **Models**: Estrutura do banco de dados
- **Views**: Interface do usuário (HTML/CSS/JS)
- **Controllers**: Lógica de negócio (Node.js)
- **Routes**: Roteamento da API

## 📁 Estrutura do Projeto

```
donut_shop/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoriaController.js
│   │   ├── donutController.js
│   │   ├── enderecoController.js
│   │   ├── pedidoController.js
│   │   └── usuarioController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── categoriaRoutes.js
│   │   ├── donutRoutes.js
│   │   ├── enderecoRoutes.js
│   │   ├── pedidoRoutes.js
│   │   └── usuarioRoutes.js
│   ├── database.js
│   └── server.js
├── frontend/
│   ├── admin/
│   │   ├── index.html
│   │   ├── admin.css
│   │   └── admin.js
│   ├── auth/
│   │   ├── login.html
│   │   ├── login.css
│   │   └── login.js
│   └── loja/
│       ├── index.html
│       ├── style.css
│       └── script.js
├── documentacao/
│   └── donut_shop_schema.sql
├── index.html
├── package.json
└── README.md
```

## 🔧 Instalação e Configuração

### Pré-requisitos
- Node.js (v14 ou superior)
- PostgreSQL (v12 ou superior)
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd donut_shop
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o PostgreSQL**
   ```bash
   # Inicie o PostgreSQL
   sudo systemctl start postgresql
   
   # Crie o banco de dados
   sudo -u postgres createdb donut_shop
   
   # Configure a senha do usuário postgres
   sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
   ```

4. **Execute o script do banco de dados**
   ```bash
   sudo -u postgres psql -d donut_shop -f documentacao/donut_shop_schema.sql
   ```

5. **Inicie o servidor**
   ```bash
   npm start
   # ou
   node backend/server.js
   ```

6. **Acesse a aplicação**
   - Página inicial: `http://localhost:3001` ou abra `index.html`
   - API: `http://localhost:3001`

## 🎯 Como Usar

### Acesso às Funcionalidades

1. **Página Inicial**: Abra `index.html` no navegador
2. **Login**: Clique em "Login" para acessar o sistema
3. **Loja**: Clique em "Entrar na Loja" para ver os produtos
4. **Admin**: Clique em "Painel de Administração" para gerenciar dados

### Usuários de Teste

O sistema vem com dados de exemplo pré-carregados:

```sql
-- Usuário administrador
Email: admin@donutshop.com
Senha: admin123

-- Usuário cliente
Email: cliente@email.com
Senha: cliente123
```

### Testando os CRUDs

1. Acesse o painel administrativo
2. Faça login com as credenciais de administrador
3. Teste cada CRUD:
   - **Categorias**: Tabela sem dependências
   - **Produtos**: Relacionamento 1:N com categorias
   - **Usuários**: Relacionamento 1:1 com endereços
   - **Pedidos**: Relacionamento N:M com produtos
   - **Endereços**: Relacionamento 1:1 com usuários

## 🔍 Funcionalidades Técnicas

### Relacionamentos do Banco de Dados

1. **Sem Dependências**
   - Categorias
   - Formas de Pagamento

2. **Relacionamento 1:N**
   - Produtos → Categorias
   - Pedidos → Usuários

3. **Relacionamento 1:1**
   - Usuários ↔ Endereços

4. **Relacionamento N:M**
   - Pedidos ↔ Produtos (via Itens de Pedido)

### Recursos de Segurança

- Autenticação baseada em cookies
- Validação de dados no frontend e backend
- Controle de acesso às rotas administrativas
- Sanitização de inputs

### Interface Responsiva

- Design adaptável para desktop e mobile
- Navegação intuitiva
- Feedback visual para ações do usuário
- Loading states e tratamento de erros

## 🐛 Solução de Problemas

### Erro de Conexão com PostgreSQL
```bash
# Verifique se o PostgreSQL está rodando
sudo systemctl status postgresql

# Reinicie se necessário
sudo systemctl restart postgresql
```

### Erro de Permissões
```bash
# Ajuste as permissões do diretório
chmod -R 755 donut_shop/
```

### Porta em Uso
```bash
# Verifique processos na porta 3001
lsof -i :3001

# Mate o processo se necessário
kill -9 <PID>
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **usuarios**: Dados dos usuários
- **enderecos**: Endereços dos usuários (1:1)
- **categorias**: Categorias de produtos
- **produtos**: Produtos da loja (1:N com categorias)
- **pedidos**: Pedidos dos clientes
- **itens_pedido**: Itens dos pedidos (N:M)
- **forma_pagamento**: Formas de pagamento
- **cargo**: Cargos dos usuários

## 🎨 Design e UX

- **Cores**: Paleta rosa/coral para tema de donuts
- **Tipografia**: Arial, fonte limpa e legível
- **Layout**: Cards, modais e tabelas responsivas
- **Animações**: Transições suaves e hover effects
- **Ícones**: Emojis para interface amigável

## 📝 Licença

Este projeto foi desenvolvido para fins educacionais como parte de uma avaliação acadêmica.

## 👥 Contribuição

Este é um projeto acadêmico. Para sugestões ou melhorias, entre em contato com o desenvolvedor.

---

**Desenvolvido com ❤️ para a disciplina de Desenvolvimento Web**
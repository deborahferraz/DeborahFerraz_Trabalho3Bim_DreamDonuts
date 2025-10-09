-- CRIAÇÃO DO BANCO DE DADOS DA LOJA DE DONUTS
-- create database donut_shop;
-- \c donut_shop;

-- TABELA DE USUÁRIOS (para login e autenticação)
create table usuarios (
    "id_usuario" serial primary key,
    "nome_usuario" varchar(100) not null,
    "email_usuario" varchar(150) unique not null,
    "senha_usuario" varchar(255) not null,
    "data_cadastro" timestamp default current_timestamp,
    "ativo" boolean default true
);

-- TABELA DE CATEGORIAS DE PRODUTOS
create table categorias (
    "id_categoria" serial primary key,
    "nome_categoria" varchar(50) not null,
    "descricao_categoria" text
);

-- TABELA DE PRODUTOS (DONUTS)
create table produtos (
    "id_produto" serial primary key,
    "nome_produto" varchar(100) not null,
    "descricao_produto" text,
    "preco_produto" decimal(10,2) not null,
    "quantidade_estoque" int default 0,
    "imagem_produto" varchar(255),
    "categoria_id" int references categorias("id_categoria"),
    "ativo" boolean default true,
    "data_criacao" timestamp default current_timestamp
);

-- TABELA DE PEDIDOS
create table pedidos (
    "id_pedido" serial primary key,
    "usuario_id" int references usuarios("id_usuario"),
    "data_pedido" timestamp default current_timestamp,
    "status_pedido" varchar(50) default 'pendente',
    "valor_total" decimal(10,2) default 0,
    "observacoes" text
);

-- TABELA DE ITENS DO PEDIDO (relacionamento N:M entre pedidos e produtos)
create table itens_pedido (
    "id_item" serial primary key,
    "pedido_id" int references pedidos("id_pedido"),
    "produto_id" int references produtos("id_produto"),
    "quantidade" int not null,
    "preco_unitario" decimal(10,2) not null,
    "subtotal" decimal(10,2) not null
);

-- TABELA DE ENDEREÇOS (relacionamento 1:1 com usuários)
create table enderecos (
    "id_endereco" serial primary key,
    "usuario_id" int unique references usuarios("id_usuario"),
    "rua" varchar(200),
    "numero" varchar(20),
    "complemento" varchar(100),
    "bairro" varchar(100),
    "cidade" varchar(100),
    "estado" varchar(50),
    "cep" varchar(20)
);

-- TABELA DE FORMAS DE PAGAMENTO
create table formas_pagamento (
    "id_forma_pagamento" serial primary key,
    "nome_forma_pagamento" varchar(100) not null,
    "ativo" boolean default true
);

-- TABELA DE PAGAMENTOS (relacionamento N:M entre pedidos e formas de pagamento)
create table pagamentos (
    "id_pagamento" serial primary key,
    "pedido_id" int references pedidos("id_pedido"),
    "forma_pagamento_id" int references formas_pagamento("id_forma_pagamento"),
    "valor_pago" decimal(10,2) not null,
    "data_pagamento" timestamp default current_timestamp,
    "status_pagamento" varchar(50) default 'pendente'
);

-- INSERÇÃO DE DADOS INICIAIS

-- Categorias de donuts
INSERT INTO categorias ("nome_categoria", "descricao_categoria") VALUES
('Clássicos', 'Donuts tradicionais e populares'),
('Especiais', 'Donuts gourmet e sabores únicos'),
('Veganos', 'Donuts sem ingredientes de origem animal'),
('Diet', 'Donuts com baixo teor de açúcar');

-- Formas de pagamento
INSERT INTO formas_pagamento ("nome_forma_pagamento") VALUES
('Dinheiro'),
('Cartão de Crédito'),
('Cartão de Débito'),
('PIX'),
('Vale Alimentação');

-- Produtos (Donuts)
INSERT INTO produtos ("nome_produto", "descricao_produto", "preco_produto", "quantidade_estoque", "categoria_id") VALUES
('Donut Glazed', 'Donut clássico com cobertura de açúcar', 4.50, 50, 1),
('Donut de Chocolate', 'Donut com cobertura de chocolate ao leite', 5.00, 40, 1),
('Donut de Morango', 'Donut com cobertura de morango e granulado', 5.50, 35, 1),
('Donut Boston Cream', 'Donut recheado com creme e cobertura de chocolate', 6.00, 30, 2),
('Donut de Coco', 'Donut com cobertura de chocolate branco e coco ralado', 5.50, 25, 2),
('Donut Red Velvet', 'Donut sabor red velvet com cream cheese', 7.00, 20, 2),
('Donut Vegano de Baunilha', 'Donut vegano com cobertura de baunilha', 6.50, 15, 3),
('Donut Vegano de Chocolate', 'Donut vegano com cobertura de chocolate', 6.50, 15, 3),
('Donut Diet de Frutas Vermelhas', 'Donut diet com cobertura de frutas vermelhas', 5.00, 20, 4),
('Donut Diet de Limão', 'Donut diet com cobertura de limão', 5.00, 20, 4);

-- Usuário administrador padrão
INSERT INTO usuarios ("nome_usuario", "email_usuario", "senha_usuario") VALUES
('Administrador', 'admin@donutshop.com', 'admin123');

-- Endereço do administrador
INSERT INTO enderecos ("usuario_id", "rua", "numero", "bairro", "cidade", "estado", "cep") VALUES
(1, 'Rua Principal', '123', 'Centro', 'São Paulo', 'SP', '01000-000');


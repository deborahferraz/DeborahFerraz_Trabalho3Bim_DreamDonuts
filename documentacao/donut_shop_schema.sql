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
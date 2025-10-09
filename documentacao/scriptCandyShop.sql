-- CRIAÇÃO DO BANCO
-- create database candyshop;
-- \c candyshop;

-- TABELAS PRINCIPAIS


create table pessoa (
    "cpf_pessoa" varchar(20) primary key,
    "nome_pessoa" varchar(60),
    "data_nascimento_pessoa" date,
    "endereco_pessoa" varchar(150)
);

create table cargo (
    "id_cargo" serial primary key,
    "nome_cargo" varchar(45)
);

create table funcionario (
    "pessoa_cpf_pessoa" varchar(20) primary key references pessoa("cpf_pessoa"),
    salario double precision,
    "cargo_id_cargo" int references cargo("id_cargo"),
    "porcentagem_comissao" double precision
);

create table cliente (
    "pessoa_cpf_pessoa" varchar(20) primary key references pessoa("cpf_pessoa"),
    "renda_cliente" double precision,
    "data_cadastro_cliente" date
);

create table produto (
    "id_produto" serial primary key,
    "nome_produto" varchar(45),
    "quantidade_estoque" int,
    "preco_unitario" double precision
);

create table pedido (
    "id_pedido" serial primary key,
    "data_pedido" date,
    "cliente_pessoa_cpf_pessoa" varchar(20) references cliente("pessoa_cpf_pessoa"),
    "funcionario_pessoa_cpf_pessoa" varchar(20) references funcionario("pessoa_cpf_pessoa")
);

create table pagamento (
    "pedido_id_pedido" int primary key references pedido("id_pedido"),
    "data_pagamento" timestamp,
    "valor_total_pagamento" double precision
);

create table "forma_pagamento" (
    "id_forma_pagamento" serial primary key,
    "nome_forma_pagamento" varchar(100)
);

-- TABELAS RELACIONAIS

create table "pedido_has_produto" (
    "produto_id_produto" int references produto("id_produto"),
    "pedido_id_pedido" int references pedido("id_pedido"),
    quantidade int,
    "preco_unitario" double precision,
    primary key ("produto_id_produto", "pedido_id_pedido")
);

create table "pagamento_has_forma_pagamento" (
    "pagamento_id_pedido" int references pagamento("pedido_id_pedido"),
    "forma_pagamento_id_forma_pagamento" int references "forma_pagamento"("id_forma_pagamento"),
    "valor_pago" double precision,
    primary key ("pagamento_id_pedido", "forma_pagamento_id_forma_pagamento")
);




-- Pessoa (10 registros)
insert into pessoa ("cpf_pessoa", "nome_pessoa", "data_nascimento_pessoa", "endereco_pessoa") values
('11111111111', 'João Silva', '1990_01_10', 'algum lugar'),
('22222222222', 'Maria Souza', '1985_02_15', 'lá longe, 1234'),
('33333333333', 'Carlos Pereira', '1992_03_20', 'Rua que Judas perdeu as botas, 234'),
('44444444444', 'Ana Lima', '1995_04_25', 'Alameda do medo, 4534 apto 13'),
('55555555555', 'Lucas Mendes', '1988_05_30', 'Rua sexta_feira, 13 _ apto 666'),
('66666666666', 'Fernanda Costa', '1993_06_05', 'muito longe, 243'),
('77777777777', 'Ricardo Alves', '1987_07_10', 'far far faraway, 34'),
('88888888888', 'Patrícia Gomes', '1994_08_15', 'acolá, 54'),
('99999999999', 'Marcos Rocha', '1991_09_20', 'kaxa prego _ ilha de itaparica'),
('10101010101', 'Juliana Dias', '1989_10_25', 'lins, 352');

-- Cargo (10 registros)
insert into cargo ("nome_cargo") values
('Vendedor'),
('Gerente'),
('Caixa'),
('Supervisor'),
('Atendente'),
('Repositor'),
('Conferente'),
('Assistente'),
('Auxiliar'),
('Diretor');

-- Funcionario (10 registros)
insert into funcionario ("pessoa_cpf_pessoa", salario, "cargo_id_cargo", "porcentagem_comissao") values
('11111111111', 2000.00, 1, 5),
('22222222222', 3000.00, 2, 10),
('33333333333', 1500.00, 3, 3),
('44444444444', 2500.00, 4, 6),
('55555555555', 1800.00, 5, 4),
('66666666666', 1600.00, 6, 2),
('77777777777', 2200.00, 7, 5),
('88888888888', 1900.00, 8, 3),
('99999999999', 2800.00, 9, 7),
('10101010101', 5000.00, 10, 15);

-- Cliente (10 registros)
insert into cliente ("pessoa_cpf_pessoa", "renda_cliente", "data_cadastro_cliente") values
('11111111111', 2500.00, '2024_01_01'),
('22222222222', 3200.00, '2024_01_02'),
('33333333333', 1800.00, '2024_01_03'),
('44444444444', 4000.00, '2024_01_04'),
('55555555555', 2100.00, '2024_01_05'),
('66666666666', 3500.00, '2024_01_06'),
('77777777777', 2700.00, '2024_01_07'),
('88888888888', 5000.00, '2024_01_08'),
('99999999999', 3800.00, '2024_01_09'),
('10101010101', 4500.00, '2024_01_10');

-- Produto (10 registros)
insert into produto ("nome_produto", "quantidade_estoque", "preco_unitario") values
('Chocolate', 100, 5.50),
('Bala', 200, 0.50),
('Pirulito', 150, 1.00),
('Biscoito', 80, 3.20),
('Refrigerante', 50, 7.00),
('Suco', 60, 4.50),
('Chiclete', 300, 0.75),
('Pão de Mel', 40, 6.00),
('Doce de Leite', 30, 8.50),
('Sorvete', 20, 10.00);

-- Pedido (10 registros)
insert into pedido ("data_pedido", "cliente_pessoa_cpf_pessoa", "funcionario_pessoa_cpf_pessoa") values
('2024_02_01', '11111111111', '22222222222'),
('2024_02_02', '33333333333', '44444444444'),
('2024_02_03', '55555555555', '66666666666'),
('2024_02_04', '77777777777', '88888888888'),
('2024_02_05', '99999999999', '10101010101'),
('2024_02_06', '22222222222', '11111111111'),
('2024_02_07', '44444444444', '33333333333'),
('2024_02_08', '66666666666', '55555555555'),
('2024_02_09', '88888888888', '77777777777'),
('2024_02_10', '10101010101', '99999999999');

-- Pagamento (10 registros)
insert into pagamento ("pedido_id_pedido", "data_pagamento", "valor_total_pagamento") values
(1, '2024_02_01 10:00:00', 50.00),
(2, '2024_02_02 11:00:00', 30.00),
(3, '2024_02_03 12:00:00', 20.00),
(4, '2024_02_04 13:00:00', 70.00),
(5, '2024_02_05 14:00:00', 100.00),
(6, '2024_02_06 15:00:00', 80.00),
(7, '2024_02_07 16:00:00', 25.00),
(8, '2024_02_08 17:00:00', 45.00),
(9, '2024_02_09 18:00:00', 60.00),
(10, '2024_02_10 19:00:00', 90.00);

-- FormaDePagamento (10 registros)
insert into "forma_pagamento" ("nome_forma_pagamento") values
('Dinheiro'),
('Cartão de Crédito'),
('Cartão de Débito'),
('Pix'),
('Boleto'),
('Vale Alimentação'),
('Transferência Bancária'),
('Cheque'),
('Crédito Loja'),
('Gift Card');

-- PedidoHasProduto (5 registros)
insert into "pedido_has_produto" ("produto_id_produto", "pedido_id_pedido", quantidade, "preco_unitario") values
(1, 1, 2, 5.50),
(2, 2, 10, 0.50),
(3, 3, 5, 1.00),
(4, 4, 3, 3.20),
(5, 5, 2, 7.00);

-- PagamentoHasFormaPagamento (5 registros)
insert into "pagamento_has_forma_pagamento" ("pagamento_id_pedido", "forma_pagamento_id_forma_pagamento", "valor_pago") values
(1, 1, 20.00),
(2, 2, 30.00),
(3, 3, 15.00),
(4, 4, 50.00),
(5, 5, 100.00);

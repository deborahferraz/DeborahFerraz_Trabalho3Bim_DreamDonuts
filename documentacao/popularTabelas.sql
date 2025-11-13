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


# Problemas Identificados no Sistema Donut Shop

## 1. Problemas no Sistema de Produtos

### 1.1 Inconsistência entre server.js e produtoController.js
- O `server.js` implementa o CRUD de produtos diretamente, mas existe um `produtoController.js` separado
- O `produtoController.js` usa sintaxe MySQL (`db.query` com `?`) mas o projeto usa PostgreSQL (`$1, $2, etc.`)
- O `produtoController.js` importa `../config/db` mas o arquivo correto é `../database.js`

### 1.2 Problemas no Upload de Imagens
- O `produtoController.js` não tem suporte para upload de arquivos (multer)
- Falta tratamento adequado para upload de imagens no controller separado
- Inconsistência na estrutura de resposta entre server.js e controller

### 1.3 Problemas de Roteamento
- As rotas em `produtoRoutes.js` não estão sendo usadas no `server.js`
- O `server.js` implementa as rotas diretamente em vez de usar o sistema de rotas modular

## 2. Problemas Gerais de Arquitetura

### 2.1 Mistura de Responsabilidades
- O `server.js` contém lógica de negócio que deveria estar nos controllers
- Falta de padronização entre diferentes CRUDs

### 2.2 Configuração de Banco de Dados
- O `produtoController.js` tenta importar `../config/db` que não existe
- Deveria usar `../database.js` como os outros arquivos

## 3. Correções Necessárias

### 3.1 Corrigir produtoController.js
- Alterar sintaxe MySQL para PostgreSQL
- Corrigir import do banco de dados
- Adicionar suporte para upload de imagens
- Padronizar tratamento de erros

### 3.2 Refatorar server.js
- Remover lógica de produtos do server.js
- Usar o sistema de rotas modular
- Manter apenas configurações gerais no server.js

### 3.3 Corrigir Rotas
- Integrar as rotas de produto no server.js
- Adicionar middleware de upload nas rotas necessárias


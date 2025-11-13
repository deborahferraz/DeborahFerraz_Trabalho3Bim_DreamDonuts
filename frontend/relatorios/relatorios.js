// Dados de exemplo para demonstração
function inicializarDadosExemplo() {
    const pedidosExemplo = [
        {
            id: 1,
            data: '2025-10-01',
            cliente: 'João Silva',
            total: 150.00,
            status: 'Concluído',
            itens: [
                { produto: 'Produto A', quantidade: 2, preco: 50.00 },
                { produto: 'Produto B', quantidade: 1, preco: 50.00 }
            ]
        },
        {
            id: 2,
            data: '2025-10-05',
            cliente: 'Maria Santos',
            total: 89.90,
            status: 'Concluído',
            itens: [
                { produto: 'Produto C', quantidade: 1, preco: 89.90 }
            ]
        },
        {
            id: 3,
            data: '2025-10-10',
            cliente: 'Pedro Oliveira',
            total: 245.50,
            status: 'Concluído',
            itens: [
                { produto: 'Produto A', quantidade: 1, preco: 50.00 },
                { produto: 'Produto D', quantidade: 3, preco: 65.17 }
            ]
        },
        {
            id: 4,
            data: '2025-11-01',
            cliente: 'Ana Costa',
            total: 120.00,
            status: 'Concluído',
            itens: [
                { produto: 'Produto B', quantidade: 2, preco: 60.00 }
            ]
        },
        {
            id: 5,
            data: '2025-11-05',
            cliente: 'Carlos Lima',
            total: 75.80,
            status: 'Concluído',
            itens: [
                { produto: 'Produto E', quantidade: 1, preco: 75.80 }
            ]
        }
    ];

    // Salvar dados exemplo apenas se não existirem pedidos
    if (!localStorage.getItem('pedidos')) {
        localStorage.setItem('pedidos', JSON.stringify(pedidosExemplo));
        console.log('Dados de exemplo inicializados');
    }
}

// Inicializar dados quando o script carregar
document.addEventListener('DOMContentLoaded', function() {
    inicializarDadosExemplo();
    configurarDatasPadrao();
});

// Configurar datas padrão para o relatório de produtos
function configurarDatasPadrao() {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    const dataInicio = document.getElementById('data-inicio');
    const dataFim = document.getElementById('data-fim');
    
    if (dataInicio && dataFim) {
        dataInicio.value = formatarDataParaInput(primeiroDiaMes);
        dataFim.value = formatarDataParaInput(hoje);
    }
}

function formatarDataParaInput(data) {
    return data.toISOString().split('T')[0];
}

// Função principal para gerar relatório de vendas
function gerarRelatorioVendas() {
    try {
        console.log('Iniciando geração do relatório de vendas...');
        
        const mesSelect = document.getElementById('mes-vendas');
        const anoSelect = document.getElementById('ano-vendas');
        
        // Verificar se os elementos existem
        if (!mesSelect || !anoSelect) {
            console.error('Elementos do formulário não encontrados');
            mostrarErro('relatorio-vendas-container', 'Erro: Elementos do formulário não encontrados.');
            return;
        }

        const mes = mesSelect.value;
        const ano = anoSelect.value;
        
        console.log(`Parâmetros selecionados: Mês=${mes}, Ano=${ano}`);
        
        // Validar seleção
        if (!mes || !ano) {
            mostrarErro('relatorio-vendas-container', 'Por favor, selecione o mês e o ano.');
            return;
        }

        // Obter pedidos do localStorage
        const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
        console.log('Total de pedidos encontrados:', pedidos.length);
        
        // Filtrar pedidos pelo mês e ano
        const pedidosFiltrados = pedidos.filter(pedido => {
            try {
                const dataPedido = new Date(pedido.data);
                const mesPedido = dataPedido.getMonth() + 1;
                const anoPedido = dataPedido.getFullYear();
                
                return mesPedido === parseInt(mes) && anoPedido === parseInt(ano);
            } catch (error) {
                console.error('Erro ao processar data do pedido:', pedido, error);
                return false;
            }
        });
        
        console.log('Pedidos filtrados:', pedidosFiltrados);
        
        // Gerar e exibir o relatório
        exibirRelatorioVendas(pedidosFiltrados, mes, ano);
        
    } catch (error) {
        console.error('Erro ao gerar relatório de vendas:', error);
        mostrarErro('relatorio-vendas-container', `Erro ao gerar relatório: ${error.message}`);
    }
}

// Função para exibir o relatório de vendas
function exibirRelatorioVendas(pedidos, mes, ano) {
    const container = document.getElementById('relatorio-vendas-container');
    
    if (!container) {
        console.error('Container do relatório de vendas não encontrado');
        return;
    }

    if (pedidos.length === 0) {
        container.innerHTML = `
            <div class="mensagem-aguardando">
                <p>Nenhum pedido encontrado para ${getNomeMes(mes)}/${ano}</p>
            </div>
        `;
        return;
    }

    // Calcular totais
    const totalVendas = pedidos.reduce((total, pedido) => total + (pedido.total || 0), 0);
    const quantidadePedidos = pedidos.length;
    const ticketMedio = totalVendas / quantidadePedidos;

    // Gerar HTML do relatório
    const htmlRelatorio = `
        <div class="relatorio-vendas">
            <div class="resumo">
                <h3>Resumo do Período: ${getNomeMes(mes)}/${ano}</h3>
                <p><strong>Total de Vendas:</strong> R$ ${totalVendas.toFixed(2)}</p>
                <p><strong>Quantidade de Pedidos:</strong> ${quantidadePedidos}</p>
                <p><strong>Ticket Médio:</strong> R$ ${ticketMedio.toFixed(2)}</p>
            </div>
            
            <table class="tabela-relatorio">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Pedido ID</th>
                        <th>Cliente</th>
                        <th>Total (R$)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidos.map(pedido => `
                        <tr>
                            <td>${formatarDataExibicao(pedido.data)}</td>
                            <td>#${pedido.id || 'N/A'}</td>
                            <td>${pedido.cliente || 'Cliente não identificado'}</td>
                            <td>R$ ${(pedido.total || 0).toFixed(2)}</td>
                            <td>${pedido.status || 'Concluído'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="acoes">
                <button class="btn-exportar" onclick="imprimirRelatorioEspecifico('vendas')">Imprimir Este Relatório</button>
            </div>
        </div>
    `;
    
    container.innerHTML = htmlRelatorio;
}

// Função para gerar relatório de produtos
function gerarRelatorioProdutos() {
    try {
        const dataInicio = document.getElementById('data-inicio').value;
        const dataFim = document.getElementById('data-fim').value;
        
        if (!dataInicio || !dataFim) {
            mostrarErro('relatorio-produtos-container', 'Por favor, selecione a data início e data fim.');
            return;
        }

        const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
        const dataInicioObj = new Date(dataInicio);
        const dataFimObj = new Date(dataFim);
        
        // Ajustar data fim para incluir o dia inteiro
        dataFimObj.setHours(23, 59, 59, 999);

        const pedidosFiltrados = pedidos.filter(pedido => {
            const dataPedido = new Date(pedido.data);
            return dataPedido >= dataInicioObj && dataPedido <= dataFimObj;
        });

        exibirRelatorioProdutos(pedidosFiltrados, dataInicio, dataFim);
        
    } catch (error) {
        console.error('Erro ao gerar relatório de produtos:', error);
        mostrarErro('relatorio-produtos-container', `Erro ao gerar relatório: ${error.message}`);
    }
}

// Função para gerar relatório rápido (últimos 30 dias)
function gerarRelatorioRapido() {
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 30);
    
    document.getElementById('data-inicio').value = formatarDataParaInput(dataInicio);
    document.getElementById('data-fim').value = formatarDataParaInput(dataFim);
    
    gerarRelatorioProdutos();
}

// Função para exibir relatório de produtos
function exibirRelatorioProdutos(pedidos, dataInicio, dataFim) {
    const container = document.getElementById('relatorio-produtos-container');
    
    if (!container) {
        console.error('Container do relatório de produtos não encontrado');
        return;
    }

    if (pedidos.length === 0) {
        container.innerHTML = `
            <div class="mensagem-aguardando">
                <p>Nenhum pedido encontrado para o período de ${formatarDataExibicao(dataInicio)} a ${formatarDataExibicao(dataFim)}</p>
            </div>
        `;
        return;
    }

    // Agrupar produtos vendidos
    const produtosVendidos = {};
    
    pedidos.forEach(pedido => {
        if (pedido.itens && Array.isArray(pedido.itens)) {
            pedido.itens.forEach(item => {
                const nomeProduto = item.produto || 'Produto não identificado';
                if (!produtosVendidos[nomeProduto]) {
                    produtosVendidos[nomeProduto] = {
                        quantidade: 0,
                        total: 0
                    };
                }
                produtosVendidos[nomeProduto].quantidade += item.quantidade || 0;
                produtosVendidos[nomeProduto].total += (item.quantidade || 0) * (item.preco || 0);
            });
        }
    });

    // Converter para array e ordenar por quantidade
    const produtosOrdenados = Object.entries(produtosVendidos)
        .map(([nome, dados]) => ({
            nome,
            quantidade: dados.quantidade,
            total: dados.total
        }))
        .sort((a, b) => b.quantidade - a.quantidade);

    const htmlRelatorio = `
        <div class="relatorio-produtos">
            <div class="resumo">
                <h3>Produtos Mais Vendidos</h3>
                <p><strong>Período:</strong> ${formatarDataExibicao(dataInicio)} a ${formatarDataExibicao(dataFim)}</p>
                <p><strong>Total de Pedidos Analisados:</strong> ${pedidos.length}</p>
            </div>
            
            <table class="tabela-relatorio">
                <thead>
                    <tr>
                        <th>Posição</th>
                        <th>Produto</th>
                        <th>Quantidade Vendida</th>
                        <th>Total Arrecadado (R$)</th>
                    </tr>
                </thead>
                <tbody>
                    ${produtosOrdenados.map((produto, index) => `
                        <tr>
                            <td>${index + 1}º</td>
                            <td>${produto.nome}</td>
                            <td>${produto.quantidade}</td>
                            <td>R$ ${produto.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="acoes">
                <button class="btn-exportar" onclick="imprimirRelatorioEspecifico('produtos')">Imprimir Este Relatório</button>
            </div>
        </div>
    `;
    
    container.innerHTML = htmlRelatorio;
}

// FUNÇÕES DE IMPRESSÃO
function imprimirRelatorios() {
    // Verificar se há relatórios gerados
    const relatorioVendas = document.getElementById('relatorio-vendas-container');
    const relatorioProdutos = document.getElementById('relatorio-produtos-container');
    
    const temRelatorioVendas = relatorioVendas && !relatorioVendas.innerHTML.includes('mensagem-aguardando');
    const temRelatorioProdutos = relatorioProdutos && !relatorioProdutos.innerHTML.includes('mensagem-aguardando');
    
    if (!temRelatorioVendas && !temRelatorioProdutos) {
        alert('Por favor, gere pelo menos um relatório antes de imprimir.');
        return;
    }
    
    // Criar uma nova janela para impressão
    const janelaImpressao = window.open('', '_blank');
    const dataImpressao = new Date().toLocaleString('pt-BR');
    
    // Construir o conteúdo HTML para impressão
    let conteudoHTML = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatórios Gerenciais</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #000;
                    line-height: 1.4;
                }
                .cabecalho-impressao {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 15px;
                }
                .cabecalho-impressao h1 {
                    margin: 0 0 10px 0;
                    font-size: 24px;
                    color: #000;
                }
                .relatorio-secao {
                    margin-bottom: 40px;
                    page-break-inside: avoid;
                }
                .relatorio-secao h2 {
                    border-bottom: 1px solid #000;
                    padding-bottom: 5px;
                    margin-bottom: 15px;
                    font-size: 18px;
                    color: #000;
                }
                .resumo {
                    background-color: #f5f5f5;
                    padding: 15px;
                    margin-bottom: 20px;
                    border-left: 4px solid #000;
                }
                .resumo h3 {
                    margin-top: 0;
                    color: #000;
                }
                .tabela-relatorio {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                    margin-top: 15px;
                }
                .tabela-relatorio th,
                .tabela-relatorio td {
                    border: 1px solid #000;
                    padding: 8px 10px;
                    text-align: left;
                }
                .tabela-relatorio th {
                    background-color: #e0e0e0;
                    font-weight: bold;
                }
                .tabela-relatorio tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .rodape-impressao {
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #000;
                    font-size: 11px;
                    color: #666;
                }
                @media print {
                    body { margin: 1cm; }
                    .relatorio-secao { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="cabecalho-impressao">
                <h1>Relatórios Gerenciais - Sistema Comercial</h1>
                <p><strong>Data da Impressão:</strong> ${dataImpressao}</p>
            </div>
    `;
    
    // Adicionar relatório de vendas se existir
    if (temRelatorioVendas) {
        // Extrair apenas o conteúdo do relatório, removendo os botões de ação
        let conteudoVendas = relatorioVendas.innerHTML;
        conteudoVendas = conteudoVendas.replace(/<div class="acoes">[\s\S]*?<\/div>/, '');
        
        conteudoHTML += `
            <div class="relatorio-secao">
                <h2>Relatório de Vendas por Período</h2>
                ${conteudoVendas}
            </div>
        `;
    }
    
    // Adicionar relatório de produtos se existir
    if (temRelatorioProdutos) {
        // Extrair apenas o conteúdo do relatório, removendo os botões de ação
        let conteudoProdutos = relatorioProdutos.innerHTML;
        conteudoProdutos = conteudoProdutos.replace(/<div class="acoes">[\s\S]*?<\/div>/, '');
        
        conteudoHTML += `
            <div class="relatorio-secao">
                <h2>Produtos Mais Vendidos</h2>
                ${conteudoProdutos}
            </div>
        `;
    }
    
    // Fechar o HTML
    conteudoHTML += `
            <div class="rodape-impressao">
                <p>Relatório gerado automaticamente pelo Sistema Comercial</p>
            </div>
        </body>
        </html>
    `;
    
    // Escrever o conteúdo na nova janela e acionar impressão
    janelaImpressao.document.write(conteudoHTML);
    janelaImpressao.document.close();
    
    // Aguardar o carregamento do conteúdo antes de imprimir
    janelaImpressao.onload = function() {
        setTimeout(() => {
            janelaImpressao.print();
            // janelaImpressao.close(); // Opcional: fechar após impressão
        }, 500);
    };
}

function imprimirRelatorioEspecifico(tipo) {
    let container;
    let titulo = '';
    
    if (tipo === 'vendas') {
        container = document.getElementById('relatorio-vendas-container');
        titulo = 'Relatório de Vendas por Período';
    } else if (tipo === 'produtos') {
        container = document.getElementById('relatorio-produtos-container');
        titulo = 'Relatório de Produtos Mais Vendidos';
    }
    
    if (!container || container.innerHTML.includes('mensagem-aguardando')) {
        alert('Por favor, gere o relatório primeiro antes de imprimir.');
        return;
    }
    
    // Criar uma nova janela para impressão
    const janelaImpressao = window.open('', '_blank');
    const dataImpressao = new Date().toLocaleString('pt-BR');
    
    // Extrair apenas o conteúdo do relatório, removendo os botões de ação
    let conteudoRelatorio = container.innerHTML;
    conteudoRelatorio = conteudoRelatorio.replace(/<div class="acoes">[\s\S]*?<\/div>/, '');
    
    // Construir o conteúdo HTML para impressão
    const conteudoHTML = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${titulo}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #000;
                    line-height: 1.4;
                }
                .cabecalho-impressao {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 15px;
                }
                .cabecalho-impressao h1 {
                    margin: 0 0 10px 0;
                    font-size: 24px;
                    color: #000;
                }
                .resumo {
                    background-color: #f5f5f5;
                    padding: 15px;
                    margin-bottom: 20px;
                    border-left: 4px solid #000;
                }
                .resumo h3 {
                    margin-top: 0;
                    color: #000;
                }
                .tabela-relatorio {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                    margin-top: 15px;
                }
                .tabela-relatorio th,
                .tabela-relatorio td {
                    border: 1px solid #000;
                    padding: 8px 10px;
                    text-align: left;
                }
                .tabela-relatorio th {
                    background-color: #e0e0e0;
                    font-weight: bold;
                }
                .tabela-relatorio tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .rodape-impressao {
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #000;
                    font-size: 11px;
                    color: #666;
                }
                @media print {
                    body { margin: 1cm; }
                }
            </style>
        </head>
        <body>
            <div class="cabecalho-impressao">
                <h1>${titulo}</h1>
                <p><strong>Data da Impressão:</strong> ${dataImpressao}</p>
            </div>
            
            ${conteudoRelatorio}
            
            <div class="rodape-impressao">
                <p>Relatório gerado automaticamente pelo Sistema Comercial</p>
            </div>
        </body>
        </html>
    `;
    
    // Escrever o conteúdo na nova janela e acionar impressão
    janelaImpressao.document.write(conteudoHTML);
    janelaImpressao.document.close();
    
    // Aguardar o carregamento do conteúdo antes de imprimir
    janelaImpressao.onload = function() {
        setTimeout(() => {
            janelaImpressao.print();
            // janelaImpressao.close(); // Opcional: fechar após impressão
        }, 500);
    };
}

// Funções de navegação
function voltarParaLoja() {
    window.location.href = '../loja/index.html';
}

function voltarParaCrud() {
    window.location.href = '../admin/admin.html';
}

// Função para limpar dados
function limparDados() {
    if (confirm('Tem certeza que deseja limpar todos os dados de teste? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem('pedidos');
        mostrarSucesso('relatorio-vendas-container', 'Dados de teste limpos com sucesso! Recarregando...');
        
        // Recarregar após 1.5 segundos
        setTimeout(() => {
            location.reload();
        }, 1500);
    }
}

// Funções auxiliares
function mostrarErro(containerId, mensagem) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="erro">${mensagem}</div>`;
    }
}

function mostrarSucesso(containerId, mensagem) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="sucesso">${mensagem}</div>`;
    }
}

function getNomeMes(numeroMes) {
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[parseInt(numeroMes) - 1] || 'Mês inválido';
}

function formatarDataExibicao(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}
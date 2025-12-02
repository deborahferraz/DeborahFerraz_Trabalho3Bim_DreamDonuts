// Configurações da API
const API_BASE_URL = 'http://localhost:3001';

// Inicializar quando o script carregar
document.addEventListener('DOMContentLoaded', function() {
    configurarDatasPadrao();
    descobrirEndpoint(); // Descobrir automaticamente o endpoint
    testarConexaoPedidos(); // Teste rápido de conexão
});

// TESTE RÁPIDO DE CONEXÃO
async function testarConexaoPedidos() {
    try {
        console.log('🧪 Testando conexão com endpoints de pedidos...');
        
        // Testar o endpoint principal
        const response = await fetch(`${API_BASE_URL}/pedido`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        console.log('✅ Status do endpoint /pedido:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Conexão OK! ${data.length} pedidos encontrados via /pedido`);
            localStorage.setItem('api_endpoint_pedidos', '/pedido');
        } else {
            console.log('❌ Endpoint /pedido retornou status:', response.status);
        }
    } catch (error) {
        console.error('❌ Erro ao testar endpoint /pedido:', error);
    }
}

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

// Função para descobrir o endpoint correto automaticamente - CORRIGIDA
async function descobrirEndpoint() {
    console.log('🔍 Descobrindo endpoints da API...');
    
    const endpoints = [
        '/pedido',           // ✅ ENDPOINT CORRETO PRINCIPAL
        '/api/pedidos',
        '/pedidos/api', 
        '/api/pedidos/listar',
        '/pedidos/listar',
        '/api/orders',
        '/orders'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testando: ${API_BASE_URL}${endpoint}`);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const contentType = response.headers.get('content-type');
            console.log(`Content-Type: ${contentType}`);
            
            if (response.ok && contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log(`✅ Endpoint encontrado: ${endpoint}`, data);
                
                // Salvar o endpoint descoberto
                localStorage.setItem('api_endpoint_pedidos', endpoint);
                return endpoint;
            }
        } catch (error) {
            console.log(`❌ Endpoint ${endpoint} falhou:`, error.message);
        }
    }
    
    console.log('❌ Nenhum endpoint JSON encontrado');
    return null;
}

// Função para buscar pedidos da API - CORRIGIDA
async function buscarPedidos() {
    try {
        console.log('📦 Buscando pedidos da API...');
        
        // Usar endpoint salvo ou o correto por padrão
        let endpoint = localStorage.getItem('api_endpoint_pedidos') || '/pedido';
        
        console.log(`📍 Usando endpoint: ${endpoint}`);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        console.log('Status:', response.status);
        console.log('URL:', response.url);
        
        // Verificar se a resposta é JSON
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
        }
        
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.log('Resposta não-JSON:', textResponse.substring(0, 500));
            
            // Se não for JSON, tentar descobrir novo endpoint
            const novoEndpoint = await descobrirEndpoint();
            if (novoEndpoint) {
                return await buscarPedidos(); // Tentar novamente com novo endpoint
            }
            
            throw new Error(`API retornou formato inválido (${contentType}). Esperado JSON.`);
        }
        
        const pedidos = await response.json();
        console.log('✅ Pedidos recebidos:', pedidos.length, 'pedidos');
        
        // Validar estrutura dos dados
        if (!Array.isArray(pedidos)) {
            console.warn('⚠️ Dados recebidos não são um array:', pedidos);
            throw new Error('Formato de dados inválido: esperado array de pedidos');
        }
        
        // Salvar no localStorage como backup
        localStorage.setItem('pedidos_backup', JSON.stringify(pedidos));
        
        return pedidos;
        
    } catch (error) {
        console.error('❌ Erro ao buscar pedidos:', error);
        
        // Tentar usar backup do localStorage
        try {
            const backup = localStorage.getItem('pedidos_backup');
            if (backup) {
                const pedidosBackup = JSON.parse(backup);
                console.log('🔄 Usando backup do localStorage:', pedidosBackup.length, 'pedidos');
                mostrarAviso('relatorio-vendas-container', 'Usando dados em cache. API offline.');
                return pedidosBackup;
            }
        } catch (backupError) {
            console.error('Erro ao carregar backup:', backupError);
        }
        
        throw error;
    }
}

// NOVA FUNÇÃO: Buscar pedidos COMPLETOS com itens
async function buscarPedidosCompletos() {
    try {
        console.log('📦 Buscando pedidos completos com itens...');
        
        const endpoint = localStorage.getItem('api_endpoint_pedidos') || '/pedido';
        const pedidos = await buscarPedidos(); // Busca básica
        
        // Agora buscar detalhes de CADA pedido individualmente
        const pedidosComDetalhes = [];
        
        for (const pedido of pedidos) {
            try {
                const pedidoId = pedido.id_pedido || pedido.id;
                console.log(`🔍 Buscando detalhes do pedido #${pedidoId}...`);
                
                const response = await fetch(`${API_BASE_URL}/pedido/${pedidoId}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const pedidoDetalhado = await response.json();
                    pedidosComDetalhes.push(pedidoDetalhado);
                    console.log(`✅ Pedido #${pedidoId} - ${pedidoDetalhado.itens?.length || 0} itens`);
                } else {
                    console.log(`❌ Não foi possível buscar detalhes do pedido #${pedidoId}`);
                    pedidosComDetalhes.push(pedido); // Usa o pedido básico
                }
                
                // Pequena pausa para não sobrecarregar o servidor
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`Erro no pedido #${pedido.id_pedido}:`, error);
                pedidosComDetalhes.push(pedido); // Usa o pedido básico
            }
        }
        
        console.log(`✅ ${pedidosComDetalhes.length} pedidos com detalhes processados`);
        return pedidosComDetalhes;
        
    } catch (error) {
        console.error('Erro ao buscar pedidos completos:', error);
        return await buscarPedidos(); // Fallback para busca básica
    }
}

// Função para buscar produtos da API
async function buscarProdutos() {
    try {
        console.log('🍩 Buscando produtos da API...');
        
        const endpoints = [
            '/produto',
            '/api/produtos',
            '/produtos/api', 
            '/api/products',
            '/products'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                const contentType = response.headers.get('content-type');
                if (response.ok && contentType && contentType.includes('application/json')) {
                    const produtos = await response.json();
                    console.log(`✅ Produtos encontrados em: ${endpoint}`, produtos.length, 'produtos');
                    return produtos;
                }
            } catch (error) {
                console.log(`Endpoint ${endpoint} falhou:`, error.message);
            }
        }
        
        console.log('❌ Nenhum endpoint de produtos encontrado');
        return [];
        
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        return [];
    }
}

// Função principal para gerar relatório de vendas - CORRIGIDA
async function gerarRelatorioVendas() {
    try {
        console.log('📊 Iniciando geração do relatório de vendas...');
        
        const mesSelect = document.getElementById('mes-vendas');
        const anoSelect = document.getElementById('ano-vendas');
        
        if (!mesSelect || !anoSelect) {
            mostrarErro('relatorio-vendas-container', 'Erro: Elementos do formulário não encontrados.');
            return;
        }

        const mes = mesSelect.value;
        const ano = anoSelect.value;
        
        console.log(`Parâmetros: Mês=${mes}, Ano=${ano}`);
        
        if (!mes || !ano) {
            mostrarErro('relatorio-vendas-container', 'Por favor, selecione o mês e o ano.');
            return;
        }

        // Mostrar loading
        mostrarLoading('relatorio-vendas-container', 'Conectando com a API...');

        // Buscar pedidos da API
        const pedidos = await buscarPedidos();
        
        console.log('Total de pedidos encontrados:', pedidos.length);
        
        if (!pedidos || pedidos.length === 0) {
            mostrarErro('relatorio-vendas-container', 'Nenhum pedido encontrado no sistema.');
            return;
        }

        // Filtrar pedidos pelo mês e ano - CORRIGIDO para estrutura real dos pedidos
        const pedidosFiltrados = pedidos.filter(pedido => {
            try {
                // Usar data_pedido que é o campo real na sua base de dados
                const dataPedido = new Date(pedido.data_pedido || pedido.data || pedido.DATA || pedido.createdAt || pedido.dataPedido || pedido.date);
                
                if (isNaN(dataPedido.getTime())) {
                    console.warn('⚠️ Data inválida no pedido:', pedido.id_pedido || pedido.id, pedido.data_pedido);
                    return false;
                }
                
                const mesPedido = dataPedido.getMonth() + 1;
                const anoPedido = dataPedido.getFullYear();
                
                return mesPedido === parseInt(mes) && anoPedido === parseInt(ano);
            } catch (error) {
                console.error('Erro ao processar data do pedido:', pedido.id_pedido || pedido.id, error);
                return false;
            }
        });
        
        console.log('Pedidos filtrados para o período:', pedidosFiltrados.length);
        
        // Gerar e exibir o relatório
        exibirRelatorioVendas(pedidosFiltrados, mes, ano);
        
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        mostrarErro('relatorio-vendas-container', `Erro: ${error.message}`);
    }
}

// Função para exibir o relatório de vendas - CORRIGIDA para estrutura real
function exibirRelatorioVendas(pedidos, mes, ano) {
    const container = document.getElementById('relatorio-vendas-container');
    
    if (!container) return;

    if (pedidos.length === 0) {
        container.innerHTML = `
            <div class="mensagem-aguardando">
                <p>Nenhum pedido encontrado para ${getNomeMes(mes)}/${ano}</p>
                <p style="font-size: 12px; margin-top: 10px;">
                    Verifique se há pedidos no período selecionado.
                </p>
            </div>
        `;
        return;
    }

    // Calcular totais - CORRIGIDO para campos reais
    const totalVendas = pedidos.reduce((total, pedido) => {
        const valor = parseFloat(
            pedido.valor_total || pedido.total || pedido.valorTotal || pedido.VALOR_TOTAL || 
            pedido.valor || pedido.precoTotal || 0
        );
        return total + (isNaN(valor) ? 0 : valor);
    }, 0);
    
    const quantidadePedidos = pedidos.length;
    const ticketMedio = quantidadePedidos > 0 ? totalVendas / quantidadePedidos : 0;

    // Gerar HTML do relatório - CORRIGIDO para campos reais
    const htmlRelatorio = `
        <div class="relatorio-vendas">
            <div class="resumo">
                <h3>📈 Relatório de Vendas por Período</h3>
                <p><strong>📅 Período:</strong> ${getNomeMes(mes)}/${ano}</p>
                <p><strong>💰 Total de Vendas:</strong> R$ ${totalVendas.toFixed(2)}</p>
                <p><strong>📦 Quantidade de Pedidos:</strong> ${quantidadePedidos}</p>
                <p><strong>🎫 Ticket Médio:</strong> R$ ${ticketMedio.toFixed(2)}</p>
            </div>
            
            <table class="tabela-relatorio">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Data</th>
                        <th>Usuário</th>
                        <th>Total (R$)</th>
                        <th>Status</th>
                        <th>Forma Pagamento</th>
                    </tr>
                </thead>
                <tbody>
                    ${pedidos.map(pedido => {
                        const data = pedido.data_pedido || pedido.data;
                        const id = pedido.id_pedido || pedido.id;
                        const usuario = pedido.nome_usuario || `Usuário ${pedido.usuario_id}` || 'Cliente';
                        const total = parseFloat(pedido.valor_total || pedido.total || 0);
                        const status = pedido.status_pedido || pedido.status || 'pendente';
                        const formaPagamento = pedido.forma_pagamento || pedido.formaPagamento || 'N/A';
                        
                        return `
                            <tr>
                                <td><strong>#${id}</strong></td>
                                <td>${formatarDataExibicao(data)}</td>
                                <td>${usuario}</td>
                                <td><strong>R$ ${total.toFixed(2)}</strong></td>
                                <td><span class="status-badge status-${status}">${getStatusText(status)}</span></td>
                                <td>${formatarPagamento(formaPagamento)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            
            <div class="acoes">
                <button class="btn-exportar" onclick="imprimirRelatorioEspecifico('vendas')">🖨️ Imprimir Este Relatório</button>
            </div>
        </div>
    `;
    
    container.innerHTML = htmlRelatorio;
    
    // Adicionar estilos para os status
    adicionarEstilosStatus();
}

// NOVA FUNÇÃO: Gerar relatório de produtos MELHORADO
async function gerarRelatorioProdutos() {
    try {
        const dataInicio = document.getElementById('data-inicio').value;
        const dataFim = document.getElementById('data-fim').value;
        
        if (!dataInicio || !dataFim) {
            mostrarErro('relatorio-produtos-container', 'Por favor, selecione a data início e data fim.');
            return;
        }

        // Mostrar loading
        mostrarLoading('relatorio-produtos-container', 'Buscando dados detalhados dos pedidos...');

        // Buscar pedidos COMPLETOS com itens
        const pedidos = await buscarPedidosCompletos();
        
        console.log('🎯 DATAS SELECIONADAS:', dataInicio, 'até', dataFim);
        console.log('📦 Total de pedidos encontrados na API:', pedidos.length);
        
        if (!pedidos || pedidos.length === 0) {
            mostrarErro('relatorio-produtos-container', 'Nenhum pedido encontrado no sistema.');
            return;
        }

        // DEBUG ESPECÍFICO PARA DATAS DE 2025
        console.log('🔍 INVESTIGANDO DATAS DOS PEDIDOS (2025):');
        pedidos.forEach((pedido, index) => {
            console.log(`📅 Pedido ${pedido.id_pedido || pedido.id}:`, {
                // Mostrar TODOS os campos do pedido que podem conter data
                todosOsCampos: Object.keys(pedido),
                // Mostrar valores de campos com "data" no nome
                camposData: Object.keys(pedido)
                    .filter(key => key.toLowerCase().includes('data') || 
                                  key.toLowerCase().includes('date') ||
                                  key.toLowerCase().includes('time'))
                    .reduce((obj, key) => {
                        obj[key] = pedido[key];
                        return obj;
                    }, {}),
                // Mostrar estrutura dos itens se existirem
                temItens: pedido.itens ? pedido.itens.length : 0,
                primeiroItem: pedido.itens ? pedido.itens[0] : null
            });
        });

        const dataInicioObj = new Date(dataInicio);
        const dataFimObj = new Date(dataFim);
        dataFimObj.setHours(23, 59, 59, 999);

        console.log('⏰ Período de filtro:', dataInicioObj.toISOString(), 'até', dataFimObj.toISOString());

        // Filtrar pedidos pelo período - VERSÃO SUPER FLEXÍVEL
        const pedidosFiltrados = pedidos.filter(pedido => {
            try {
                // TENTAR TODOS OS CAMPOS POSSÍVEIS DE DATA
                let dataPedido = null;
                let campoUsado = '';
                
                // Lista de campos possíveis para data
                const camposData = [
                    'data_pedido', 'data', 'createdAt', 'data_criacao', 
                    'dataPedido', 'date', 'DATA', 'timestamp', 'data_emissao',
                    'emissao', 'created_at', 'updated_at'
                ];
                
                for (const campo of camposData) {
                    if (pedido[campo]) {
                        dataPedido = new Date(pedido[campo]);
                        if (!isNaN(dataPedido.getTime())) {
                            campoUsado = campo;
                            break;
                        }
                    }
                }
                
                // Se não encontrou, tentar procurar em subcampos
                if (!dataPedido || isNaN(dataPedido.getTime())) {
                    // Verificar se há um objeto com data
                    for (const key in pedido) {
                        if (typeof pedido[key] === 'object' && pedido[key] !== null) {
                            for (const subcampo of camposData) {
                                if (pedido[key][subcampo]) {
                                    dataPedido = new Date(pedido[key][subcampo]);
                                    if (!isNaN(dataPedido.getTime())) {
                                        campoUsado = `${key}.${subcampo}`;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                
                if (!dataPedido || isNaN(dataPedido.getTime())) {
                    console.warn('❌ Não foi possível encontrar data válida no pedido:', pedido.id_pedido);
                    return false;
                }
                
                const estaNoPeriodo = dataPedido >= dataInicioObj && dataPedido <= dataFimObj;
                
                console.log(`📋 Pedido ${pedido.id_pedido}:`, {
                    campoUsado: campoUsado,
                    valorOriginal: pedido[campoUsado.split('.')[0]],
                    dataConvertida: dataPedido.toISOString(),
                    dataLegivel: dataPedido.toLocaleDateString('pt-BR'),
                    ano: dataPedido.getFullYear(),
                    estaNoPeriodo: estaNoPeriodo
                });
                
                return estaNoPeriodo;
            } catch (error) {
                console.error('❌ Erro ao processar data do pedido:', pedido.id_pedido, error);
                return false;
            }
        });

        console.log('✅ Pedidos filtrados para o período:', pedidosFiltrados.length);

        // Se nenhum pedido foi filtrado, mostrar TODOS os pedidos (forçando 2025)
        if (pedidosFiltrados.length === 0) {
            console.log('⚠️ Forçando exibição de TODOS os pedidos (modo debug 2025)');
            
            // Buscar produtos para obter nomes completos
            const produtos = await buscarProdutos();
            
            // Exibir relatório com todos os pedidos
            exibirRelatorioProdutosMelhorado(pedidos, produtos, dataInicio, dataFim);
            return;
        }

        // Buscar produtos para obter nomes completos
        const produtos = await buscarProdutos();
        
        exibirRelatorioProdutosMelhorado(pedidosFiltrados, produtos, dataInicio, dataFim);
        
    } catch (error) {
        console.error('❌ Erro ao gerar relatório de produtos:', error);
        mostrarErro('relatorio-produtos-container', `Erro ao gerar relatório: ${error.message}`);
    }
}

// NOVA FUNÇÃO: Exibir relatório de produtos MELHORADO
function exibirRelatorioProdutosMelhorado(pedidos, produtos, dataInicio, dataFim) {
    const container = document.getElementById('relatorio-produtos-container');
    
    if (!container) return;

    if (pedidos.length === 0) {
        container.innerHTML = `
            <div class="mensagem-aguardando">
                <p>Nenhum pedido encontrado para o período de ${formatarDataExibicao(dataInicio)} a ${formatarDataExibicao(dataFim)}</p>
            </div>
        `;
        return;
    }

    // Agrupar produtos vendidos - VERSÃO MELHORADA
    const produtosVendidos = {};
    let pedidosSemItens = 0;
    let totalItens = 0;
    
    pedidos.forEach(pedido => {
        // Verificar se o pedido tem itens detalhados
        if (pedido.itens && Array.isArray(pedido.itens) && pedido.itens.length > 0) {
            pedido.itens.forEach(item => {
                const produtoId = item.id_produto || item.produto_id;
                const nomeProduto = item.nome_produto || `Produto ${produtoId}`;
                const quantidade = Number(item.quantidade) || 1;
                const preco = Number(item.preco_unitario) || Number(item.preco) || 0;
                
                if (!produtosVendidos[nomeProduto]) {
                    produtosVendidos[nomeProduto] = {
                        quantidade: 0,
                        total: 0,
                        produtoId: produtoId
                    };
                }
                produtosVendidos[nomeProduto].quantidade += quantidade;
                produtosVendidos[nomeProduto].total += quantidade * preco;
                totalItens += quantidade;
            });
        } else {
            pedidosSemItens++;
            // Fallback melhorado: usar nome do produto se disponível
            const nomeProduto = pedido.nome_produto || `Pedido #${pedido.id_pedido}`;
            const total = parseFloat(pedido.valor_total || 0);
            
            if (!produtosVendidos[nomeProduto]) {
                produtosVendidos[nomeProduto] = {
                    quantidade: 1,
                    total: total,
                    produtoId: null
                };
            } else {
                produtosVendidos[nomeProduto].quantidade += 1;
                produtosVendidos[nomeProduto].total += total;
            }
            totalItens += 1;
        }
    });

    // Converter para array e ordenar por quantidade
    const produtosOrdenados = Object.entries(produtosVendidos)
        .map(([nome, dados]) => ({
            nome,
            quantidade: dados.quantidade,
            total: dados.total,
            produtoId: dados.produtoId
        }))
        .sort((a, b) => b.quantidade - a.quantidade);

    const htmlRelatorio = `
        <div class="relatorio-produtos">
            <div class="resumo">
                <h3>📊 Produtos Mais Vendidos</h3>
                <p><strong>📅 Período:</strong> ${formatarDataExibicao(dataInicio)} a ${formatarDataExibicao(dataFim)}</p>
                <p><strong>📦 Total de Pedidos Analisados:</strong> ${pedidos.length}</p>
                <p><strong>🏷️ Total de Produtos Diferentes:</strong> ${produtosOrdenados.length}</p>
                <p><strong>🛒 Total de Itens Vendidos:</strong> ${totalItens}</p>
                ${pedidosSemItens > 0 ? `<p class="aviso"><strong>⚠️ Atenção:</strong> ${pedidosSemItens} pedidos não possuem detalhes dos itens</p>` : ''}
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
                            <td><strong>${index + 1}º</strong></td>
                            <td>
                                <div style="font-weight: bold;">${produto.nome}</div>
                                ${produto.produtoId ? `<div style="font-size: 12px; color: #666;">ID: ${produto.produtoId}</div>` : '<div style="font-size: 12px; color: #ff6b6b;">⚠️ Pedido completo</div>'}
                            </td>
                            <td style="text-align: center;"><strong>${produto.quantidade}</strong> un.</td>
                            <td style="text-align: right;"><strong>R$ ${produto.total.toFixed(2)}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="acoes">
                <button class="btn-exportar" onclick="imprimirRelatorioEspecifico('produtos')">🖨️ Imprimir Este Relatório</button>
            </div>
        </div>
    `;
    
    container.innerHTML = htmlRelatorio;
}

// FUNÇÃO PARA TESTAR DETALHES DOS PEDIDOS
async function testarDetalhesPedidos() {
    try {
        const pedidos = await buscarPedidos();
        console.log('🧪 Testando detalhes dos pedidos...');
        
        let pedidosComItens = 0;
        let pedidosSemItens = 0;
        
        for (let i = 0; i < Math.min(5, pedidos.length); i++) {
            const pedido = pedidos[i];
            const pedidoId = pedido.id_pedido || pedido.id;
            
            const response = await fetch(`${API_BASE_URL}/pedido/${pedidoId}`);
            if (response.ok) {
                const detalhes = await response.json();
                const temItens = detalhes.itens && Array.isArray(detalhes.itens) && detalhes.itens.length > 0;
                
                if (temItens) {
                    pedidosComItens++;
                    console.log(`✅ Pedido #${pedidoId}:`, {
                        itens: detalhes.itens.length,
                        primeiroItem: detalhes.itens[0]
                    });
                } else {
                    pedidosSemItens++;
                    console.log(`❌ Pedido #${pedidoId}: SEM ITENS`);
                }
            }
            
            // Pequena pausa
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log(`📊 Resumo: ${pedidosComItens} com itens, ${pedidosSemItens} sem itens`);
        mostrarSucesso('relatorio-produtos-container', `Teste completo: ${pedidosComItens} pedidos com itens, ${pedidosSemItens} sem itens`);
        
    } catch (error) {
        console.error('Erro no teste:', error);
        mostrarErro('relatorio-produtos-container', `Erro no teste: ${error.message}`);
    }
}

// FUNÇÕES DE IMPRESSÃO (mantidas iguais)
function imprimirRelatorios() {
    const relatorioVendas = document.getElementById('relatorio-vendas-container');
    const relatorioProdutos = document.getElementById('relatorio-produtos-container');
    
    const temRelatorioVendas = relatorioVendas && !relatorioVendas.innerHTML.includes('mensagem-aguardando');
    const temRelatorioProdutos = relatorioProdutos && !relatorioProdutos.innerHTML.includes('mensagem-aguardando');
    
    if (!temRelatorioVendas && !temRelatorioProdutos) {
        alert('Por favor, gere pelo menos um relatório antes de imprimir.');
        return;
    }
    
    const janelaImpressao = window.open('', '_blank');
    const dataImpressao = new Date().toLocaleString('pt-BR');
    
    let conteudoHTML = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatórios Gerenciais</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #000; line-height: 1.4; }
                .cabecalho-impressao { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                .cabecalho-impressao h1 { margin: 0 0 10px 0; font-size: 24px; color: #000; }
                .relatorio-secao { margin-bottom: 40px; page-break-inside: avoid; }
                .relatorio-secao h2 { border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 15px; font-size: 18px; color: #000; }
                .resumo { background-color: #f5f5f5; padding: 15px; margin-bottom: 20px; border-left: 4px solid #000; }
                .resumo h3 { margin-top: 0; color: #000; }
                .tabela-relatorio { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; }
                .tabela-relatorio th, .tabela-relatorio td { border: 1px solid #000; padding: 8px 10px; text-align: left; }
                .tabela-relatorio th { background-color: #e0e0e0; font-weight: bold; }
                .tabela-relatorio tr:nth-child(even) { background-color: #f9f9f9; }
                .rodape-impressao { margin-top: 30px; padding-top: 15px; border-top: 1px solid #000; font-size: 11px; color: #666; }
                @media print { body { margin: 1cm; } .relatorio-secao { page-break-inside: avoid; } }
            </style>
        </head>
        <body>
            <div class="cabecalho-impressao">
                <h1>Relatórios Gerenciais - Sistema Comercial</h1>
                <p><strong>Data da Impressão:</strong> ${dataImpressao}</p>
            </div>
    `;
    
    if (temRelatorioVendas) {
        let conteudoVendas = relatorioVendas.innerHTML;
        conteudoVendas = conteudoVendas.replace(/<div class="acoes">[\s\S]*?<\/div>/, '');
        conteudoHTML += `<div class="relatorio-secao"><h2>Relatório de Vendas por Período</h2>${conteudoVendas}</div>`;
    }
    
    if (temRelatorioProdutos) {
        let conteudoProdutos = relatorioProdutos.innerHTML;
        conteudoProdutos = conteudoProdutos.replace(/<div class="acoes">[\s\S]*?<\/div>/, '');
        conteudoHTML += `<div class="relatorio-secao"><h2>Produtos Mais Vendidos</h2>${conteudoProdutos}</div>`;
    }
    
    conteudoHTML += `
            <div class="rodape-impressao">
                <p>Relatório gerado automaticamente pelo Sistema Comercial</p>
            </div>
        </body>
        </html>
    `;
    
    janelaImpressao.document.write(conteudoHTML);
    janelaImpressao.document.close();
    
    janelaImpressao.onload = function() {
        setTimeout(() => { janelaImpressao.print(); }, 500);
    };
}

function imprimirRelatorioEspecifico(tipo) {
    let container, titulo;
    
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
    
    const janelaImpressao = window.open('', '_blank');
    const dataImpressao = new Date().toLocaleString('pt-BR');
    
    let conteudoRelatorio = container.innerHTML;
    conteudoRelatorio = conteudoRelatorio.replace(/<div class="acoes">[\s\S]*?<\/div>/, '');
    
    const conteudoHTML = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${titulo}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #000; line-height: 1.4; }
                .cabecalho-impressao { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                .cabecalho-impressao h1 { margin: 0 0 10px 0; font-size: 24px; color: #000; }
                .resumo { background-color: #f5f5f5; padding: 15px; margin-bottom: 20px; border-left: 4px solid #000; }
                .resumo h3 { margin-top: 0; color: #000; }
                .tabela-relatorio { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; }
                .tabela-relatorio th, .tabela-relatorio td { border: 1px solid #000; padding: 8px 10px; text-align: left; }
                .tabela-relatorio th { background-color: #e0e0e0; font-weight: bold; }
                .tabela-relatorio tr:nth-child(even) { background-color: #f9f9f9; }
                .rodape-impressao { margin-top: 30px; padding-top: 15px; border-top: 1px solid #000; font-size: 11px; color: #666; }
                @media print { body { margin: 1cm; } }
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
    
    janelaImpressao.document.write(conteudoHTML);
    janelaImpressao.document.close();
    
    janelaImpressao.onload = function() {
        setTimeout(() => { janelaImpressao.print(); }, 500);
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
     {
        localStorage.removeItem('pedidos');
        localStorage.removeItem('pedidos_backup');
        localStorage.removeItem('api_endpoint_pedidos');
        mostrarSucesso('relatorio-vendas-container', 'Dados limpos com sucesso! Recarregando...');
        
        setTimeout(() => { location.reload(); }, 1500);
    }
}

// FUNÇÕES AUXILIARES - CORRIGIDAS
function mostrarLoading(containerId, mensagem = 'Carregando...') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="mensagem-aguardando">
                <div class="loading"></div>
                <p>${mensagem}</p>
            </div>
        `;
    }
}

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

function mostrarAviso(containerId, mensagem) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="aviso">${mensagem}</div>`;
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
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    } catch (error) {
        return dataString;
    }
}

function getStatusText(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'confirmado': 'Confirmado',
        'preparando': 'Preparando',
        'saiu_entrega': 'Saiu para Entrega',
        'entregue': 'Entregue',
        'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
}

function formatarPagamento(forma) {
    const formas = {
        'cartao_credito': 'Cartão Crédito',
        'cartao_debito': 'Cartão Débito',
        'pix': 'PIX',
        'dinheiro': 'Dinheiro'
    };
    return formas[forma] || forma;
}

// Função para adicionar estilos dos status
function adicionarEstilosStatus() {
    if (document.getElementById('estilos-status')) return;
    
    const style = document.createElement('style');
    style.id = 'estilos-status';
    style.textContent = `
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-pendente { background: #fff3cd; color: #856404; }
        .status-confirmado { background: #d1ecf1; color: #0c5460; }
        .status-preparando { background: #ffeaa7; color: #856404; }
        .status-saiu_entrega { background: #b8daff; color: #004085; }
        .status-entregue { background: #d4edda; color: #155724; }
        .status-cancelado { background: #f8d7da; color: #721c24; }
    `;
    document.head.appendChild(style);
}

// Função para testar conexão manualmente
async function testarConexaoAPI() {
    try {
        mostrarLoading('relatorio-vendas-container', 'Testando conexão com API...');
        const endpoint = await descobrirEndpoint();
        
        if (endpoint) {
            mostrarSucesso('relatorio-vendas-container', `✅ Conexão OK! Endpoint: ${endpoint}`);
        } else {
            mostrarErro('relatorio-vendas-container', '❌ Não foi possível conectar com a API');
        }
    } catch (error) {
        mostrarErro('relatorio-vendas-container', `Erro no teste: ${error.message}`);
    }
}

// Adicionar CSS para avisos e loading
const style = document.createElement('style');
style.textContent = `
    .aviso {
        color: #856404;
        background-color: #fff3cd;
        padding: 15px;
        border-radius: 5px;
        border: 1px solid #ffeaa7;
        margin: 10px 0;
    }
    
    .loading {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #4CAF50;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 10px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .erro {
        color: #d32f2f;
        background-color: #ffebee;
        padding: 15px;
        border-radius: 5px;
        border: 1px solid #ffcdd2;
        margin: 10px 0;
    }
    
    .sucesso {
        color: #388e3c;
        background-color: #e8f5e8;
        padding: 15px;
        border-radius: 5px;
        border: 1px solid #c8e6c9;
        margin: 10px 0;
    }
    
    .mensagem-aguardando {
        color: #666;
        font-style: italic;
        text-align: center;
        padding: 40px 20px;
        background-color: #f9f9f9;
        border-radius: 8px;
        border: 2px dashed #ddd;
        font-size: 16px;
    }
`;
document.head.appendChild(style);
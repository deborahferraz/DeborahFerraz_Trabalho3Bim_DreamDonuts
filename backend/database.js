const { Pool } = require('pg');

// Configuração da conexão com o banco de dados PostgreSQL
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'traficante123?',
  database: 'donut_shop',
  ssl: false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Pool de conexões
const pool = new Pool({
  ...dbConfig,
  max: 10,
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 30000,
});

// Tratamento de erros do pool
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

// Função para testar a conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL com sucesso!');
    
    // Testar query simples
    await client.query('SELECT 1 as test');
    
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar com o PostgreSQL:', err);
    return false;
  }
};

// Função para executar queries com tratamento de erro
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('❌ Erro ao executar query:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  } finally {
    client.release();
  }
};

// Função para transações - SIMPLIFICADA E CORRIGIDA
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    console.log('🔄 Iniciando transação...');
    await client.query('BEGIN');
    
    // Executar callback passando o client
    const result = await callback(client);
    
    await client.query('COMMIT');
    console.log('✅ Transação commitada com sucesso!');
    return result;
    
  } catch (error) {
    console.error('❌ Erro na transação, fazendo rollback...');
    await client.query('ROLLBACK');
    console.error('❌ Erro na transação:', error.message);
    throw error;
  } finally {
    client.release();
    console.log('🔓 Cliente liberado do pool');
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
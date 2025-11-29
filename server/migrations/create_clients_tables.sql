-- Create Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(50),
    saldo_creditos DECIMAL(10, 2) DEFAULT 0.00,
    documento_tipo VARCHAR(20),
    documento_numero VARCHAR(50),
    nacionalidade VARCHAR(100),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_nascimento DATE,
    endereco VARCHAR(255),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    pais VARCHAR(100),
    segmento VARCHAR(20) DEFAULT 'NOVO',
    tags TEXT[],
    valor_total_gasto DECIMAL(10, 2) DEFAULT 0.00,
    observacoes TEXT,
    organization_id VARCHAR(255) -- Multi-tenant support
);

-- Create Interactions Table
CREATE TABLE IF NOT EXISTS client_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL,
    descricao TEXT NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_responsavel VARCHAR(255)
);

-- Create Notes Table
CREATE TABLE IF NOT EXISTS client_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por VARCHAR(255),
    importante BOOLEAN DEFAULT FALSE
);

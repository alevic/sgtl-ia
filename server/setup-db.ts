import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5432/sgtl_db",
});

async function setup() {
    try {
        console.log("Setting up database...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS transaction (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                type TEXT NOT NULL,
                description TEXT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                currency TEXT DEFAULT 'BRL',
                date DATE NOT NULL,
                due_date DATE,
                payment_date DATE,
                status TEXT NOT NULL,
                payment_method TEXT,
                category TEXT,
                cost_center TEXT,
                accounting_classification TEXT,
                document_number TEXT,
                notes TEXT,
                organization_id TEXT NOT NULL,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Transaction table created successfully.");

        // Create Vehicle table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vehicle (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                placa TEXT NOT NULL UNIQUE,
                modelo TEXT NOT NULL,
                tipo TEXT NOT NULL CHECK (tipo IN ('ONIBUS', 'CAMINHAO')),
                status TEXT NOT NULL CHECK (status IN ('ATIVO', 'MANUTENCAO', 'EM_VIAGEM')),
                ano INTEGER NOT NULL,
                km_atual INTEGER NOT NULL DEFAULT 0,
                proxima_revisao_km INTEGER NOT NULL,
                ultima_revisao DATE,
                
                is_double_deck BOOLEAN DEFAULT FALSE,
                capacidade_passageiros INTEGER,
                mapa_configurado BOOLEAN DEFAULT FALSE,
                
                capacidade_carga DECIMAL(10, 2),
                
                observacoes TEXT,
                motorista_atual TEXT,
                
                organization_id TEXT NOT NULL,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Vehicle table created successfully.");

        // Create Seat table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS seat (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                vehicle_id UUID NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
                numero TEXT NOT NULL,
                andar INTEGER NOT NULL CHECK (andar IN (1, 2)),
                posicao_x INTEGER NOT NULL,
                posicao_y INTEGER NOT NULL,
                tipo TEXT NOT NULL CHECK (tipo IN ('CONVENCIONAL', 'EXECUTIVO', 'SEMI_LEITO', 'LEITO', 'CAMA', 'CAMA_MASTER')),
                status TEXT NOT NULL DEFAULT 'LIVRE' CHECK (status IN ('LIVRE', 'OCUPADO', 'PENDENTE', 'BLOQUEADO')),
                preco DECIMAL(10, 2),
                disabled BOOLEAN DEFAULT FALSE,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                UNIQUE(vehicle_id, numero)
            );
        `);

        console.log("Seat table created successfully.");

        // Create indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_vehicle_organization ON vehicle(organization_id);
            CREATE INDEX IF NOT EXISTS idx_vehicle_status ON vehicle(status);
            CREATE INDEX IF NOT EXISTS idx_vehicle_tipo ON vehicle(tipo);
            CREATE INDEX IF NOT EXISTS idx_seat_vehicle ON seat(vehicle_id);
            CREATE INDEX IF NOT EXISTS idx_seat_status ON seat(status);
        `);

        // Create Driver table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS driver (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                nome TEXT NOT NULL,
                cnh TEXT NOT NULL,
                categoria_cnh TEXT NOT NULL,
                validade_cnh DATE NOT NULL,
                passaporte TEXT,
                validade_passaporte DATE,
                telefone TEXT,
                email TEXT,
                endereco TEXT,
                cidade TEXT,
                estado TEXT,
                pais TEXT,
                status TEXT NOT NULL CHECK (status IN ('DISPONIVEL', 'EM_VIAGEM', 'FOLGA', 'AFASTADO')),
                data_contratacao DATE NOT NULL,
                salario DECIMAL(10, 2),
                anos_experiencia INTEGER,
                viagens_internacionais INTEGER DEFAULT 0,
                disponivel_internacional BOOLEAN DEFAULT FALSE,
                observacoes TEXT,
                
                organization_id TEXT NOT NULL,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Driver table created successfully.");

        // Create indexes for driver
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_driver_organization ON driver(organization_id);
            CREATE INDEX IF NOT EXISTS idx_driver_status ON driver(status);
            CREATE INDEX IF NOT EXISTS idx_driver_cnh ON driver(cnh);
        `);

        console.log("Indexes created successfully.");

        // Create Clients Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS clients (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                nome VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                telefone VARCHAR(50),
                saldo_creditos DECIMAL(10, 2) DEFAULT 0.00,
                historico_viagens INTEGER DEFAULT 0,
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
                organization_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Clients table created successfully.");

        // Create Client Interactions Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS client_interactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                cliente_id UUID REFERENCES clients(id) ON DELETE CASCADE,
                tipo VARCHAR(20) NOT NULL,
                descricao TEXT NOT NULL,
                data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                usuario_responsavel VARCHAR(255)
            );
        `);
        console.log("Client Interactions table created successfully.");

        // Create Client Notes Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS client_notes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                cliente_id UUID REFERENCES clients(id) ON DELETE CASCADE,
                titulo VARCHAR(255) NOT NULL,
                conteudo TEXT NOT NULL,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                criado_por VARCHAR(255),
                importante BOOLEAN DEFAULT FALSE
            );
        `);
        console.log("Client Notes table created successfully.");

        // Create indexes for clients
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_clients_organization ON clients(organization_id);
            CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
            CREATE INDEX IF NOT EXISTS idx_clients_documento ON clients(documento_numero);
        `);

        // Create Maintenance Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS maintenance (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                vehicle_id UUID NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
                tipo TEXT NOT NULL,
                status TEXT NOT NULL,
                data_agendada DATE NOT NULL,
                data_inicio DATE,
                data_conclusao DATE,
                km_veiculo INTEGER NOT NULL,
                descricao TEXT NOT NULL,
                custo_pecas DECIMAL(10, 2) DEFAULT 0,
                custo_mao_de_obra DECIMAL(10, 2) DEFAULT 0,
                moeda TEXT DEFAULT 'BRL',
                oficina TEXT,
                responsavel TEXT,
                observacoes TEXT,
                organization_id TEXT NOT NULL,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Maintenance table created successfully.");

        // Create indexes for maintenance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance(vehicle_id);
            CREATE INDEX IF NOT EXISTS idx_maintenance_organization ON maintenance(organization_id);
            CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
        `);

        console.log("Database setup completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error setting up database:", error);
        process.exit(1);
    }
}

setup();

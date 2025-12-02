import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5432/sgtl_db",
});

export async function setupDb() {
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

        // Create Companies Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS companies (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id TEXT NOT NULL UNIQUE,
                legal_name TEXT,
                cnpj TEXT,
                address TEXT,
                contact_email TEXT,
                phone TEXT,
                website TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Companies table created successfully.");

        // Create Routes Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS routes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id TEXT NOT NULL,
                name TEXT NOT NULL,
                origin_city TEXT NOT NULL,
                origin_state TEXT NOT NULL,
                destination_city TEXT NOT NULL,
                destination_state TEXT NOT NULL,
                distance_km DECIMAL(10, 2),
                duration_minutes INTEGER,
                stops JSONB DEFAULT '[]', -- Array of {city, state, arrival_time_offset, departure_time_offset}
                active BOOLEAN DEFAULT TRUE,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_routes_org ON routes(organization_id);
        `);

        // Add type column if it doesn't exist (migration)
        await pool.query(`
            ALTER TABLE routes 
            ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'IDA' CHECK (type IN ('IDA', 'VOLTA'));
        `);

        console.log("Routes table created successfully.");

        // Create Trips Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trips (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id TEXT NOT NULL,
                route_id UUID NOT NULL REFERENCES routes(id),
                return_route_id UUID REFERENCES routes(id),
                vehicle_id UUID REFERENCES vehicle(id),
                driver_id UUID REFERENCES driver(id),
                departure_date DATE NOT NULL,
                departure_time TIME NOT NULL,
                arrival_date DATE,
                arrival_time TIME,
                status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'DELAYED')),
                price_conventional DECIMAL(10, 2),
                price_executive DECIMAL(10, 2),
                price_semi_sleeper DECIMAL(10, 2),
                price_sleeper DECIMAL(10, 2),
                seats_available INTEGER,
                notes TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_trips_org ON trips(organization_id);
            CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
            CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(departure_date);
        `);
        console.log("Trips table created successfully.");

        // Migration: Add return_route_id column if it doesn't exist
        await pool.query(`
            ALTER TABLE trips 
            ADD COLUMN IF NOT EXISTS return_route_id UUID REFERENCES routes(id);
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_trips_return_route ON trips(return_route_id);
        `);

        // Create Reservations Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reservations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id TEXT NOT NULL,
                trip_id UUID NOT NULL REFERENCES trips(id),
                seat_id UUID REFERENCES seat(id), -- Nullable if standing or unassigned
                
                passenger_name TEXT NOT NULL,
                passenger_document TEXT NOT NULL,
                passenger_email TEXT,
                passenger_phone TEXT,
                
                status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'NO_SHOW')),
                ticket_code TEXT NOT NULL UNIQUE, -- Short code for lookup
                price DECIMAL(10, 2) NOT NULL,
                
                user_id TEXT, -- If booked by a logged-in user
                client_id UUID REFERENCES clients(id), -- Link to CRM
                
                notes TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_reservations_org ON reservations(organization_id);
            CREATE INDEX IF NOT EXISTS idx_reservations_trip ON reservations(trip_id);
            CREATE INDEX IF NOT EXISTS idx_reservations_code ON reservations(ticket_code);
            CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
        `);
        console.log("Reservations table created successfully.");

        // Create Parcels Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parcel_orders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id TEXT NOT NULL,
                
                sender_name TEXT NOT NULL,
                sender_document TEXT NOT NULL,
                sender_phone TEXT NOT NULL,
                
                recipient_name TEXT NOT NULL,
                recipient_document TEXT NOT NULL,
                recipient_phone TEXT NOT NULL,
                
                origin_city TEXT NOT NULL,
                origin_state TEXT NOT NULL,
                destination_city TEXT NOT NULL,
                destination_state TEXT NOT NULL,
                
                description TEXT NOT NULL,
                weight DECIMAL(10, 2),
                dimensions TEXT,
                
                status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RECEIVED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
                tracking_code TEXT NOT NULL UNIQUE,
                price DECIMAL(10, 2) NOT NULL,
                
                trip_id UUID REFERENCES trips(id), -- Optional, assigned later
                user_id TEXT, -- If booked by logged in user
                client_id UUID REFERENCES clients(id),
                
                notes TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_parcels_org ON parcel_orders(organization_id);
            CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcel_orders(status);
            CREATE INDEX IF NOT EXISTS idx_parcels_tracking ON parcel_orders(tracking_code);
        `);
        console.log("Parcels table created successfully.");

        // Create Charters Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS charter_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id TEXT NOT NULL,
                
                contact_name TEXT NOT NULL,
                contact_email TEXT NOT NULL,
                contact_phone TEXT NOT NULL,
                company_name TEXT, -- Optional (if corporate)
                
                origin_city TEXT NOT NULL,
                origin_state TEXT NOT NULL,
                destination_city TEXT NOT NULL,
                destination_state TEXT NOT NULL,
                
                departure_date DATE NOT NULL,
                departure_time TIME,
                return_date DATE,
                return_time TIME,
                
                passenger_count INTEGER NOT NULL,
                vehicle_type_requested TEXT, -- e.g., 'CONVENTIONAL', 'EXECUTIVE'
                
                description TEXT,
                status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'QUOTED', 'APPROVED', 'REJECTED', 'COMPLETED')),
                
                quote_price DECIMAL(10, 2), -- Price offered by admin
                
                user_id TEXT, -- If logged in
                client_id UUID REFERENCES clients(id),
                
                notes TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_charters_org ON charter_requests(organization_id);
            CREATE INDEX IF NOT EXISTS idx_charters_status ON charter_requests(status);
        `);
        console.log("Charters table created successfully.");

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

        // Create Location Tables
        console.log("Creating location tables...");

        // States
        await pool.query(`
            CREATE TABLE IF NOT EXISTS states (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                uf VARCHAR(2) NOT NULL UNIQUE
            );
        `);

        // Seed States if empty
        const statesCount = await pool.query('SELECT COUNT(*) FROM states');
        if (parseInt(statesCount.rows[0].count) === 0) {
            console.log("Seeding states...");
            await pool.query(`
                INSERT INTO states (name, uf) VALUES 
                ('Acre', 'AC'), ('Alagoas', 'AL'), ('Amapá', 'AP'), ('Amazonas', 'AM'), ('Bahia', 'BA'),
                ('Ceará', 'CE'), ('Distrito Federal', 'DF'), ('Espírito Santo', 'ES'), ('Goiás', 'GO'),
                ('Maranhão', 'MA'), ('Mato Grosso', 'MT'), ('Mato Grosso do Sul', 'MS'), ('Minas Gerais', 'MG'),
                ('Pará', 'PA'), ('Paraíba', 'PB'), ('Paraná', 'PR'), ('Pernambuco', 'PE'), ('Piauí', 'PI'),
                ('Rio de Janeiro', 'RJ'), ('Rio Grande do Norte', 'RN'), ('Rio Grande do Sul', 'RS'),
                ('Rondônia', 'RO'), ('Roraima', 'RR'), ('Santa Catarina', 'SC'), ('São Paulo', 'SP'),
                ('Sergipe', 'SE'), ('Tocantins', 'TO');
            `);
        }

        // Cities
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cities (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                state_id INTEGER NOT NULL REFERENCES states(id),
                UNIQUE(name, state_id)
            );
            CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state_id);
        `);

        // Neighborhoods
        await pool.query(`
            CREATE TABLE IF NOT EXISTS neighborhoods (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                city_id INTEGER NOT NULL REFERENCES cities(id),
                UNIQUE(name, city_id)
            );
            CREATE INDEX IF NOT EXISTS idx_neighborhoods_city ON neighborhoods(city_id);
        `);

        console.log("Location tables created successfully.");

        console.log("Database setup completed successfully!");
        // process.exit(0); // Don't exit if called from index.ts
    } catch (error) {
        console.error("Error setting up database:", error);
        // process.exit(1); // Don't exit if called from index.ts
        throw error;
    }
}

// Only run if called directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    setupDb().then(() => process.exit(0)).catch(() => process.exit(1));
}

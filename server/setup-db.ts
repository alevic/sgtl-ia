import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5432/sgtl_db",
});

export async function setupDb() {
    try {
        console.log("Setting up database...");

        // Create Better Auth tables first (required for authentication)
        console.log("Creating Better Auth tables...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS "user" (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                "emailVerified" BOOLEAN NOT NULL DEFAULT false,
                image TEXT,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                role TEXT DEFAULT 'user',
                banned BOOLEAN DEFAULT false,
                "banReason" TEXT,
                "banExpires" BIGINT,
                cpf TEXT UNIQUE,
                phone TEXT UNIQUE
            );

            CREATE TABLE IF NOT EXISTS session (
                id TEXT PRIMARY KEY,
                "expiresAt" TIMESTAMP NOT NULL,
                token TEXT NOT NULL UNIQUE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "ipAddress" TEXT,
                "userAgent" TEXT,
                "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                "activeOrganizationId" TEXT
            );

            CREATE TABLE IF NOT EXISTS account (
                id TEXT PRIMARY KEY,
                "accountId" TEXT NOT NULL,
                "providerId" TEXT NOT NULL,
                "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                "accessToken" TEXT,
                "refreshToken" TEXT,
                "idToken" TEXT,
                scope TEXT,
                "expiresAt" TIMESTAMP,
                "tokenType" TEXT,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                password TEXT
            );

            CREATE TABLE IF NOT EXISTS verification (
                id TEXT PRIMARY KEY,
                identifier TEXT NOT NULL,
                value TEXT NOT NULL,
                "expiresAt" TIMESTAMP NOT NULL,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS organization (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                slug TEXT UNIQUE,
                logo TEXT,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT
            );

            CREATE TABLE IF NOT EXISTS member (
                id TEXT PRIMARY KEY,
                "organizationId" TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
                "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                role TEXT NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE("organizationId", "userId")
            );

            CREATE TABLE IF NOT EXISTS invitation (
                id TEXT PRIMARY KEY,
                "organizationId" TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
                email TEXT NOT NULL,
                role TEXT,
                status TEXT NOT NULL,
                "expiresAt" TIMESTAMP NOT NULL,
                "inviterId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_session_user ON session("userId");
            CREATE INDEX IF NOT EXISTS idx_account_user ON account("userId");
            CREATE INDEX IF NOT EXISTS idx_member_org ON member("organizationId");
            CREATE INDEX IF NOT EXISTS idx_member_user ON member("userId");
        `);

        console.log("Better Auth tables created successfully.");

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
                status TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIALLY_PAID')),
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

        // Ensure transaction table has updated_at
        await pool.query(`
            ALTER TABLE transaction ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);

        // Create Vehicle table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vehicle (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                placa TEXT NOT NULL UNIQUE,
                modelo TEXT NOT NULL,
                tipo TEXT NOT NULL CHECK (tipo IN ('ONIBUS', 'CAMINHAO')),
                status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'IN_TRANSIT')),
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
                
                imagem TEXT,
                galeria JSONB,
                
                organization_id TEXT NOT NULL,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);


        // Create Vehicle Features table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vehicle_feature (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                vehicle_id UUID NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
                category TEXT,
                label TEXT NOT NULL,
                value TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_vehicle_feature_vehicle ON vehicle_feature(vehicle_id);
        `);

        console.log("Vehicle characteristics table created successfully.");

        // Create Seat table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS seat (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                vehicle_id UUID NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
                numero TEXT NOT NULL,
                andar INTEGER NOT NULL CHECK (andar IN (1, 2)),
                posicao_x INTEGER NOT NULL,
                posicao_y INTEGER NOT NULL,
                tipo TEXT NOT NULL CHECK (tipo IN ('CONVENCIONAL', 'EXECUTIVO', 'SEMI_LEITO', 'LEITO', 'CAMA', 'CAMA_MASTER', 'BLOQUEADO')),
                status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'PENDING', 'BLOCKED')),
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
                status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'IN_TRANSIT', 'ON_LEAVE', 'AWAY')),
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
                user_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Clients table created successfully.");

        // Migration for existing clients table
        await pool.query(`
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS user_id TEXT;
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
        `);

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
            ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'OUTBOUND' CHECK (type IN ('OUTBOUND', 'INBOUND', 'IDA', 'VOLTA'));
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
                status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'DELAYED', 'AGENDADA', 'CONFIRMADA', 'EM_CURSO', 'FINALIZADA', 'CONFIRMED')),
                price_conventional DECIMAL(10, 2),
                price_executive DECIMAL(10, 2),
                price_semi_sleeper DECIMAL(10, 2),
                price_sleeper DECIMAL(10, 2),
                price_bed DECIMAL(10, 2),
                price_master_bed DECIMAL(10, 2),
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
        // Create Trip Tags table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trip_tags (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                nome TEXT NOT NULL,
                cor TEXT,
                organization_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(nome, organization_id)
            );
            CREATE INDEX IF NOT EXISTS idx_trip_tags_org ON trip_tags(organization_id);
        `);
        console.log("Trip Tags table created successfully.");

        // Migration: Add return_route_id column if it doesn't exist
        await pool.query(`
            ALTER TABLE trips 
            ADD COLUMN IF NOT EXISTS return_route_id UUID REFERENCES routes(id);
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_trips_return_route ON trips(return_route_id);
        `);

        // Migration: Add new fields for Trip Details
        await pool.query(`
            ALTER TABLE trips
            ADD COLUMN IF NOT EXISTS title TEXT,
            ADD COLUMN IF NOT EXISTS trip_type TEXT,
            ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS cover_image TEXT,
            ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]',
            ADD COLUMN IF NOT EXISTS baggage_limit TEXT,
            ADD COLUMN IF NOT EXISTS alerts TEXT,
            ADD COLUMN IF NOT EXISTS price_bed DECIMAL(10, 2),
            ADD COLUMN IF NOT EXISTS price_master_bed DECIMAL(10, 2),
            ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
        `);

        // Migrate existing trip_type data to tags if tags is empty
        await pool.query(`
            UPDATE trips 
            SET tags = ARRAY[trip_type] 
            WHERE trip_type IS NOT NULL 
            AND (tags IS NULL OR array_length(tags, 1) IS NULL OR array_length(tags, 1) = 0);
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
                
                status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'NO_SHOW', 'USED', 'COMPLETED')),
                ticket_code TEXT NOT NULL UNIQUE, -- Short code for lookup
                price DECIMAL(10, 2) NOT NULL,
                
                user_id TEXT, -- If booked by a logged-in user
                client_id UUID REFERENCES clients(id), -- Link to CRM
                
                notes TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Ensure existing tables have the new columns for signal/credits/points
            ALTER TABLE reservations ADD COLUMN IF NOT EXISTS boarding_point TEXT;
            ALTER TABLE reservations ADD COLUMN IF NOT EXISTS dropoff_point TEXT;
            ALTER TABLE reservations ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0;
            ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_method TEXT;
            ALTER TABLE reservations ADD COLUMN IF NOT EXISTS external_payment_id TEXT;
            ALTER TABLE reservations ADD COLUMN IF NOT EXISTS credits_used DECIMAL(10, 2) DEFAULT 0;
            ALTER TABLE reservations ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT FALSE;

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
                
                status TEXT NOT NULL DEFAULT 'AWAITING' CHECK (status IN ('AWAITING', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'PENDING', 'CANCELLED')),
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
                status TEXT NOT NULL DEFAULT 'REQUEST' CHECK (status IN ('REQUEST', 'QUOTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PENDING', 'APPROVED', 'REJECTED')),
                
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
                status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
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

        // Manual Migrations (Ensure these columns exist)
        await pool.query(`
            ALTER TABLE transaction ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
            ALTER TABLE transaction ADD COLUMN IF NOT EXISTS maintenance_id UUID REFERENCES maintenance(id);
            ALTER TABLE transaction ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES reservations(id);
        `);

        await pool.query(`
            ALTER TABLE reservations 
            ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2),
            ADD COLUMN IF NOT EXISTS payment_method TEXT,
            ADD COLUMN IF NOT EXISTS external_payment_id TEXT,
            ADD COLUMN IF NOT EXISTS boarding_point TEXT,
            ADD COLUMN IF NOT EXISTS dropoff_point TEXT;
        `);


        // Migration: Add CPF and Phone to user table
        await pool.query(`
            ALTER TABLE "user" 
            ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE,
            ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;
        `);

        // Migration: Add imagem and galeria to vehicle table
        await pool.query(`
            ALTER TABLE vehicle 
            ADD COLUMN IF NOT EXISTS imagem TEXT,
            ADD COLUMN IF NOT EXISTS galeria JSONB;
        `);

        // Create system_parameters table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_parameters (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                description TEXT,
                group_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(organization_id, key)
            );
            CREATE INDEX IF NOT EXISTS idx_system_parameters_org ON system_parameters(organization_id);
        `);

        // Migration: Add group_name column if it doesn't exist
        await pool.query(`
            ALTER TABLE system_parameters 
            ADD COLUMN IF NOT EXISTS group_name TEXT;
        `);

        // Create index for group_name after ensuring it exists
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_system_parameters_group ON system_parameters(group_name);
        `);

        // Seed default trip safety margin if not exists
        await pool.query(`
            INSERT INTO system_parameters (organization_id, key, value, description)
            SELECT id, 'trip_auto_complete_safety_margin_hours', '168', 'Margem de segurança para finalização automática de viagens (em horas)'
            FROM "organization"
            ON CONFLICT (organization_id, key) DO NOTHING;
        `);

        // Migration: Update existing data to English Enums
        console.log("Normalizing database statuses to English Enums...");
        await pool.query(`
            -- First drop all existing status constraints to allow updates
            ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
            ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
            ALTER TABLE vehicle DROP CONSTRAINT IF EXISTS vehicle_status_check;
            ALTER TABLE seat DROP CONSTRAINT IF EXISTS seat_status_check;
            ALTER TABLE driver DROP CONSTRAINT IF EXISTS driver_status_check;
            ALTER TABLE parcel_orders DROP CONSTRAINT IF EXISTS parcel_orders_status_check;
            ALTER TABLE charter_requests DROP CONSTRAINT IF EXISTS charter_requests_status_check;
            ALTER TABLE maintenance DROP CONSTRAINT IF EXISTS maintenance_status_check;
            ALTER TABLE transaction DROP CONSTRAINT IF EXISTS transaction_status_check;
            ALTER TABLE routes DROP CONSTRAINT IF EXISTS routes_type_check;

            -- Migrate data
            -- Vehicle
            UPDATE vehicle SET status = 'ACTIVE' WHERE status IN ('LIVRE', 'ATIVO', 'ACTIVE');
            UPDATE vehicle SET status = 'MAINTENANCE' WHERE status IN ('EM_MANUTENCAO', 'MAINTENANCE');
            UPDATE vehicle SET status = 'IN_TRANSIT' WHERE status IN ('EM_TRANSITO', 'EM_CURSO', 'IN_TRANSIT');
            UPDATE vehicle SET tipo = 'ONIBUS' WHERE tipo IN ('ONIBUS', 'BUS');
            UPDATE vehicle SET tipo = 'CAMINHAO' WHERE tipo IN ('CAMINHAO', 'TRUCK');

            -- Routes
            UPDATE routes SET type = 'OUTBOUND' WHERE type IN ('IDA', 'OUTBOUND');
            UPDATE routes SET type = 'INBOUND' WHERE type IN ('VOLTA', 'INBOUND');

            -- Trips
            UPDATE trips SET status = 'SCHEDULED' WHERE status IN ('AGENDADA', 'AGENDADO', 'SCHEDULED');
            UPDATE trips SET status = 'BOARDING' WHERE status IN ('EMBARQUE', 'BOARDING');
            UPDATE trips SET status = 'IN_TRANSIT' WHERE status IN ('EM_CURSO', 'EM_TRANSITO', 'IN_TRANSIT');
            UPDATE trips SET status = 'COMPLETED' WHERE status IN ('FINALIZADA', 'FINALIZADO', 'CONCLUIDA', 'CONCLUIDO', 'COMPLETED');
            UPDATE trips SET status = 'CANCELLED' WHERE status IN ('CANCELADA', 'CANCELADO', 'CANCELLED');
            UPDATE trips SET status = 'DELAYED' WHERE status IN ('ATRASADA', 'ATRASADO', 'DELAYED');

            -- Transaction
            UPDATE transaction SET status = 'PENDING' WHERE status IN ('PENDENTE', 'PENDING');
            UPDATE transaction SET status = 'PAID' WHERE status IN ('PAGA', 'PAGO', 'PAID');
            UPDATE transaction SET status = 'OVERDUE' WHERE status IN ('VENCIDA', 'VENCIDO', 'OVERDUE');
            UPDATE transaction SET status = 'CANCELLED' WHERE status IN ('CANCELADA', 'CANCELADO', 'CANCELLED');
            UPDATE transaction SET status = 'PARTIALLY_PAID' WHERE status IN ('PAGA_PARCIAL', 'PAGO_PARCIAL', 'PARCIALMENTE_PAGO', 'PARCIALMENTE_PAGA', 'PARTIALLY_PAID');
            UPDATE transaction SET type = 'INCOME' WHERE type IN ('RECEITA', 'INCOME');
            UPDATE transaction SET type = 'EXPENSE' WHERE type IN ('DESPESA', 'EXPENSE');
            UPDATE transaction SET type = 'TRANSFER' WHERE type IN ('TRANSFERENCIA', 'TRANSFER');

            -- Driver
            UPDATE driver SET status = 'AVAILABLE' WHERE status IN ('DISPONIVEL', 'LIVRE', 'AVAILABLE');
            UPDATE driver SET status = 'IN_TRANSIT' WHERE status IN ('EM_VIAGEM', 'EM_TRANSITO', 'IN_TRANSIT');
            UPDATE driver SET status = 'ON_LEAVE' WHERE status IN ('FOLGA', 'ON_LEAVE');
            UPDATE driver SET status = 'AWAY' WHERE status IN ('AFASTADO', 'AWAY');

            -- Parcel Orders
            UPDATE parcel_orders SET status = 'AWAITING' WHERE status IN ('PENDENTE', 'AGUARDANDO', 'AWAITING', 'PENDING');
            UPDATE parcel_orders SET status = 'IN_TRANSIT' WHERE status IN ('EM_TRANSITO', 'EM_CURSO', 'IN_TRANSIT');
            UPDATE parcel_orders SET status = 'DELIVERED' WHERE status IN ('ENTREGUE', 'DELIVERED');
            UPDATE parcel_orders SET status = 'RETURNED' WHERE status IN ('DEVOLVIDA', 'DEVOLVIDO', 'RETURNED');
            -- Update carrier types if they exist or were used
            -- UPDATE parcel_orders SET carrier_type = 'BUS_CARGO' WHERE carrier_type IN ('CARGA_ONIBUS', 'BUS_CARGO');
            -- UPDATE parcel_orders SET carrier_type = 'TRUCK_FREIGHT' WHERE carrier_type IN ('FRETE_CAMINHAO', 'TRUCK_FREIGHT');

            -- Charter Requests
            UPDATE charter_requests SET status = 'REQUEST' WHERE status IN ('SOLICITACAO', 'SOLICITADO', 'SOLICITADA', 'PENDENTE', 'REQUEST', 'PENDING');
            UPDATE charter_requests SET status = 'QUOTED' WHERE status IN ('ORCAMENTO', 'COTADO', 'COTADA', 'QUOTED');
            UPDATE charter_requests SET status = 'CONFIRMED' WHERE status IN ('CONFIRMADO', 'CONFIRMADA', 'APROVADO', 'APROVADA', 'CONFIRMED');
            UPDATE charter_requests SET status = 'IN_PROGRESS' WHERE status IN ('EM_ANDAMENTO', 'EM_CURSO', 'IN_PROGRESS');
            UPDATE charter_requests SET status = 'COMPLETED' WHERE status IN ('CONCLUIDO', 'CONCLUIDA', 'FINALIZADO', 'FINALIZADA', 'COMPLETED');
            UPDATE charter_requests SET status = 'CANCELLED' WHERE status IN ('CANCELADO', 'CANCELADA', 'CANCELLED');

            -- Maintenance
            UPDATE maintenance SET status = 'SCHEDULED' WHERE status IN ('AGENDADA', 'AGENDADO', 'SCHEDULED');
            UPDATE maintenance SET status = 'IN_PROGRESS' WHERE status IN ('EM_ANDAMENTO', 'EM_CURSO', 'IN_PROGRESS');
            UPDATE maintenance SET status = 'COMPLETED' WHERE status IN ('CONCLUIDA', 'CONCLUIDO', 'FINALIZADA', 'FINALIZADO', 'COMPLETED');
            UPDATE maintenance SET status = 'CANCELLED' WHERE status IN ('CANCELADA', 'CANCELADO', 'CANCELLED');
            UPDATE maintenance SET tipo = 'PREVENTIVE' WHERE tipo IN ('PREVENTIVA', 'PREVENTIVE');
            UPDATE maintenance SET tipo = 'CORRECTIVE' WHERE tipo IN ('CORRETIVA', 'CORRECTIVE');
            UPDATE maintenance SET tipo = 'PREDICTIVE' WHERE tipo IN ('PREDITIVA', 'PREDICTIVE');
            UPDATE maintenance SET tipo = 'INSPECTION' WHERE tipo IN ('INSPECAO', 'INSPECTION');

            -- Reservations
            UPDATE reservations SET status = 'PENDING' WHERE status IN ('PENDENTE', 'PENDING');
            UPDATE reservations SET status = 'CONFIRMED' WHERE status IN ('CONFIRMADA', 'CONFIRMED');
            UPDATE reservations SET status = 'CANCELLED' WHERE status IN ('CANCELADA', 'CANCELLED');
            UPDATE reservations SET status = 'USED' WHERE status IN ('UTILIZADA', 'USED');
            UPDATE reservations SET status = 'CHECKED_IN' WHERE status IN ('EMBARCADO', 'CHECKED_IN');

            -- Seat
            UPDATE seat SET status = 'AVAILABLE' WHERE status IN ('LIVRE', 'DISPONIVEL', 'AVAILABLE');
            UPDATE seat SET status = 'OCCUPIED' WHERE status IN ('OCUPADO', 'OCCUPIED');
            UPDATE seat SET status = 'PENDING' WHERE status IN ('PENDENTE', 'PENDING');
            UPDATE seat SET status = 'BLOCKED' WHERE status IN ('BLOQUEADO', 'BLOCKED');

            -- Re-apply strict constraints
            -- Reservations Status
            ALTER TABLE reservations ADD CONSTRAINT reservations_status_check 
            CHECK (status IN ('PENDING', 'PENDENTE', 'CONFIRMED', 'CONFIRMADA', 'CANCELLED', 'CANCELADA', 'CHECKED_IN', 'NO_SHOW', 'USED', 'COMPLETED'));

            -- Trips Status
            ALTER TABLE trips ADD CONSTRAINT trips_status_check
            CHECK (status IN ('SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'DELAYED'));

            -- Vehicle Status
            ALTER TABLE vehicle ADD CONSTRAINT vehicle_status_check
            CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'IN_TRANSIT'));

            -- Seat Status
            ALTER TABLE seat ADD CONSTRAINT seat_status_check
            CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'PENDING', 'BLOCKED'));

            -- Driver Status
            ALTER TABLE driver ADD CONSTRAINT driver_status_check
            CHECK (status IN ('AVAILABLE', 'IN_TRANSIT', 'ON_LEAVE', 'AWAY'));

            -- Parcel Orders Status
            ALTER TABLE parcel_orders ADD CONSTRAINT parcel_orders_status_check
            CHECK (status IN ('AWAITING', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'));

            -- Charter Requests Status
            ALTER TABLE charter_requests ADD CONSTRAINT charter_requests_status_check
            CHECK (status IN ('REQUEST', 'QUOTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

            -- Maintenance Status
            ALTER TABLE maintenance ADD CONSTRAINT maintenance_status_check
            CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

            -- Transaction Status
            ALTER TABLE transaction ADD CONSTRAINT transaction_status_check
            CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIALLY_PAID'));

            -- Route Type Status
            ALTER TABLE routes ADD CONSTRAINT routes_type_check
            CHECK (type IN ('OUTBOUND', 'INBOUND'));
        `);

        console.log("System parameters table created and seeded successfully.");

        console.log("Database setup completed successfully!");
    } catch (error) {
        console.error("Error setting up database:", error);
        throw error;
    }
}

// Only run if called directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    setupDb().then(() => process.exit(0)).catch(() => process.exit(1));
}

import { pgTable, text, timestamp, boolean, bigint, uniqueIndex, varchar, integer, decimal, uuid, primaryKey, unique } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    username: text("username").unique(),
    name: text("name").notNull(),
    email: text("email"),
    emailVerified: boolean("emailVerified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    role: text("role").default("user"),
    banned: boolean("banned").default(false),
    banReason: text("banReason"),
    banExpires: bigint("banExpires", { mode: "number" }),
    documento: text("documento").unique(),
    documento_tipo: varchar("documento_tipo", { length: 20 }).default("CPF"),
    phone: text("phone").unique(),
    birth_date: timestamp("birth_date"),
    notes: text("notes"),
    is_active: boolean("is_active").default(true),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId").notNull().references(() => user.id, { onDelete: 'cascade' }),
    activeOrganizationId: text("activeOrganizationId"),
}, (table) => {
    return {
        userIdIdx: uniqueIndex("idx_session_user").on(table.userId),
    };
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId").notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    scope: text("scope"),
    expiresAt: timestamp("expiresAt"),
    tokenType: text("tokenType"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    password: text("password"),
}, (table) => {
    return {
        userIdIdx: uniqueIndex("idx_account_user").on(table.userId),
    };
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

export const organization = pgTable("organization", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique(),
    logo: text("logo"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    metadata: text("metadata"),
});

export const member = pgTable("member", {
    id: text("id").primaryKey(),
    organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: 'cascade' }),
    userId: text("userId").notNull().references(() => user.id, { onDelete: 'cascade' }),
    role: text("role").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => {
    return {
        orgUserUnique: unique("member_organizationId_userId_unique").on(table.organizationId, table.userId),
        orgIdIdx: uniqueIndex("idx_member_org").on(table.organizationId),
        userIdIdx: uniqueIndex("idx_member_user").on(table.userId),
    };
});

export const invitation = pgTable("invitation", {
    id: text("id").primaryKey(),
    organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: 'cascade' }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    inviterId: text("inviterId").notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId").references(() => user.id, { onDelete: 'set null' }),
    organization_id: text("organization_id"),
    action: text("action").notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
    entity: text("entity").notNull(), // 'parcel_orders', 'clients', 'user', etc.
    entity_id: text("entity_id"),
    old_data: text("old_data"),
    new_data: text("new_data"),
    ip_address: text("ip_address"),
    user_agent: text("user_agent"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bankAccounts = pgTable("bank_accounts", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    bank_name: varchar("bank_name", { length: 255 }),
    account_number: varchar("account_number", { length: 100 }),
    initial_balance: decimal("initial_balance", { precision: 15, scale: 2 }).default("0.00"),
    current_balance: decimal("current_balance", { precision: 15, scale: 2 }).default("0.00"),
    currency: varchar("currency", { length: 10 }).default("BRL"),
    is_default: boolean("is_default").default(false),
    active: boolean("active").default(true),
    organization_id: text("organization_id").notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
}, (table) => {
    return {
        nameOrgUnique: unique("bank_accounts_name_organization_id_unique").on(table.name, table.organization_id),
    };
});

export const costCenters = pgTable("cost_centers", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    active: boolean("active").default(true),
    organization_id: text("organization_id").notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
}, (table) => {
    return {
        nameOrgUnique: unique("cost_centers_name_organization_id_unique").on(table.name, table.organization_id),
    };
});

export const categories = pgTable("categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    type: text("type").notNull(), // 'INCOME' or 'EXPENSE'
    cost_center_id: uuid("cost_center_id").references(() => costCenters.id, { onDelete: 'cascade' }),
    active: boolean("active").default(true),
    organization_id: text("organization_id").notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
}, (table) => {
    return {
        nameOrgUnique: unique("categories_name_organization_id_unique").on(table.name, table.organization_id),
    };
});

export const transactions = pgTable("transaction", {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    description: text("description").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").default("BRL"),
    date: text("date").notNull(), // Using text to match DATE in SQL or manage mapping better
    due_date: text("due_date"),
    payment_date: text("payment_date"),
    status: text("status").notNull(),
    payment_method: text("payment_method"),
    category: text("category"), // Keep for legacy string support
    category_id: uuid("category_id").references(() => categories.id),
    cost_center: text("cost_center"),
    cost_center_id: uuid("cost_center_id").references(() => costCenters.id),
    bank_account_id: uuid("bank_account_id").references(() => bankAccounts.id),
    reservation_id: uuid("reservation_id").references(() => reservations.id),
    parcel_id: uuid("parcel_id").references(() => parcelOrders.id), // Added for direct link
    maintenance_id: uuid("maintenance_id"), // maintenance table not yet in drizzle
    client_id: uuid("client_id").references(() => clients.id),
    classificacao_contabil: text("classificacao_contabil"),
    document_number: text("document_number"),
    notes: text("notes"),
    organization_id: text("organization_id").notNull(),
    created_by: text("created_by"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const vehicle = pgTable("vehicle", {
    id: uuid("id").primaryKey().defaultRandom(),
    placa: text("placa").notNull().unique(),
    modelo: text("modelo").notNull(),
    tipo: text("tipo").notNull(),
    status: text("status").notNull().default('ACTIVE'),
    ano: integer("ano").notNull(),
    km_atual: integer("km_atual").notNull().default(0),
    proxima_revisao_km: integer("proxima_revisao_km").notNull(),
    ultima_revisao: timestamp("ultima_revisao"),
    is_double_deck: boolean("is_double_deck").default(false),
    capacidade_passageiros: integer("capacidade_passageiros"),
    mapa_configurado: boolean("mapa_configurado").default(false),
    capacidade_carga: decimal("capacidade_carga", { precision: 10, scale: 2 }),
    observacoes: text("observacoes"),
    motorista_atual: text("motorista_atual"),
    imagem: text("imagem"),
    galeria: text("galeria"), // JSONB in DB
    organization_id: text("organization_id").notNull(),
    created_by: text("created_by"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const seat = pgTable("seat", {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicle_id: uuid("vehicle_id").notNull().references(() => vehicle.id, { onDelete: 'cascade' }),
    numero: text("numero").notNull(),
    andar: integer("andar").notNull(),
    posicao_x: integer("posicao_x").notNull(),
    posicao_y: integer("posicao_y").notNull(),
    tipo: text("tipo").notNull(),
    status: text("status").notNull().default('AVAILABLE'),
    preco: decimal("preco", { precision: 10, scale: 2 }),
    disabled: boolean("disabled").default(false),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
}, (table) => {
    return {
        vehicleSeatUnique: unique("seat_vehicle_id_numero_unique").on(table.vehicle_id, table.numero),
    };
});

export const driver = pgTable("driver", {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: text("nome").notNull(),
    cnh: text("cnh").notNull(),
    categoria_cnh: text("categoria_cnh").notNull(),
    validade_cnh: timestamp("validade_cnh").notNull(),
    passaporte: text("passaporte"),
    validade_passaporte: timestamp("validade_passaporte"),
    telefone: text("telefone"),
    email: text("email"),
    endereco: text("endereco"),
    cidade: text("cidade"),
    estado: text("estado"),
    pais: text("pais"),
    status: text("status").notNull().default('AVAILABLE'),
    data_contratacao: timestamp("data_contratacao").notNull(),
    salario: decimal("salario", { precision: 10, scale: 2 }),
    anos_experiencia: integer("anos_experiencia"),
    viagens_internacionais: integer("viagens_internacionais").default(0),
    disponivel_internacional: boolean("disponivel_internacional").default(false),
    observacoes: text("observacoes"),
    organization_id: text("organization_id").notNull(),
    created_by: text("created_by"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const clients = pgTable("clients", {
    id: uuid("id").primaryKey().defaultRandom(),
    nome: varchar("nome", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    telefone: varchar("telefone", { length: 50 }),
    saldo_creditos: decimal("saldo_creditos", { precision: 10, scale: 2 }).default("0.00"),
    historico_viagens: integer("historico_viagens").default(0),
    tipo_cliente: varchar("tipo_cliente", { length: 20 }).default('PESSOA_FISICA'),
    documento_tipo: varchar("documento_tipo", { length: 20 }).default('CPF'),
    documento: varchar("documento", { length: 50 }),
    nacionalidade: varchar("nacionalidade", { length: 100 }),
    data_cadastro: timestamp("data_cadastro").defaultNow(),
    data_nascimento: timestamp("data_nascimento"),
    endereco: varchar("endereco", { length: 255 }),
    cidade: varchar("cidade", { length: 100 }),
    estado: varchar("estado", { length: 2 }),
    pais: varchar("pais", { length: 100 }),
    segmento: varchar("segmento", { length: 20 }).default('NOVO'),
    tags: text("tags").array(),
    valor_total_gasto: decimal("valor_total_gasto", { precision: 10, scale: 2 }).default("0.00"),
    observacoes: text("observacoes"),
    organization_id: text("organization_id"),
    user_id: text("user_id"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
    razao_social: varchar("razao_social", { length: 255 }),
    nome_fantasia: varchar("nome_fantasia", { length: 255 }),
    cnpj: varchar("cnpj", { length: 18 }),
});

export const routes = pgTable("routes", {
    id: uuid("id").primaryKey().defaultRandom(),
    organization_id: text("organization_id").notNull(),
    name: text("name").notNull(),
    origin_city: text("origin_city").notNull(),
    origin_state: text("origin_state").notNull(),
    destination_city: text("destination_city").notNull(),
    destination_state: text("destination_state").notNull(),
    origin_neighborhood: text("origin_neighborhood"),
    destination_neighborhood: text("destination_neighborhood"),
    distance_km: decimal("distance_km", { precision: 10, scale: 2 }),
    duration_minutes: integer("duration_minutes"),
    stops: text("stops"), // JSONB in DB
    type: text("type").default('OUTBOUND'),
    active: boolean("active").default(true),
    created_by: text("created_by"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const trips = pgTable("trips", {
    id: uuid("id").primaryKey().defaultRandom(),
    organization_id: text("organization_id").notNull(),
    route_id: uuid("route_id").notNull().references(() => routes.id),
    return_route_id: uuid("return_route_id").references(() => routes.id),
    vehicle_id: uuid("vehicle_id").references(() => vehicle.id),
    driver_id: uuid("driver_id").references(() => driver.id),
    departure_date: timestamp("departure_date").notNull(),
    departure_time: text("departure_time").notNull(),
    arrival_date: timestamp("arrival_date"),
    arrival_time: text("arrival_time"),
    status: text("status").notNull().default('SCHEDULED'),
    price_conventional: decimal("price_conventional", { precision: 10, scale: 2 }),
    price_executive: decimal("price_executive", { precision: 10, scale: 2 }),
    price_semi_sleeper: decimal("price_semi_sleeper", { precision: 10, scale: 2 }),
    price_sleeper: decimal("price_sleeper", { precision: 10, scale: 2 }),
    price_bed: decimal("price_bed", { precision: 10, scale: 2 }),
    price_master_bed: decimal("price_master_bed", { precision: 10, scale: 2 }),
    seats_available: integer("seats_available"),
    notes: text("notes"),
    trip_code: text("trip_code").unique(),
    title: text("title"),
    trip_type: text("trip_type"),
    tags: text("tags").array(),
    cover_image: text("cover_image"),
    gallery: text("gallery"), // JSONB
    baggage_limit: text("baggage_limit"),
    alerts: text("alerts"),
    active: boolean("active").default(true),
    created_by: text("created_by"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const reservations = pgTable("reservations", {
    id: uuid("id").primaryKey().defaultRandom(),
    organization_id: text("organization_id").notNull(),
    trip_id: uuid("trip_id").notNull().references(() => trips.id),
    seat_id: uuid("seat_id").references(() => seat.id),
    passenger_name: text("passenger_name").notNull(),
    passenger_document: text("passenger_document").notNull(),
    passenger_email: text("passenger_email"),
    passenger_phone: text("passenger_phone"),
    status: text("status").notNull().default('PENDING'),
    ticket_code: text("ticket_code").notNull().unique(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    user_id: text("user_id"),
    client_id: uuid("client_id").references(() => clients.id),
    boarding_point: text("boarding_point"),
    dropoff_point: text("dropoff_point"),
    amount_paid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0.00"),
    payment_method: text("payment_method"),
    external_payment_id: text("external_payment_id"),
    credits_used: decimal("credits_used", { precision: 10, scale: 2 }).default("0.00"),
    is_partial: boolean("is_partial").default(false),
    notes: text("notes"),
    created_by: text("created_by"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const parcelOrders = pgTable("parcel_orders", {
    id: uuid("id").primaryKey().defaultRandom(),
    organization_id: text("organization_id").notNull(),
    sender_name: text("sender_name").notNull(),
    sender_document: text("sender_document").notNull(),
    sender_phone: text("sender_phone").notNull(),
    recipient_name: text("recipient_name").notNull(),
    recipient_document: text("recipient_document").notNull(),
    recipient_phone: text("recipient_phone").notNull(),
    origin_city: text("origin_city").notNull(),
    origin_state: text("origin_state").notNull(),
    destination_city: text("destination_city").notNull(),
    destination_state: text("destination_state").notNull(),
    description: text("description").notNull(),
    weight: decimal("weight", { precision: 10, scale: 2 }),
    dimensions: text("dimensions"),
    status: text("status").notNull().default('AWAITING'),
    tracking_code: text("tracking_code").notNull().unique(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    trip_id: uuid("trip_id").references(() => trips.id),
    user_id: text("user_id"),
    client_id: uuid("client_id").references(() => clients.id),
    notes: text("notes"),
    created_by: text("created_by"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
});

export const tripTransactions = pgTable("trip_transactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    trip_id: uuid("trip_id").notNull().references(() => trips.id, { onDelete: 'cascade' }),
    transaction_id: uuid("transaction_id").notNull().references(() => transactions.id, { onDelete: 'cascade' }),
    amount_allocated: decimal("amount_allocated", { precision: 10, scale: 2 }),
    notes: text("notes"),
    created_at: timestamp("created_at").defaultNow(),
});

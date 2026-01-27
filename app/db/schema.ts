import { pgTable, text, timestamp, boolean, varchar, uuid, decimal, integer, jsonb, date, time, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Better Auth Tables
export const user = pgTable('user', {
    id: text('id').primaryKey(),
    username: text('username').unique(),
    name: text('name').notNull(),
    email: text('email'),
    emailVerified: boolean('emailVerified').notNull().default(false),
    image: text('image'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    role: text('role').default('user'),
    banned: boolean('banned').default(false),
    banReason: text('banReason'),
    banExpires: integer('banExpires'), // BIGINT in SQL, integer in simplified schema
    documento: text('documento').unique(),
    documento_tipo: varchar('documento_tipo', { length: 20 }).default('CPF'),
    phone: text('phone'),
    notes: text('notes'),
    birth_date: date('birth_date'),
    is_active: boolean('is_active').default(true),
});

export const session = pgTable('session', {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expiresAt').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    activeOrganizationId: text('activeOrganizationId'),
});

export const account = pgTable('account', {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    scope: text('scope'),
    expiresAt: timestamp('expiresAt'),
    tokenType: text('tokenType'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    password: text('password'),
});

export const organization = pgTable('organization', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').unique(),
    logo: text('logo'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    metadata: text('metadata'),
    // Legacy support / Expanded org details
    cnpj: varchar('cnpj', { length: 20 }),
    address: text('address'),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    website: varchar('website', { length: 255 }),
});

export const member = pgTable('member', {
    id: text('id').primaryKey(),
    organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const invitation = pgTable('invitation', {
    id: text('id').primaryKey(),
    organizationId: text('organizationId').notNull().references(() => organization.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role'),
    status: text('status').notNull(),
    expiresAt: timestamp('expiresAt').notNull(),
    inviterId: text('inviterId').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

// Business Tables
export const clients = pgTable('clients', {
    id: uuid('id').primaryKey().defaultRandom(),
    nome: varchar('nome', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    telefone: varchar('telefone', { length: 50 }),
    saldo_creditos: decimal('saldo_creditos', { precision: 10, scale: 2 }).default('0.00'),
    historico_viagens: integer('historico_viagens').default(0),
    tipo_cliente: varchar('tipo_cliente', { length: 20 }).default('PESSOA_FISICA'),
    documento_tipo: varchar('documento_tipo', { length: 20 }).default('CPF'),
    documento: varchar('documento', { length: 50 }),
    razao_social: varchar('razao_social', { length: 255 }),
    nome_fantasia: varchar('nome_fantasia', { length: 255 }),
    cnpj: varchar('cnpj', { length: 18 }),
    nacionalidade: varchar('nacionalidade', { length: 100 }),
    data_cadastro: timestamp('data_cadastro').defaultNow(),
    data_nascimento: date('data_nascimento'),
    endereco: varchar('endereco', { length: 255 }),
    cidade: varchar('cidade', { length: 100 }),
    estado: varchar('estado', { length: 2 }),
    pais: varchar('pais', { length: 100 }),
    segmento: varchar('segmento', { length: 20 }).default('NOVO'),
    tags: text('tags').array(),
    valor_total_gasto: decimal('valor_total_gasto', { precision: 10, scale: 2 }).default('0.00'),
    observacoes: text('observacoes'),
    organization_id: text('organization_id'),
    user_id: text('user_id'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const vehicle = pgTable('vehicle', {
    id: uuid('id').primaryKey().defaultRandom(),
    placa: text('placa').notNull().unique(),
    modelo: text('modelo').notNull(),
    tipo: text('tipo').notNull(), // 'ONIBUS' | 'CAMINHAO'
    status: text('status').notNull().default('ACTIVE'),
    ano: integer('ano').notNull(),
    km_atual: integer('km_atual').notNull().default(0),
    proxima_revisao_km: integer('proxima_revisao_km').notNull(),
    ultima_revisao: date('ultima_revisao'),
    is_double_deck: boolean('is_double_deck').default(false),
    capacidade_passageiros: integer('capacidade_passageiros'),
    mapa_configurado: boolean('mapa_configurado').default(false),
    capacidade_carga: decimal('capacidade_carga', { precision: 10, scale: 2 }),
    observacoes: text('observacoes'),
    motorista_atual: text('motorista_atual'),
    imagem: text('imagem'),
    galeria: jsonb('galeria'),
    organization_id: text('organization_id').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const vehicleFeature = pgTable('vehicle_feature', {
    id: uuid('id').primaryKey().defaultRandom(),
    vehicleId: uuid('vehicle_id').notNull().references(() => vehicle.id, { onDelete: 'cascade' }),
    category: text('category'),
    label: text('label').notNull(),
    value: text('value').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const seat = pgTable('seat', {
    id: uuid('id').primaryKey().defaultRandom(),
    vehicleId: uuid('vehicle_id').notNull().references(() => vehicle.id, { onDelete: 'cascade' }),
    numero: text('numero').notNull(),
    andar: integer('andar').notNull(), // 1 or 2
    posicao_x: integer('posicao_x').notNull(),
    posicao_y: integer('posicao_y').notNull(),
    tipo: text('tipo').notNull(),
    status: text('status').notNull().default('AVAILABLE'),
    preco: decimal('preco', { precision: 10, scale: 2 }),
    disabled: boolean('disabled').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const driver = pgTable('driver', {
    id: uuid('id').primaryKey().defaultRandom(),
    nome: text('nome').notNull(),
    cnh: text('cnh').notNull(),
    categoria_cnh: text('categoria_cnh').notNull(),
    validade_cnh: date('validade_cnh').notNull(),
    passaporte: text('passaporte'),
    validade_passaporte: date('validade_passaporte'),
    telefone: text('telefone'),
    email: text('email'),
    endereco: text('endereco'),
    cidade: text('cidade'),
    estado: text('estado'),
    pais: text('pais'),
    status: text('status').notNull().default('AVAILABLE'),
    data_contratacao: date('data_contratacao').notNull(),
    salario: decimal('salario', { precision: 10, scale: 2 }),
    anos_experiencia: integer('anos_experiencia'),
    viagens_internacionais: integer('viagens_internacionais').default(0),
    disponivel_internacional: boolean('disponivel_internacional').default(false),
    observacoes: text('observacoes'),
    organization_id: text('organization_id').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const routes = pgTable('routes', {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: text('organization_id').notNull(),
    name: text('name').notNull(),
    origin_city: text('origin_city').notNull(),
    origin_state: text('origin_state').notNull(),
    origin_neighborhood: text('origin_neighborhood'),
    destination_city: text('destination_city').notNull(),
    destination_state: text('destination_state').notNull(),
    destination_neighborhood: text('destination_neighborhood'),
    distance_km: decimal('distance_km', { precision: 10, scale: 2 }),
    duration_minutes: integer('duration_minutes'),
    stops: jsonb('stops').default([]),
    type: text('type').default('OUTBOUND'), // 'OUTBOUND' | 'INBOUND'
    active: boolean('active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const trips = pgTable('trips', {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: text('organization_id').notNull(),
    route_id: uuid('route_id').notNull().references(() => routes.id),
    return_route_id: uuid('return_route_id').references(() => routes.id),
    vehicle_id: uuid('vehicle_id').references(() => vehicle.id),
    driver_id: uuid('driver_id').references(() => driver.id),
    departure_date: date('departure_date').notNull(),
    departure_time: time('departure_time').notNull(),
    arrival_date: date('arrival_date'),
    arrival_time: time('arrival_time'),
    status: text('status').notNull().default('SCHEDULED'),
    price_conventional: decimal('price_conventional', { precision: 10, scale: 2 }),
    price_executive: decimal('price_executive', { precision: 10, scale: 2 }),
    price_semi_sleeper: decimal('price_semi_sleeper', { precision: 10, scale: 2 }),
    price_sleeper: decimal('price_sleeper', { precision: 10, scale: 2 }),
    price_bed: decimal('price_bed', { precision: 10, scale: 2 }),
    cover_image: text('cover_image'),
    gallery: jsonb('gallery').default([]),
    baggage_limit: text('baggage_limit'),
    alerts: text('alerts'),
    observations: text('observations'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const reservation = pgTable('reservation', {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: text('organization_id').notNull(),
    trip_id: uuid('trip_id').notNull().references(() => trips.id),
    client_id: uuid('client_id').references(() => clients.id),
    passenger_name: text('passenger_name').notNull(),
    passenger_document: text('passenger_document'),
    passenger_email: text('passenger_email'),
    passenger_phone: text('passenger_phone'),
    seat_number: text('seat_number').notNull(),
    boarding_point: text('boarding_point'),
    dropoff_point: text('dropoff_point'),
    status: text('status').notNull().default('PENDING'),
    payment_method: text('payment_method'), // Added based on legacy migration audit
    payment_status: text('payment_status').notNull().default('UNPAID'),
    total_price: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    amount_paid: decimal('amount_paid', { precision: 10, scale: 2 }).default('0.00'),
    ticket_code: text('ticket_code').unique(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});


export const transaction = pgTable('transaction', {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type').notNull(),
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').default('BRL'),
    date: date('date').notNull(),
    due_date: date('due_date'),
    payment_date: date('payment_date'),
    status: text('status').notNull(),
    payment_method: text('payment_method'),
    category: text('category'),
    cost_center: text('cost_center'),
    accounting_classification: text('accounting_classification'),
    document_number: text('document_number'),
    notes: text('notes'),
    organization_id: text('organization_id').notNull(),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const maintenance = pgTable('maintenance', {
    id: uuid('id').primaryKey().defaultRandom(),
    vehicleId: uuid('vehicle_id').notNull().references(() => vehicle.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'PREVENTIVA' | 'CORRETIVA'
    description: text('description').notNull(),
    scheduledDate: date('scheduled_date').notNull(),
    completionDate: date('completion_date'),
    status: text('status').notNull().default('SCHEDULED'),
    km_veiculo: integer('km_veiculo').notNull(),
    cost_parts: decimal('cost_parts', { precision: 10, scale: 2 }).default('0.00'),
    cost_labor: decimal('cost_labor', { precision: 10, scale: 2 }).default('0.00'),
    moeda: text('moeda').default('BRL'),
    organization_id: text('organization_id').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});


export const document = pgTable('document', {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: text('organization_id').notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'VEHICLE' | 'DRIVER' | 'ADMIN'
    entity_id: uuid('entity_id'), // Reference to vehicle or driver
    entity_name: text('entity_name'), // Cache name for easy listing
    issue_date: date('issue_date'),
    expiry_date: date('expiry_date'),
    status: text('status').notNull().default('VALID'),
    file_path: text('file_path'),
    file_size: text('file_size'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const charter = pgTable('charter', {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: text('organization_id').notNull(),
    client_id: uuid('client_id').notNull().references(() => clients.id),
    vehicle_id: uuid('vehicle_id').references(() => vehicle.id),
    driver_id: uuid('driver_id').references(() => driver.id),
    origin: text('origin').notNull(),
    destination: text('destination').notNull(),
    start_date: timestamp('start_date').notNull(),
    end_date: timestamp('end_date').notNull(),
    type: text('type').notNull().default('PONTUAL'), // 'PONTUAL' | 'RECORRENTE'
    route_id: uuid('route_id').references(() => routes.id),
    return_route_id: uuid('return_route_id').references(() => routes.id),
    status: text('status').notNull().default('REQUEST'),
    total_value: decimal('total_value', { precision: 10, scale: 2 }).notNull().default('0.00'),
    currency: text('currency').default('BRL'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const parcel = pgTable('parcel', {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: text('organization_id').notNull(),
    code: text('code').notNull().unique(),
    type: text('type').notNull(), // 'BUS_CARGO' | 'TRUCK_FREIGHT'
    status: text('status').notNull().default('AWAITING'),
    origin: text('origin').notNull(),
    destination: text('destination').notNull(),
    sender_name: text('sender_name').notNull(),
    recipient_name: text('recipient_name').notNull(),
    recipient_phone: text('recipient_phone'),
    weight_kg: decimal('weight_kg', { precision: 10, scale: 2 }),
    volume_m3: decimal('volume_m3', { precision: 10, scale: 2 }),
    declared_value: decimal('declared_value', { precision: 10, scale: 2 }),
    currency: text('currency').default('BRL'),
    delivery_estimate: timestamp('delivery_estimate'),
    trip_id: uuid('trip_id').references(() => trips.id),
    vehicle_id: uuid('vehicle_id').references(() => vehicle.id),
    history: jsonb('history').default([]),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});


export const state = pgTable('state', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    uf: text('uf').notNull().unique(),
});

export const city = pgTable('city', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    state_id: integer('state_id').notNull().references(() => state.id),
});

export const neighborhood = pgTable('neighborhood', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    city_id: integer('city_id').notNull().references(() => city.id),
});

export const client_interaction = pgTable('client_interaction', {
    id: uuid('id').primaryKey().defaultRandom(),
    client_id: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'EMAIL', 'PHONE', 'WHATSAPP', 'IN_PERSON', 'SYSTEM'
    description: text('description').notNull(),
    date_time: timestamp('date_time').defaultNow(),
    user_responsible: text('user_responsible'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const client_note = pgTable('client_note', {
    id: uuid('id').primaryKey().defaultRandom(),
    client_id: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    is_important: boolean('is_important').default(false),
    created_by: text('created_by'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});




// Relationships
export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    accounts: many(account),
}));

export const clientRelations = relations(clients, ({ many }) => ({
    reservations: many(reservation),
    interactions: many(client_interaction),
    notes: many(client_note),
}));

export const vehicleRelations = relations(vehicle, ({ many }) => ({
    features: many(vehicleFeature),
    seats: many(seat),
    trips: many(trips),
    maintenances: many(maintenance),
}));

export const driverRelations = relations(driver, ({ many }) => ({
    trips: many(trips),
}));

export const routeRelations = relations(routes, ({ many }) => ({
    trips: many(trips),
}));

export const tripRelations = relations(trips, ({ one, many }) => ({
    route: one(routes, {
        fields: [trips.route_id],
        references: [routes.id],
    }),
    vehicle: one(vehicle, {
        fields: [trips.vehicle_id],
        references: [vehicle.id],
    }),
    driver: one(driver, {
        fields: [trips.driver_id],
        references: [driver.id],
    }),
    reservations: many(reservation),
}));

export const reservationRelations = relations(reservation, ({ one }) => ({
    trip: one(trips, {
        fields: [reservation.trip_id],
        references: [trips.id],
    }),
    client: one(clients, {
        fields: [reservation.client_id],
        references: [clients.id],
    }),
}));

export const cityRelations = relations(city, ({ one, many }) => ({
    state: one(state, {
        fields: [city.state_id],
        references: [state.id],
    }),
    neighborhoods: many(neighborhood),
}));

export const neighborhoodRelations = relations(neighborhood, ({ one }) => ({
    city: one(city, {
        fields: [neighborhood.city_id],
        references: [city.id],
    }),
}));

export const interactionRelations = relations(client_interaction, ({ one }) => ({
    client: one(clients, {
        fields: [client_interaction.client_id],
        references: [clients.id],
    }),
}));

export const noteRelations = relations(client_note, ({ one }) => ({
    client: one(clients, {
        fields: [client_note.client_id],
        references: [clients.id],
    }),
}));

export const charterRelations = relations(charter, ({ one }) => ({
    client: one(clients, {
        fields: [charter.client_id],
        references: [clients.id],
    }),
    vehicle: one(vehicle, {
        fields: [charter.vehicle_id],
        references: [vehicle.id],
    }),
    driver: one(driver, {
        fields: [charter.driver_id],
        references: [driver.id],
    }),
    route: one(routes, {
        fields: [charter.route_id],
        references: [routes.id],
    }),
    return_route: one(routes, {
        fields: [charter.return_route_id],
        references: [routes.id],
    }),
}));

export const parcelRelations = relations(parcel, ({ one }) => ({
    trip: one(trips, {
        fields: [parcel.trip_id],
        references: [trips.id],
    }),
    vehicle: one(vehicle, {
        fields: [parcel.vehicle_id],
        references: [vehicle.id],
    }),
}));

// System Parameters (Organization-level settings)
export const organization_parameter = pgTable('system_parameters', {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: text('organization_id').notNull(),
    key: text('key').notNull(),
    value: text('value'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});


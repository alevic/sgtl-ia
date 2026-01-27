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


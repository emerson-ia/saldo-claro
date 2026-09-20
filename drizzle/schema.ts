import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Billing is deliberately provider-neutral. The product can stay on the free
 * plan without any payment credentials configured; a checkout provider only
 * writes its customer/subscription identifiers here when Pro is activated.
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  /** Supabase Auth UUID. Kept independent of the legacy server-auth users table. */
  authUserId: varchar("authUserId", { length: 64 }).notNull(),
  plan: mysqlEnum("plan", ["free", "pro"]).notNull().default("free"),
  status: mysqlEnum("status", ["active", "trialing", "past_due", "canceled", "paused"]).notNull().default("active"),
  provider: varchar("provider", { length: 32 }),
  providerCustomerId: varchar("providerCustomerId", { length: 191 }),
  providerSubscriptionId: varchar("providerSubscriptionId", { length: 191 }),
  currentPeriodEndsAt: timestamp("currentPeriodEndsAt"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("subscriptions_auth_user_idx").on(table.authUserId),
  index("subscriptions_provider_customer_idx").on(table.providerCustomerId),
  index("subscriptions_provider_subscription_idx").on(table.providerSubscriptionId),
]);

/** Keep webhooks idempotent when a payment provider retries an event. */
export const billingWebhookEvents = mysqlTable("billing_webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerEventId: varchar("providerEventId", { length: 191 }).notNull().unique(),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  payload: text("payload").notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

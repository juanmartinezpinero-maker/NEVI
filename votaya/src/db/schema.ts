import {
  bigserial,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  ageRange: text("age_range"),
  gender: text("gender"),
  country: text("country"),
  profileCompleted: boolean("profile_completed").notNull().default(false),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
  marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
  refCode: text("ref_code"),
  createdAt: createdAt(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
});

export const loginCodes = pgTable(
  "login_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("login_codes_email_idx").on(t.email, t.createdAt)],
);

export const sessions = pgTable(
  "sessions",
  {
    // sha256 del token de la cookie: nunca guardamos el token en claro.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const sponsors = pgTable("sponsors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  status: text("status", { enum: ["lead", "active", "paused"] }).notNull().default("lead"),
  createdAt: createdAt(),
});

// Personas con acceso al panel de una marca (/marca). Las da de alta un administrador.
export const sponsorMembers = pgTable(
  "sponsor_members",
  {
    sponsorId: uuid("sponsor_id")
      .notNull()
      .references(() => sponsors.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "member"] }).notNull().default("member"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("sponsor_members_uq").on(t.sponsorId, t.userId), index("sponsor_members_user_idx").on(t.userId)],
);

// Preparado para la fase de monetización: no hay pagos reales en el MVP.
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  sponsorId: uuid("sponsor_id")
    .notNull()
    .references(() => sponsors.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind", { enum: ["sponsored_poll", "creator", "ads", "paid_panel"] }).notNull(),
  budgetCents: integer("budget_cents").notNull().default(0),
  targeting: jsonb("targeting").$type<{ countries?: string[]; ageRanges?: string[]; genders?: string[] }>(),
  status: text("status", { enum: ["draft", "active", "finished"] }).notNull().default("draft"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const polls = pgTable(
  "polls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    normalizedTitle: text("normalized_title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    emoji: text("emoji"),
    imageUrl: text("image_url"),
    allowOther: boolean("allow_other").notNull().default(false),
    status: text("status", { enum: ["pending", "published", "rejected", "archived"] })
      .notNull()
      .default("pending"),
    // popular = votación abierta (no representativa); study = estudio con muestra ponderada.
    kind: text("kind", { enum: ["popular", "study"] }).notNull().default("popular"),
    // public = aparece en la web; private = solo accesible por enlace (tests de producto de marcas).
    visibility: text("visibility", { enum: ["public", "private"] }).notNull().default("public"),
    isDemo: boolean("is_demo").notNull().default(false),
    featuredOn: date("featured_on"),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    sponsorId: uuid("sponsor_id").references(() => sponsors.id, { onDelete: "set null" }),
    campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    voteCount: integer("vote_count").notNull().default(0),
    moderationNote: text("moderation_note"),
    createdAt: createdAt(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [
    index("polls_status_idx").on(t.status, t.publishedAt),
    index("polls_category_idx").on(t.category, t.status),
    index("polls_votes_idx").on(t.voteCount),
  ],
);

export const pollOptions = pgTable(
  "poll_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    normalizedLabel: text("normalized_label").notNull(),
    emoji: text("emoji"),
    imageUrl: text("image_url"),
    position: integer("position").notNull().default(0),
    fromWriteIn: boolean("from_write_in").notNull().default(false),
  },
  (t) => [index("poll_options_poll_idx").on(t.pollId)],
);

// Respuestas libres de la casilla «Otra», agrupadas por forma normalizada.
export const writeIns = pgTable(
  "write_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    normalized: text("normalized").notNull(),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("write_ins_poll_norm_uq").on(t.pollId, t.normalized)],
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    optionId: uuid("option_id").references(() => pollOptions.id, { onDelete: "cascade" }),
    writeInId: uuid("write_in_id").references(() => writeIns.id, { onDelete: "cascade" }),
    // "u:<userId>" o "a:<anonId>": garantiza un voto por persona y encuesta.
    voterKey: text("voter_key").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    anonId: text("anon_id"),
    ipHash: text("ip_hash"),
    verified: boolean("verified").notNull().default(false),
    country: text("country"),
    ageRange: text("age_range"),
    gender: text("gender"),
    refCode: text("ref_code"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("votes_poll_voter_uq").on(t.pollId, t.voterKey),
    index("votes_poll_idx").on(t.pollId, t.optionId),
    index("votes_created_idx").on(t.createdAt),
    index("votes_user_idx").on(t.userId),
    index("votes_anon_idx").on(t.anonId),
  ],
);

export const shareLinks = pgTable("share_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  pollId: uuid("poll_id").references(() => polls.id, { onDelete: "set null" }),
  ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

export const events = pgTable(
  "events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    type: text("type").notNull(),
    pollId: uuid("poll_id"),
    userId: uuid("user_id"),
    anonId: text("anon_id"),
    refCode: text("ref_code"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [
    index("events_type_created_idx").on(t.type, t.createdAt),
    index("events_ref_idx").on(t.refCode),
  ],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export const businessLeads = pgTable("business_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: text("company").notNull(),
  email: text("email").notNull(),
  message: text("message"),
  createdAt: createdAt(),
});

export type Poll = typeof polls.$inferSelect;
export type PollOption = typeof pollOptions.$inferSelect;
export type User = typeof users.$inferSelect;

// Programa de puntos: cada movimiento queda registrado (saldo = suma de amount).
export const pointsLedger = pgTable(
  "points_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: text("reason", { enum: ["vote", "poll_approved", "welcome", "redeem", "refund", "adjust"] }).notNull(),
    pollId: uuid("poll_id"),
    redemptionId: uuid("redemption_id"),
    createdAt: createdAt(),
  },
  (t) => [
    index("points_user_idx").on(t.userId, t.createdAt),
    // Como máximo una vez los puntos de voto por encuesta y usuario.
    uniqueIndex("points_vote_uq").on(t.userId, t.pollId, t.reason),
  ],
);

// Premios que financian las marcas patrocinadoras. is_demo = premio ficticio sin valor real.
export const rewards = pgTable("rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  sponsorId: uuid("sponsor_id").references(() => sponsors.id, { onDelete: "set null" }),
  pollId: uuid("poll_id").references(() => polls.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  costPoints: integer("cost_points").notNull(),
  stock: integer("stock").notNull().default(0),
  active: boolean("active").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(true),
  createdAt: createdAt(),
});

export const redemptions = pgTable(
  "redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rewardId: uuid("reward_id")
      .notNull()
      .references(() => rewards.id, { onDelete: "cascade" }),
    points: integer("points").notNull(),
    code: text("code").notNull().unique(),
    status: text("status", { enum: ["pending", "delivered", "cancelled"] }).notNull().default("pending"),
    createdAt: createdAt(),
  },
  (t) => [index("redemptions_user_idx").on(t.userId)],
);

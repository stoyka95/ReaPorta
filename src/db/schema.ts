import { sql, type SQL } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// Enums
export const userRoleEnum = pgEnum("user_role", ["user", "agent", "admin"]);

export const locationTypeEnum = pgEnum("location_type", ["kraj", "okres", "obec", "cast"]);

export const listingStatusEnum = pgEnum("listing_status", [
  "draft",
  "pending",
  "active",
  "paused",
  "sold",
  "rejected",
  "expired",
]);

export const offerTypeEnum = pgEnum("offer_type", ["sale", "rent"]);

export const listingCategoryEnum = pgEnum("listing_category", [
  "flat",
  "house",
  "land",
  "commercial",
  "other",
]);

export const priceUnitEnum = pgEnum("price_unit", ["total", "per_month", "per_m2_month"]);

export const dispositionEnum = pgEnum("disposition", [
  "1+kk",
  "1+1",
  "2+kk",
  "2+1",
  "3+kk",
  "3+1",
  "4+kk",
  "4+1",
  "5+kk",
  "5+1",
  "6_and_more",
  "atypical",
]);

export const buildingTypeEnum = pgEnum("building_type", [
  "brick",
  "panel",
  "wood",
  "stone",
  "skeleton",
  "mixed",
  "other",
]);

export const listingConditionEnum = pgEnum("listing_condition", [
  "new_build",
  "very_good",
  "good",
  "after_renovation",
  "before_renovation",
  "under_construction",
  "project",
  "demolition",
]);

export const ownershipEnum = pgEnum("ownership", ["personal", "cooperative", "state", "other"]);

export const energyClassEnum = pgEnum("energy_class", ["A", "B", "C", "D", "E", "F", "G"]);

export const furnishedEnum = pgEnum("furnished", ["yes", "partly", "no"]);

export const savedSearchFrequencyEnum = pgEnum("saved_search_frequency", [
  "instant",
  "daily",
  "weekly",
  "off",
]);

export const inquiryStatusEnum = pgEnum("inquiry_status", ["new", "read", "replied", "archived"]);

export const reportReasonEnum = pgEnum("report_reason", [
  "fraud",
  "duplicate",
  "wrong_info",
  "sold",
  "other",
]);

export const reportStatusEnum = pgEnum("report_status", ["open", "resolved", "dismissed"]);

export const emailStatusEnum = pgEnum("email_status", ["queued", "sent", "failed"]);

// Tables
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: citext("email").notNull().unique(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    name: text("name").notNull(),
    phone: text("phone"),
    avatarKey: text("avatar_key"),
    role: userRoleEnum("role").notNull().default("user"),
    blockedAt: timestamp("blocked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("users_role_idx").on(table.role)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    password: text("password"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("accounts_user_id_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const agencies = pgTable("agencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoKey: text("logo_key"),
  description: text("description"),
  website: text("website"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentProfiles = pgTable(
  "agent_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "set null" }),
    displayName: text("display_name").notNull(),
    slug: text("slug").notNull().unique(),
    bio: text("bio"),
    photoKey: text("photo_key"),
    phonePublic: text("phone_public"),
    emailPublic: text("email_public"),
    languages: text("languages")
      .array()
      .notNull()
      .default(sql`ARRAY['cs']::text[]`),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
  },
  (table) => [index("agent_profiles_agency_id_idx").on(table.agencyId)],
);

export const locations = pgTable(
  "locations",
  {
    id: serial("id").primaryKey(),
    parentId: integer("parent_id").references((): AnyPgColumn => locations.id, {
      onDelete: "set null",
    }),
    type: locationTypeEnum("type").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    fullSlug: text("full_slug").notNull().unique(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    population: integer("population").notNull().default(0),
    listingCountCache: integer("listing_count_cache").notNull().default(0),
  },
  (table) => [
    index("locations_parent_id_idx").on(table.parentId),
    index("locations_type_idx").on(table.type),
  ],
);

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "set null" }),
    status: listingStatusEnum("status").notNull().default("draft"),
    rejectReason: text("reject_reason"),
    offerType: offerTypeEnum("offer_type").notNull(),
    category: listingCategoryEnum("category").notNull(),
    subtype: text("subtype"),
    title: text("title").notNull(),
    description: text("description").notNull(),
    price: numeric("price", { precision: 12, scale: 0 }),
    priceUnit: priceUnitEnum("price_unit").notNull().default("total"),
    priceNegotiable: boolean("price_negotiable").notNull().default(false),
    priceOnRequest: boolean("price_on_request").notNull().default(false),
    feesMonthly: numeric("fees_monthly", { precision: 10, scale: 0 }),
    deposit: numeric("deposit", { precision: 12, scale: 0 }),
    street: text("street"),
    houseNumber: text("house_number"),
    zip: text("zip"),
    locationId: integer("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    city: text("city").notNull(),
    district: text("district"),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    showExactLocation: boolean("show_exact_location").notNull().default(false),
    usableArea: numeric("usable_area", { precision: 8, scale: 1 }),
    landArea: numeric("land_area", { precision: 10, scale: 1 }),
    builtArea: numeric("built_area", { precision: 8, scale: 1 }),
    floor: integer("floor"),
    floorsTotal: integer("floors_total"),
    yearBuilt: integer("year_built"),
    lastRenovation: integer("last_renovation"),
    disposition: dispositionEnum("disposition"),
    buildingType: buildingTypeEnum("building_type"),
    condition: listingConditionEnum("condition"),
    ownership: ownershipEnum("ownership"),
    energyClass: energyClassEnum("energy_class"),
    furnished: furnishedEnum("furnished"),
    amenities: text("amenities")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    availableFrom: date("available_from"),
    pricePerM2: numeric("price_per_m2", { precision: 12, scale: 0 }).generatedAlwaysAs(
      (): SQL =>
        sql`CASE WHEN offer_type = 'sale' AND price IS NOT NULL AND usable_area IS NOT NULL AND usable_area > 0 THEN ROUND(price / usable_area) ELSE NULL END`,
    ),
    viewsCount: integer("views_count").notNull().default(0),
    favoritesCount: integer("favorites_count").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    searchText: tsvector("search_text"),
  },
  (table) => [
    index("listings_status_offer_cat_pub_idx").on(
      table.status,
      table.offerType,
      table.category,
      table.publishedAt,
    ),
    index("listings_price_idx").on(table.price),
    index("listings_price_per_m2_idx").on(table.pricePerM2),
    index("listings_usable_area_idx").on(table.usableArea),
    index("listings_location_id_idx").on(table.locationId),
    index("listings_lat_lng_idx").on(table.lat, table.lng),
    index("listings_agent_id_idx").on(table.agentId),
    index("listings_agency_id_idx").on(table.agencyId),
    index("listings_amenities_gin_idx").using("gin", table.amenities),
    index("listings_search_text_gin_idx").using("gin", table.searchText),
  ],
);

export const listingImages = pgTable(
  "listing_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    blurDataUrl: text("blur_data_url").notNull(),
    alt: text("alt").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isCover: boolean("is_cover").notNull().default(false),
  },
  (table) => [index("listing_images_listing_id_idx").on(table.listingId, table.sortOrder)],
);

export const listingPriceHistory = pgTable(
  "listing_price_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    price: numeric("price", { precision: 12, scale: 0 }).notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("listing_price_history_listing_id_idx").on(table.listingId, table.changedAt)],
);

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.listingId] }),
    index("favorites_listing_id_idx").on(table.listingId),
  ],
);

export const savedSearches = pgTable(
  "saved_searches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    params: jsonb("params").notNull().$type<Record<string, unknown>>(),
    frequency: savedSearchFrequencyEnum("frequency").notNull().default("daily"),
    lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("saved_searches_user_id_idx").on(table.userId)],
);

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    message: text("message").notNull(),
    status: inquiryStatusEnum("status").notNull().default("new"),
    ipHash: text("ip_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("inquiries_listing_id_idx").on(table.listingId),
    index("inquiries_agent_id_idx").on(table.agentId, table.status),
    index("inquiries_user_id_idx").on(table.userId),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    reporterUserId: uuid("reporter_user_id").references(() => users.id, { onDelete: "set null" }),
    reason: reportReasonEnum("reason").notNull(),
    details: text("details"),
    status: reportStatusEnum("status").notNull().default("open"),
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("reports_listing_id_idx").on(table.listingId),
    index("reports_status_idx").on(table.status),
  ],
);

export const listingDailyStats = pgTable(
  "listing_daily_stats",
  {
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    views: integer("views").notNull().default(0),
    phoneReveals: integer("phone_reveals").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.listingId, table.day] })],
);

export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    toEmail: text("to_email").notNull(),
    subject: text("subject").notNull(),
    html: text("html").notNull(),
    text: text("text").notNull(),
    status: emailStatusEnum("status").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (table) => [index("email_outbox_status_idx").on(table.status, table.createdAt)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_actor_id_idx").on(table.actorId),
    index("audit_log_entity_idx").on(table.entity, table.entityId),
  ],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

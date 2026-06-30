import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

// A reusable, per-user invite link. Rotating creates a new row and marks the
// previous one revoked. Opening an active token and signing in forms a friendship.
export const invites = pgTable(
  "invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    revokedAt: timestamp("revoked_at"),
  },
  (table) => [index("invites_inviter_id_idx").on(table.inviterId)],
);

// Symmetric friendship stored as a single canonical row (userAId < userBId)
// so each pair is unique regardless of who invited whom.
export const friendships = pgTable(
  "friendships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userAId: text("user_a_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userBId: text("user_b_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("friendships_pair_unique").on(table.userAId, table.userBId),
    index("friendships_user_a_idx").on(table.userAId),
    index("friendships_user_b_idx").on(table.userBId),
  ],
);

// A letter is a draft while `sealedAt` is null. Drafts may not yet have a
// recipient or content, so those are nullable; both are required to send.
export const letters = pgTable(
  "letters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id),
    recipientId: text("recipient_id").references(() => user.id),
    content: jsonb("content"),
    excerpt: text("excerpt"),
    paper: text("paper").notNull().default("cream"),
    ink: text("ink").notNull().default("sepia"),
    font: text("font").notNull().default("serif"),
    sealedAt: timestamp("sealed_at"),
    openedAt: timestamp("opened_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("letters_recipient_id_idx").on(table.recipientId),
    index("letters_sender_id_idx").on(table.senderId),
  ],
);

import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const letters = pgTable(
  "letters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => user.id),
    content: text("content").notNull(),
    theme: text("theme").notNull().default("default"),
    sealedAt: timestamp("sealed_at").notNull().defaultNow(),
    openedAt: timestamp("opened_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("letters_recipient_id_idx").on(table.recipientId),
    index("letters_sender_id_idx").on(table.senderId),
  ],
);

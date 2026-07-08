export type Person = {
  id: string;
  name: string | null;
  email: string;
  unreadCount: number;
  latestArrivedAt: string | Date | null;
  latestUnreadLetterId: string | null;
  lastActivityAt: string | Date | null;
  lastDir: "in" | "out" | null;
  lastOutOpened: boolean;
  draft: { id: string; excerpt: string | null; updatedAt: string | Date } | null;
};

export type Draft = {
  id: string;
  recipientId: string | null;
  excerpt: string | null;
  updatedAt: string | Date;
};

import { requireSession } from "@/server/dal";
import { LetterFeed } from "./_components/letter-feed";

export default async function MailboxPage() {
  await requireSession();

  return <LetterFeed />;
}

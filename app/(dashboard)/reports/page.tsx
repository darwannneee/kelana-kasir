import { requireOwnerPage } from "@/lib/auth/guards";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  await requireOwnerPage();

  return <ReportsClient />;
}

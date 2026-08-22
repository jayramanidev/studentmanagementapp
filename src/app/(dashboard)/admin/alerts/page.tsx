import { requireAuth } from "@/lib/auth-utils";
import { getAlertLogsAction } from "@/actions/alerts";
import { getBatchesAction } from "@/actions/batches";
import { AdminAlertsClient } from "./admin-alerts-client";

export default async function AdminAlertsPage() {
  await requireAuth(["ADMIN", "COORDINATOR"]);

  const [logsRes, batchesRes] = await Promise.all([
    getAlertLogsAction(),
    getBatchesAction(),
  ]);

  const logs = logsRes.success ? logsRes.data : [];
  const batches = batchesRes.success ? batchesRes.data : [];

  return <AdminAlertsClient logs={logs} batches={batches} />;
}

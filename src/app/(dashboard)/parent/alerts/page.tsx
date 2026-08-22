import { requireAuth } from "@/lib/auth-utils";
import { getAlertLogsAction } from "@/actions/alerts";
import { AlertLogTable } from "@/components/alerts/alert-log-table";
import { MessageSquare } from "lucide-react";

export default async function ParentAlertsPage() {
  await requireAuth(["PARENT", "ADMIN", "COORDINATOR"]);

  const res = await getAlertLogsAction();
  const logs = res.success ? res.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <MessageSquare className="h-6 w-6" />
          </div>
          Parent SMS & WhatsApp Notification History
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review all exam score cards, attendance alerts, and official academy broadcasts delivered to your phone.
        </p>
      </div>

      <AlertLogTable logs={logs} />
    </div>
  );
}

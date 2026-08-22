import { requireAuth } from "@/lib/auth-utils";
import { getNoticesAction } from "@/actions/notices";
import { NoticeFeed } from "@/components/notices/notice-feed";
import { Megaphone } from "lucide-react";

export default async function StudentNoticesPage() {
  await requireAuth(["STUDENT", "ADMIN", "COORDINATOR", "TEACHER"]);

  const res = await getNoticesAction();
  const notices = res.success ? res.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Megaphone className="h-6 w-6" />
          </div>
          Academy Notice Board & Alerts
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Official academy circulars, physical ground training schedules, and mock exam announcements.
        </p>
      </div>

      <NoticeFeed notices={notices} canDelete={false} />
    </div>
  );
}

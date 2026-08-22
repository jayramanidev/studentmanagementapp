import { requireAuth } from "@/lib/auth-utils";
import { getNoticesAction } from "@/actions/notices";
import { getBatchesAction } from "@/actions/batches";
import { AdminNoticesClient } from "./admin-notices-client";

export default async function AdminNoticesPage() {
  await requireAuth(["ADMIN", "COORDINATOR"]);

  const [noticesRes, batchesRes] = await Promise.all([
    getNoticesAction(),
    getBatchesAction(),
  ]);

  const notices = noticesRes.success ? noticesRes.data : [];
  const batches = batchesRes.success ? batchesRes.data : [];

  return (
    <AdminNoticesClient
      initialNotices={notices}
      batches={batches}
    />
  );
}

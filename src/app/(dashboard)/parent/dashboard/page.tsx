import { requireAuth } from "@/lib/auth-utils";
import { getParentDashboardAction } from "@/actions/performance";
import { ParentClient } from "../parent-client";

export default async function ParentDashboardSubPage() {
  await requireAuth(["PARENT", "ADMIN", "COORDINATOR"]);

  const res = await getParentDashboardAction();
  const childrenData = res.success && res.data ? res.data : [];

  return <ParentClient childrenData={childrenData} />;
}

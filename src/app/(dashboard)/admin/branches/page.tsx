import { requireAuth } from "@/lib/auth-utils";
import { getBranchListAction } from "@/actions/branches";
import { AdminBranchesClient } from "./admin-branches-client";

export default async function AdminBranchesPage() {
  await requireAuth(["ADMIN"]);

  const res = await getBranchListAction();
  const branches = res.success && res.data ? res.data : [];

  return <AdminBranchesClient branches={branches} />;
}

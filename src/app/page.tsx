/**
 * InstituteOps — Root Page
 * Redirects to /login on first visit.
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { ROLE_DASHBOARD_MAP } from "@/types/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(ROLE_DASHBOARD_MAP[user.role]);
  }

  redirect("/login");
}

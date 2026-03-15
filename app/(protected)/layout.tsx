import { redirect } from "next/navigation";
import { getServerSession, serverLogout } from "@/src/services/auth.server";
import AdminLayout from "@/src/layout/AdminLayout";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      redirect("/login");
    }
    // Only global super admins can access this dashboard
    if (session.user.isGlobalSuperAdmin !== true) {
      await serverLogout();
      redirect("/login");
    }
  } catch {
    redirect("/login");
  }

  return <AdminLayout>{children}</AdminLayout>;
}

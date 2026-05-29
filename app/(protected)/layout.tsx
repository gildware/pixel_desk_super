import { redirect } from "next/navigation";
import { getServerSession } from "@/src/services/auth.server";
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
    if (session.user.isGlobalSuperAdmin !== true) {
      redirect("/login");
    }
  } catch {
    redirect("/login");
  }

  return <AdminLayout>{children}</AdminLayout>;
}

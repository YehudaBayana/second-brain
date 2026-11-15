import { ResizableAppShell } from "@/src/components/appShell/AppShell";
import { getSession } from "@/src/services/auth";
import { redirect } from "next/navigation";
// Import your auth verification helper (e.g., from Supabase, NextAuth, Firebase, etc.)

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Double check authentication on the server
  if (!session?.user) {
    redirect("/auth");
  }

  return <ResizableAppShell>{children}</ResizableAppShell>;
}

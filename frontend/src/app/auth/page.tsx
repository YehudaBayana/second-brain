import AuthView from "@/src/features/auth/views/AuthView";
import { getSession } from "@/src/services/auth";
import { redirect } from "next/navigation";

export default async function AuthPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/");
  }

  return <AuthView />;
}

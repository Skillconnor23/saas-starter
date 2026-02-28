import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

const ADMIN_USER_IDS = [3];

export default async function AdminClassPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!ADMIN_USER_IDS.includes(session.user.id)) {
    redirect("/class-hub");
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Admin – Class Control</h1>
      <p>You are authorized as admin.</p>
    </main>
  );
}
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function ClassHubPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Class Hub</h1>
      <p>Logged in. User id: {session.user.id}</p>
    </main>
  );
}
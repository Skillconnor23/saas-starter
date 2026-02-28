import Link from "next/link";

export default function TrialPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28 }}>Book a Trial</h1>
      <p>This is where scheduling will go.</p>

      <Link href="/trial-confirmed">
        <button style={{ marginTop: 16 }}>Confirm Trial</button>
      </Link>
    </main>
  );
}
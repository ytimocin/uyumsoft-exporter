import { getSession, toSessionUser } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import Landing from "@/components/Landing";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    return <Landing />;
  }

  return <Dashboard user={toSessionUser(session)} />;
}

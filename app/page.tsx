import { getSessionUser } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import Landing from "@/components/Landing";

export default async function Home() {
  const user = await getSessionUser();

  if (!user) {
    return <Landing />;
  }

  return <Dashboard user={user} />;
}

import { getSession, toSessionUser } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import Landing from "@/components/Landing";

type SearchParams = {
  auth?: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await getSession();

  if (!session) {
    return <Landing />;
  }

  return (
    <Dashboard
      user={toSessionUser(session)}
      authStatus={
        typeof searchParams?.auth === "string" ? searchParams?.auth : undefined
      }
    />
  );
}

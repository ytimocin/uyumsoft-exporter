export default function LoginButton() {
  return (
    <a
      href="/api/auth/google"
      className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
    >
      <span>Sign in with Google</span>
    </a>
  );
}

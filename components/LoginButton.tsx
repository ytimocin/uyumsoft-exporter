const GoogleIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="#EA4335"
      d="M12 10.2v3.6h5.09c-.22 1.16-.89 2.14-1.9 2.8l3.07 2.38c1.79-1.65 2.82-4.08 2.82-6.98 0-.67-.06-1.32-.18-1.95H12z"
    />
    <path
      fill="#4285F4"
      d="M6.54 14.14l-.86.65-2.45 1.88C4.84 19.9 8.17 22 12 22c2.43 0 4.47-.8 5.96-2.16l-3.07-2.38c-.82.55-1.86.88-2.89.88-2.23 0-4.12-1.5-4.81-3.51z"
    />
    <path
      fill="#FBBC05"
      d="M3.23 7.96C2.44 9.58 2 11.34 2 13.2c0 1.86.44 3.62 1.23 5.24l3.31-2.56a6.99 6.99 0 0 1 0-5.36z"
    />
    <path
      fill="#34A853"
      d="M12 5.5c1.32 0 2.5.45 3.42 1.34l2.57-2.57C16.46 2.54 14.43 1.8 12 1.8 8.17 1.8 4.84 3.9 3.32 7.0l3.31 2.56C7.89 7.0 9.78 5.5 12 5.5z"
    />
    <path fill="none" d="M2 2h20v20H2z" />
  </svg>
);

export default function LoginButton() {
  return (
    <a
      href="/api/auth/google"
      className="inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-surface-base shadow-lg shadow-brand-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      <GoogleIcon />
      <span>Sign in with Google</span>
    </a>
  );
}

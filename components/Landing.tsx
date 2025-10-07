import LoginButton from "@/components/LoginButton";

export default function Landing() {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 shadow-lg">
      <h1 className="text-3xl font-semibold text-emerald-400">
        Uyumsoft → Google Sheets
      </h1>
      <p className="mt-4 text-sm text-slate-300">
        Upload the latest Uyumsoft CSV export, choose the columns you care
        about, and push the data into your own Google Sheet with a single click.
        Sign in to connect your Google account and get started.
      </p>
      <div className="mt-6">
        <LoginButton />
      </div>
    </section>
  );
}

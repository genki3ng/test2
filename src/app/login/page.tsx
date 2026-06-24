export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;
  return (
    <div className="login-wrap">
      <form className="login-card" method="POST" action="/api/login">
        <div className="login-logo">🧭</div>
        <h1>Jobhunt 2026</h1>
        <p className="muted">这是私人求职指挥台，请输入访问口令。</p>
        {err && <p className="login-err">口令不对，再试一次。</p>}
        <input
          type="password"
          name="password"
          placeholder="访问口令"
          autoFocus
          required
        />
        <button type="submit">进入</button>
      </form>
    </div>
  );
}

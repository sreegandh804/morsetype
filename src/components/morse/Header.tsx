import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="w-full px-8 py-5 flex items-center justify-between border-b border-(--color-hairline)">
      <Link to="/" className="flex items-center gap-2.5 group">
        <span className="text-(--color-main) text-lg tracking-wider leading-none">··· −−− ···</span>
        <span className="font-mono text-lg font-bold tracking-tight leading-none">
          <span className="text-(--color-text)">morse</span>
          <span className="text-(--color-main)">type</span>
        </span>
      </Link>
      <nav className="flex items-center gap-6 text-[13px] lowercase">
        <NavLink to="/">practice</NavLink>
        <NavLink to="/about">learn</NavLink>
        <NavLink to="/leaderboard">leaderboard</NavLink>
      </nav>
    </header>
  );
}

function NavLink({ to, children }: { to: "/" | "/leaderboard" | "/about"; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      activeProps={{ className: "text-(--color-main) font-medium" }}
      className="text-(--color-sub) hover:text-(--color-sub-strong) transition-colors"
    >
      {children}
    </Link>
  );
}

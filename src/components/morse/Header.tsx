import { Link } from "@tanstack/react-router";
import { Radio } from "lucide-react";

export function Header() {
  return (
    <header className="w-full max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group">
        <Radio className="size-6 text-(--color-main) group-hover:rotate-12 transition-transform" />
        <span className="font-mono text-xl font-bold">
          <span className="text-(--color-text)">morse</span>
          <span className="text-(--color-main)">type</span>
        </span>
      </Link>
      <nav className="flex items-center gap-1 text-sm">
        <NavLink to="/">test</NavLink>
        <NavLink to="/leaderboard">leaderboard</NavLink>
        <NavLink to="/about">about</NavLink>
      </nav>
    </header>
  );
}

function NavLink({ to, children }: { to: "/" | "/leaderboard" | "/about"; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      activeProps={{ className: "pill text-(--color-main)" }}
      className="pill"
    >
      {children}
    </Link>
  );
}

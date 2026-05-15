import { Link } from "@tanstack/react-router";
import { Github, Radio, Send } from "lucide-react";

export function Header() {
  return (
    <header className="w-full px-8 py-5 flex items-center justify-between border-b border-(--color-hairline)">
      <div className="flex items-center gap-5">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="text-(--color-main) text-lg tracking-wider leading-none font-mono">
            ··· −−− ···
          </span>
          <span className="font-display text-lg font-bold tracking-tight leading-none">
            <span className="text-(--color-text)">morse</span>
            <span className="text-(--color-main)">type</span>
          </span>
        </Link>
        <SendReceiveToggle />
      </div>
      <nav className="flex items-center gap-6 text-[13px] lowercase">
        <NavLink to="/">practice</NavLink>
        <NavLink to="/learn-key">learn the key</NavLink>
        <NavLink to="/about">chart</NavLink>
        <a
          href="https://github.com/sreegandh804/morsetype"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="source on github"
          title="source on github"
          className="text-(--color-sub) hover:text-(--color-sub-strong) transition-colors flex items-center"
        >
          <Github className="size-4" />
        </a>
      </nav>
    </header>
  );
}

function NavLink({
  to,
  children,
}: {
  to: "/" | "/about" | "/receive" | "/learn-key";
  children: React.ReactNode;
}) {
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

function SendReceiveToggle() {
  return (
    <div className="send-receive-toggle" role="tablist" aria-label="practice direction">
      <Link
        to="/"
        activeOptions={{ exact: true }}
        activeProps={{ "data-active": "true" } as never}
        className="sr-pill"
        title="send — key Morse from text"
      >
        <Send className="size-3" />
        <span>send</span>
      </Link>
      <Link
        to="/receive"
        activeOptions={{ exact: true }}
        activeProps={{ "data-active": "true" } as never}
        className="sr-pill"
        title="receive — type what you hear"
      >
        <Radio className="size-3" />
        <span>receive</span>
      </Link>
    </div>
  );
}

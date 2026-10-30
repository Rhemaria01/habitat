import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { SideNav, TabBar, ThemeToggle } from "@/components/Nav";

type AppShellProps = {
  children: React.ReactNode;
  wide?: boolean;
};

export function AppShell({ children, wide = false }: AppShellProps) {
  return (
    <div className="shell">
      <div className="shell-bg" aria-hidden />
      <div className="shell-grain" aria-hidden />

      <aside className="shell-side">
        <Link href="/" className="side-brand">
          Habitat
        </Link>
        <p className="side-tagline">Simple habit tracking</p>
        <SideNav />
        <div className="side-foot">
          <ThemeToggle />
          <form action={logoutAction}>
            <button type="submit" className="ghost-btn">
              Lock
            </button>
          </form>
        </div>
      </aside>

      <main className={`shell-main ${wide ? "wide" : ""}`}>
        <header className="mobile-top">
          <Link href="/" className="mobile-brand">
            Habitat
          </Link>
          <div className="mobile-actions">
            <ThemeToggle />
            <form action={logoutAction}>
              <button type="submit" className="ghost-btn">
                Lock
              </button>
            </form>
          </div>
        </header>
        <div className="shell-page">
          <div className="shell-content">{children}</div>
        </div>
        <TabBar />
      </main>
    </div>
  );
}

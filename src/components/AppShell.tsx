import Link from "next/link";
import { Leaf } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { SideNav, TabBar, ThemeToggle } from "@/components/Nav";
import { SideFooter } from "@/components/SideFooter";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  wide?: boolean;
  /** Full-bleed Today home layout (padding + glass overrides). */
  todayLayout?: boolean;
  /** Edge-to-edge content with tighter horizontal padding (habits flows). */
  fullWidth?: boolean;
  /** Stats dashboard: wider content, reduced horizontal inset (not flush). */
  statsLayout?: boolean;
};

export function AppShell({
  children,
  wide = false,
  todayLayout = false,
  fullWidth = false,
  statsLayout = false,
}: AppShellProps) {
  return (
    <div className="shell">
      <div className="shell-bg" aria-hidden />
      <div className="shell-grain" aria-hidden />

      <aside className="shell-side">
        <div className="side-head">
          <Link href="/" className="side-brand side-brand-row">
            <Leaf className="side-brand-icon" aria-hidden />
            <span>Habitat</span>
          </Link>
          <ThemeToggle />
        </div>
        <p className="side-tagline">Build a better you</p>
        <SideNav />
        <div className="side-motif">
          <p>
            Small steps.
            <br />
            Big changes.
          </p>
        </div>
        <SideFooter />
      </aside>

      <main
        className={cn(
          "shell-main",
          wide && "wide",
          fullWidth && "full-width",
          statsLayout && "stats-layout",
          todayLayout && "scenic-scene today-layout",
        )}
      >
        <header className="mobile-top">
          <Link href="/" className="mobile-brand side-brand-row">
            <Leaf className="side-brand-icon" aria-hidden />
            <span>Habitat</span>
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

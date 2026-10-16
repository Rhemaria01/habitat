type SoftShellProps = {
  children: React.ReactNode;
};

/** Chrome-less centered shell for login / offline / 404 screens. */
export function SoftShell({ children }: SoftShellProps) {
  return (
    <div className="shell login-shell">
      <div className="shell-bg" aria-hidden />
      <div className="shell-grain" aria-hidden />
      {children}
    </div>
  );
}

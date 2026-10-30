import { Lock } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { getOrCreateProfile } from "@/lib/profile";

export async function SideFooter() {
  let initial = "R";
  try {
    const profile = await getOrCreateProfile();
    const fromIdentity = profile.identity_note?.trim()?.charAt(0);
    if (fromIdentity) initial = fromIdentity.toUpperCase();
  } catch {
    /* profile optional */
  }

  return (
    <div className="side-foot">
      <div className="side-user-avatar" title="You" aria-hidden>
        {initial}
      </div>
      <form action={logoutAction}>
        <button type="submit" className="side-lock-btn">
          <Lock className="size-4" aria-hidden />
          Lock
        </button>
      </form>
    </div>
  );
}

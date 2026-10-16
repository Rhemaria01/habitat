"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { SoftShell } from "@/components/SoftShell";

const initial: LoginState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <SoftShell>
      <div className="login-wrap">
        <div className="login-card animate-fade-up">
          <span className="brand-mark">Habitat</span>
          <p>Goals · Habits · Routine · Guides</p>
          <h1>Welcome back</h1>
          <p>Enter your passphrase to unlock your growth space.</p>

          <form action={action}>
            <label className="field">
              <span>Passphrase</span>
              <input
                name="key"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </label>
            {state.error ? <p className="form-error">{state.error}</p> : null}
            <button type="submit" className="primary-btn" disabled={pending}>
              {pending ? "Opening…" : "Come in"}
            </button>
          </form>
        </div>
      </div>
    </SoftShell>
  );
}

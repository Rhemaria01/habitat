"use client";

import { useState, useActionState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { SoftShell } from "@/components/SoftShell";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

const initial: LoginState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initial);
  const [show, setShow] = useState(false);

  return (
    <SoftShell>
      <div className="login-wrap">
        <Card className="w-full max-w-sm animate-fade-up">
          <CardHeader>
            <CardDescription>Habitat · Goals · Habits · Routine · Guides</CardDescription>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription>
              Enter your passphrase to unlock your growth space.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="passphrase">Passphrase</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <KeyRound aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="passphrase"
                    name="key"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      size="icon-xs"
                      aria-label={show ? "Hide passphrase" : "Show passphrase"}
                      onClick={() => setShow((v) => !v)}
                    >
                      {show ? (
                        <EyeOff aria-hidden />
                      ) : (
                        <Eye aria-hidden />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              {state.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}

              <MagneticButton strength={0.35} maxDistance={24}>
                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? (
                    <>
                      <Spinner aria-hidden />
                      Opening…
                    </>
                  ) : (
                    "Come in"
                  )}
                </Button>
              </MagneticButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </SoftShell>
  );
}

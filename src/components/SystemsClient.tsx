"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  archiveSystem,
  createSystem,
  linkHabitToSystem,
} from "@/app/actions/systems";
import type { SystemWithRelations } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SystemsClientProps = {
  systems: SystemWithRelations[];
  habits: { id: string; name: string }[];
};

export function SystemsClient({ systems: initial, habits }: SystemsClientProps) {
  const [systems, setSystems] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");

  function create() {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await createSystem({
        name,
        purpose,
      });
      if (result.ok) {
        toast.success("System created");
        setName("");
        setPurpose("");
        window.location.reload();
      } else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <section className="panel max-w-lg space-y-3">
        <h2>New system</h2>
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Purpose</Label>
          <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </div>
        <Button type="button" disabled={pending} onClick={create}>
          Add system
        </Button>
      </section>

      <section className="space-y-3">
        {systems.length === 0 ? (
          <p className="text-muted-foreground text-sm">No systems yet.</p>
        ) : (
          systems.map((system) => (
            <article key={system.id} className="panel">
              <div className="panel-head">
                <h2>
                  <Link href={`/systems/${system.id}`} className="hover:underline">
                    {system.name}
                  </Link>
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      const r = await archiveSystem(system.id);
                      if (r.ok) {
                        setSystems((s) => s.filter((x) => x.id !== system.id));
                      } else toast.error(r.error);
                    })
                  }
                >
                  Archive
                </Button>
              </div>
              {system.purpose ? (
                <p className="text-sm text-muted-foreground">{system.purpose}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {system.habits.length} habits · {system.goals.length} goals
              </p>
              {habits.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      const habitId = e.target.value;
                      if (!habitId) return;
                      startTransition(async () => {
                        const r = await linkHabitToSystem(system.id, habitId);
                        if (r.ok) toast.success("Linked");
                        else toast.error(r.error);
                      });
                      e.target.value = "";
                    }}
                  >
                    <option value="">Link habit…</option>
                    {habits.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

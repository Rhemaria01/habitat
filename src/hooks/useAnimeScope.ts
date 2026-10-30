"use client";

import { useEffect, useRef } from "react";
import { createScope, type Scope } from "animejs";

type UseAnimeScopeOptions = {
  /** Run scoped setup when root mounts (and re-run when deps change). */
  setup?: (scope: Scope) => void | (() => void);
  deps?: unknown[];
};

export function useAnimeScope<T extends HTMLElement = HTMLDivElement>(
  options: UseAnimeScopeOptions = {},
) {
  const rootRef = useRef<T>(null);
  const scopeRef = useRef<Scope | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scope = createScope({ root });
    scopeRef.current = scope;

    let cleanup: void | (() => void);
    if (options.setup) {
      scope.add(() => {
        cleanup = options.setup?.(scope);
      });
      scope.refresh();
    }

    return () => {
      cleanup?.();
      scope.revert();
      scopeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optional deps from caller
  }, options.deps ?? []);

  return { rootRef, scopeRef };
}

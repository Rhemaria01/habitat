"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { enterPage } from "@/animations/page-transitions";
import { cn } from "@/lib/utils";

type AnimatedPageProps = {
  children: ReactNode;
  className?: string;
};

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const anim = enterPage(ref.current);
    return () => {
      anim?.pause();
    };
  }, []);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

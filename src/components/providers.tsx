"use client";

import { MotionConfig } from "motion/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

/**
 * Client-side providers wrapped around the whole app:
 * tooltips (Radix), reduced-motion preference, and toasts.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <MotionConfig reducedMotion="user">
        {children}
        <Toaster position="bottom-center" />
      </MotionConfig>
    </TooltipProvider>
  );
}

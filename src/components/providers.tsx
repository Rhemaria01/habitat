"use client";

import { MotionConfig } from "motion/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { HabitatPets } from "@/components/pets/HabitatPets";

/**
 * Client-side providers wrapped around the whole app:
 * tooltips (Radix), reduced-motion preference, and toasts.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <MotionConfig reducedMotion="user">
        {children}
        <HabitatPets />
        <Toaster position="bottom-center" />
      </MotionConfig>
    </TooltipProvider>
  );
}

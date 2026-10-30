"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { HabitatPets } from "@/components/pets/HabitatPets";
import { AppearanceProvider } from "@/components/AppearanceProvider";
import { getQueryClient } from "@/lib/api/query-client";

/**
 * Client-side providers wrapped around the whole app:
 * tooltips (Radix), reduced-motion preference, and toasts.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AppearanceProvider>
        <TooltipProvider>
          <MotionConfig reducedMotion="user">
            <HabitatPets />
            {children}
            <Toaster position="bottom-center" />
          </MotionConfig>
        </TooltipProvider>
      </AppearanceProvider>
    </QueryClientProvider>
  );
}

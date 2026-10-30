"use client";

import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/app/actions/settings";
import { queryKeys } from "@/lib/api/query-keys";
import type { Profile } from "@/lib/types";

export function useProfileQuery(options?: { initialData?: Profile }) {
  return useQuery({
    queryKey: queryKeys.profile.current(),
    queryFn: () => getProfile(),
    initialData: options?.initialData,
  });
}

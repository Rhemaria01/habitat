"use client";

import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateHabitDomain } from "@/lib/api/invalidate";
import type { ApiResponse } from "@/lib/api/types";
import { ApiError, unwrapApi } from "@/lib/api/types";

type ActionMutationOptions<TInput, TData> = {
  invalidateHabits?: boolean | { habitId?: string };
  successToast?: string | ((data: TData, input: TInput) => string);
  errorToast?: boolean;
  onSuccess?: (data: TData, input: TInput) => void;
  onError?: (error: ApiError, input: TInput) => void;
} & Omit<
  UseMutationOptions<TData, ApiError, TInput>,
  "mutationFn" | "onSuccess" | "onError"
>;

export function useActionMutation<TInput, TData = void>(
  mutationFn: (input: TInput) => Promise<ApiResponse<TData>>,
  options?: ActionMutationOptions<TInput, TData>,
) {
  const queryClient = useQueryClient();
  const {
    invalidateHabits,
    successToast,
    errorToast = true,
    onSuccess,
    onError,
    ...rest
  } = options ?? {};

  return useMutation<TData, ApiError, TInput>({
    mutationFn: async (input) => unwrapApi(await mutationFn(input)),
    onSuccess: (data, input) => {
      if (invalidateHabits) {
        const habitId =
          typeof invalidateHabits === "object"
            ? invalidateHabits.habitId
            : undefined;
        invalidateHabitDomain(queryClient, { habitId });
      }
      if (successToast) {
        const msg =
          typeof successToast === "function"
            ? successToast(data, input)
            : successToast;
        toast.success(msg);
      }
      onSuccess?.(data, input);
    },
    onError: (error, input) => {
      if (errorToast) toast.error(error.userMessage);
      onError?.(error, input);
    },
    ...rest,
  });
}

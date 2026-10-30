"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type HabitCardActionsMenuProps = {
  habitName: string;
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  className?: string;
};

export function HabitCardActionsMenu({
  habitName,
  onEdit,
  onDelete,
  disabled,
  className,
}: HabitCardActionsMenuProps) {
  if (!onEdit && !onDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn("habit-card-v2-icon-btn", className)}
          aria-label={`Actions for ${habitName}`}
          disabled={disabled}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <MoreVertical className="size-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit ? (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onEdit();
            }}
          >
            <Pencil className="size-4" aria-hidden />
            Edit
          </DropdownMenuItem>
        ) : null}
        {onDelete ? (
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault();
              onDelete();
            }}
          >
            <Trash2 className="size-4" aria-hidden />
            Delete
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { HabitForm } from "@/components/HabitForm";
import { HabitCardPreview } from "@/components/HabitCardPreview";
import {
  DEFAULT_HABIT_CARD_PREVIEW_DRAFT,
  habitPreviewDraftFromHabit,
  type HabitCardPreviewDraft,
} from "@/lib/content/habit-card-cover";
import type { Habit } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ADD_FORM_ID = "add-habit-form";

type AddHabitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit | null;
};

export function AddHabitDialog({ open, onOpenChange, habit = null }: AddHabitDialogProps) {
  const isEdit = Boolean(habit);
  const formId = isEdit ? `edit-habit-${habit!.id}` : ADD_FORM_ID;

  const [draft, setDraft] = useState<HabitCardPreviewDraft>(
    DEFAULT_HABIT_CARD_PREVIEW_DRAFT,
  );

  const onDraftChange = useCallback((next: HabitCardPreviewDraft) => {
    setDraft(next);
  }, []);

  useEffect(() => {
    if (open) {
      setDraft(
        habit ? habitPreviewDraftFromHabit(habit) : DEFAULT_HABIT_CARD_PREVIEW_DRAFT,
      );
    }
  }, [open, habit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="habit-add-dialog gap-0 p-0 sm:max-w-none"
        showCloseButton
      >
        <div className="modal habit-create-modal">
          <div className="habit-create-shell">
            <aside className="habit-create-preview-pane" aria-label="Card preview">
              <p className="habit-create-preview-label">Live preview</p>
              <div className="habit-create-preview-stage">
                <HabitCardPreview draft={draft} />
              </div>
            </aside>
            <div className="habit-create-form-pane">
              <DialogHeader className="habit-create-form-head">
                <DialogTitle className="habit-modal-title">
                  {isEdit ? "Edit habit" : "Add new habit"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {isEdit
                    ? "Changes update your card and schedule. Preview on the left."
                    : "Left side updates as you type. Pick a card look under Illustration."}
                </DialogDescription>
              </DialogHeader>
              <div className="habit-create-form-scroll">
                <HabitForm
                  key={habit?.id ?? "new"}
                  habit={habit ?? undefined}
                  compact
                  formId={formId}
                  onDraftChange={onDraftChange}
                  onCancel={() => onOpenChange(false)}
                  onDone={() => onOpenChange(false)}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

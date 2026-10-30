"use client";

import { useCallback, useState } from "react";
import { HabitForm } from "@/components/HabitForm";
import { HabitCardPreview } from "@/components/HabitCardPreview";
import {
  DEFAULT_HABIT_CARD_PREVIEW_DRAFT,
  type HabitCardPreviewDraft,
} from "@/lib/content/habit-card-cover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FORM_ID = "add-habit-form";

type AddHabitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddHabitDialog({ open, onOpenChange }: AddHabitDialogProps) {
  const [draft, setDraft] = useState<HabitCardPreviewDraft>(
    DEFAULT_HABIT_CARD_PREVIEW_DRAFT,
  );

  const onDraftChange = useCallback((next: HabitCardPreviewDraft) => {
    setDraft(next);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="habit-add-dialog habit-add-dialog--wide border-0 bg-transparent p-0 shadow-none sm:max-w-[min(100vw-0.75rem,56rem)]"
        showCloseButton
      >
        <div className="modal habit-modal habit-create-modal">
          <div className="habit-create-layout">
            <aside className="habit-create-preview-pane" aria-label="Card preview">
              <p className="habit-create-preview-label">Preview</p>
              <HabitCardPreview draft={draft} />
            </aside>
            <div className="habit-create-form-pane">
              <DialogHeader className="habit-modal-head">
                <DialogTitle className="habit-modal-title">Add new habit</DialogTitle>
              </DialogHeader>
              <div className="habit-create-form-scroll">
                <HabitForm
                  compact
                  formId={FORM_ID}
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

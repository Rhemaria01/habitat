"use client";

import { HabitForm } from "@/components/HabitForm";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="habit-add-dialog border-0 bg-transparent p-0 shadow-none sm:max-w-[min(100vw-0.75rem,28rem)]"
        showCloseButton
      >
        <div className="modal habit-modal">
          <DialogHeader className="habit-modal-head">
            <DialogTitle className="habit-modal-title">Add new habit</DialogTitle>
          </DialogHeader>
          <HabitForm
            compact
            formId={FORM_ID}
            onCancel={() => onOpenChange(false)}
            onDone={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

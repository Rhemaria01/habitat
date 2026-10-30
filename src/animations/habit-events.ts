type HabitCompleteListener = () => void;

const completeListeners = new Set<HabitCompleteListener>();

export function onHabitCompleted(listener: HabitCompleteListener): () => void {
  completeListeners.add(listener);
  return () => completeListeners.delete(listener);
}

/** Notify mascots / global UI that a habit was completed (not cleared). */
export function emitHabitCompleted(): void {
  completeListeners.forEach((fn) => fn());
}

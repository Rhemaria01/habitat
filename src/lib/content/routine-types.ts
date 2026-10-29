export type DayType = "weekday" | "weekend";

export type RoutineSlot = {
  /** Database row id — present for DB-loaded slots, absent for static seed. */
  id?: string;
  /** Stable identifier referenced by checks + habit links. */
  key: string;
  time: string;
  title: string;
  doText: string;
  dontText: string;
  dayType: DayType;
};

/** Editable fields for creating/updating a routine slot. */
export type RoutineSlotInput = {
  time: string;
  title: string;
  doText: string;
  dontText: string;
  dayType: DayType;
};

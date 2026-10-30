import { AppShell } from "@/components/AppShell";
import { CalendarClient } from "@/components/CalendarClient";
import {
  getCalendarDayDetail,
  getCalendarMonth,
} from "@/app/actions/calendar";
import { todayKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const today = new Date();
  const initial = await getCalendarMonth(today.getFullYear(), today.getMonth());
  const initialDay = await getCalendarDayDetail(todayKey());

  return (
    <AppShell wide fullWidth>
      <CalendarClient initial={initial} initialDay={initialDay} />
    </AppShell>
  );
}

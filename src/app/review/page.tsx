import { AppShell } from "@/components/AppShell";
import { ReviewClient } from "@/components/ReviewClient";
import {
  currentWeeklyReview,
  listHabitAudits,
  listReviews,
} from "@/app/actions/reviews";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const [weekly, audits, history] = await Promise.all([
    currentWeeklyReview(),
    listHabitAudits(),
    listReviews(),
  ]);

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">Review</h1>
      <ReviewClient weekly={weekly} audits={audits} history={history} />
    </AppShell>
  );
}

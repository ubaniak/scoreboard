import type { Current, Schedule } from "../../entities/current";
import { BoutView } from "./BoutView";
import { ScheduleView } from "./ScheduleView";

export type ShowCurrentProps = {
  current?: Current;
  schedule?: Schedule;
};

const ACTIVE_STATUSES = new Set([
  "in_progress",
  "waiting_for_scores",
  "score_complete",
  "waiting_for_decision",
  "decision_made",
  "show_decision",
  "completed",
]);

export const ShowCurrent = ({ current, schedule }: ShowCurrentProps) => {
  const boutActive = ACTIVE_STATUSES.has(current?.bout?.status ?? "");

  if (!boutActive) {
    const scheduleCard = schedule?.card ?? current?.card;
    return (
      <ScheduleView
        cardName={scheduleCard?.name}
        cardImageUrl={scheduleCard?.showCardImage ? scheduleCard?.imageUrl : undefined}
        bouts={schedule?.bouts ?? []}
        nextBoutId={current?.nextBout?.id}
      />
    );
  }

  return <BoutView current={current!} />;
};

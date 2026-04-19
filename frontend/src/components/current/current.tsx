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
    return (
      <ScheduleView
        cardName={schedule?.card?.name ?? current?.card?.name}
        bouts={schedule?.bouts ?? []}
        nextBoutId={current?.nextBout?.id}
      />
    );
  }

  return <BoutView current={current!} />;
};

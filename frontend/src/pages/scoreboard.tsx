import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetCurrent, useGetSchedule } from "../api/current";
import { ShowCurrent } from "../components/current/current";
import { ScoreboardLayout } from "../layouts/scoreboard";
import { baseUrl } from "../api/constants";

export const ScoreboardPage = () => {
  const queryClient = useQueryClient();
  const current = useGetCurrent();
  const schedule = useGetSchedule();

  useEffect(() => {
    const es = new EventSource(`${baseUrl}/api/current/events`);
    es.addEventListener("update", () => {
      queryClient.invalidateQueries({ queryKey: ["current"] });
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    });
    return () => es.close();
  }, [queryClient]);

  return (
    <ScoreboardLayout>
      <ShowCurrent current={current.data} schedule={schedule.data} />
    </ScoreboardLayout>
  );
};

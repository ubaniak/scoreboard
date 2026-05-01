import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "../api/constants";
import { useGetCurrent } from "../api/current";
import { useHealthCheck } from "../api/devices";
import { useGetOfficials } from "../api/officials";
import { JudgeIndex } from "../components/judge";
import { useProfile } from "../providers/login";
import {
  useMutateCompleteScoreRound,
  useMutateOverallWinner,
  useMutateReadyScore,
  useMutateScoreRound,
  useGetScores,
  type ScoreRoundProps,
} from "../api/score";
import { useTheme } from "../theme";

export const JudgePage = () => {
  const { token, role } = useProfile();
  const queryClient = useQueryClient();
  const theme = useTheme();

  useEffect(() => {
    const previousMode = theme.mode;
    theme.setMode("dark");
    return () => {
      theme.setMode(previousMode);
    };
  }, [theme]);
  useHealthCheck({ token });
  const current = useGetCurrent();

  useEffect(() => {
    const es = new EventSource(`${baseUrl}/api/current/events`);
    es.addEventListener("update", () => {
      queryClient.invalidateQueries({ queryKey: ["current"] });
      queryClient.invalidateQueries({ queryKey: ["scores"] });
    });
    return () => es.close();
  }, [queryClient]);

  const cardId = current.data?.card?.id ?? "";
  const boutId = current.data?.bout?.id ?? "";
  const roundNumber = current.data?.round?.roundNumber ?? 0;

  const officials = useGetOfficials({ token });
  const scores = useGetScores({ token, cardId, boutId });
  const ready = useMutateReadyScore({ token, cardId, boutId, roundNumber });
  const score = useMutateScoreRound({ token, cardId, boutId, roundNumber });
  const completeRound = useMutateCompleteScoreRound({
    token,
    cardId,
    boutId,
    roundNumber,
  });
  const overallWinner = useMutateOverallWinner({ token, cardId, boutId });

  const scoreRound = async (values: ScoreRoundProps) => {
    await score.mutateAsync(values);
  };

  const complete = async () => {
    completeRound.mutateAsync();
  };

  const setReady = async (name: string) => {
    await ready.mutateAsync(name);
  };

  const pickOverallWinner = async (winner: "red" | "blue") => {
    await overallWinner.mutateAsync(winner);
  };

  return (
    <JudgeIndex
      current={current.data}
      role={role}
      officials={officials.data ?? []}
      scores={scores.data}
      controls={{
        scoreRound,
        complete,
        setReady,
        pickOverallWinner,
      }}
    />
  );
};

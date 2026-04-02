import { useGetCurrent } from "../api/current";
import { useHealthCheck } from "../api/devices";
import { JudgeIndex } from "../components/judge";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";
import {
  useMutateCompleteScoreRound,
  useMutateScoreRound,
  type ScoreRoundProps,
} from "../api/score";

export const JudgePage = () => {
  const { token } = useProfile();
  useHealthCheck({ token });
  const current = useGetCurrent();

  const cardId = current.data?.card?.id ?? "";
  const boutId = current.data?.bout?.id ?? "";
  const roundNumber = current.data?.round?.roundNumber ?? 0;

  const score = useMutateScoreRound({ token, cardId, boutId, roundNumber });
  const completeRound = useMutateCompleteScoreRound({
    token,
    cardId,
    boutId,
    roundNumber,
  });

  const scoreRound = async (values: ScoreRoundProps) => {
    await score.mutateAsync(values);
  };

  const complete = async () => {
    completeRound.mutateAsync();
  };

  return (
    <PageLayout title="Judge" subTitle={current.data?.card?.name}>
      <JudgeIndex
        current={current.data}
        controls={{
          scoreRound,
          complete,
        }}
      />
    </PageLayout>
  );
};

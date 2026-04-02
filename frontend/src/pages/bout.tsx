import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  useGetBoutById,
  useGetFouls,
  useGetRound,
  useMutateDeleteBout,
  useMutateEightCount,
  useMutateEndBout,
  useMutateHandleFoul,
  useMutateNextRoundState,
  useMutateUpdateBout,
  useMutateUpdateBoutStatus,
  type EndBoutProps,
} from "../api/bouts";
import { useGetCardById } from "../api/cards";
import { isApisLoading } from "../api/handlers";
import { ActionMenu } from "../components/actionMenu/actionMenu";
import { BoutIndex } from "../components/bout";
import { EditBout } from "../components/bouts/edit";
import { CardSummary } from "../components/cards/summery";
import { ApiLoading } from "../components/loading/Apiloading";
import type { Bout } from "../entities/cards";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";
import { useGetScores } from "../api/score";
import { useJudgeDevices, useMutationGenerateCode } from "../api/devices";
import { JudgeConnectionQuickLook } from "../components/devices/JudgeConnectionQuickLook";

const PageActions = ({
  bout,
  cardId,
  token,
}: {
  bout: Bout;
  cardId: string;
  token: string;
}) => {
  const navigate = useNavigate();
  const deleteBout = useMutateDeleteBout(cardId, token);
  const updateBout = useMutateUpdateBout({ token, cardId });

  return (
    <ActionMenu
      trigger={{ text: "Edit" }}
      content={{
        title: "Edit Bout",
        body: (close) => (
          <EditBout
            bout={bout}
            onClose={close}
            onSubmit={(toUpdate) => {
              updateBout.mutate({ toUpdate, boutInfo: { boutId: bout.id } });
            }}
            onDelete={() => {
              deleteBout.mutate(bout.id, {
                onSuccess: () => navigate({ to: `/card/${cardId}` }),
              });
            }}
          />
        ),
      }}
    />
  );
};

export const BoutPage = () => {
  const { token } = useProfile();
  const { cardId, boutId } = useParams({ strict: false });

  const card = useGetCardById({ token, cardId });
  const bout = useGetBoutById({ token, cardId, boutId });
  const fouls = useGetFouls({ token, cardId });

  const judgeDevices = useJudgeDevices({ token });
  const generateCode = useMutationGenerateCode({ token });

  const [roundNumber, setRoundNumber] = useState(1);

  const round = useGetRound({ token, cardId, boutId, roundNumber });
  const handleFoul = useMutateHandleFoul({
    token,
    cardId,
    boutId,
    roundNumber,
  });

  const handleEightCount = useMutateEightCount({
    token,
    cardId,
    boutId,
    roundNumber,
  });

  const setRound = (currentRound: number) => {
    setRoundNumber(currentRound);
    round.refetch();
  };

  const updateBoutStatus = useMutateUpdateBoutStatus({
    token,
    boutId,
    cardId,
  });

  const endBout = useMutateEndBout({
    token,
    boutId,
    cardId,
  });

  const scores = useGetScores({ token, cardId, boutId });

  const onStartBout = () => {
    updateBoutStatus.mutate({ status: "in_progress" });
  };

  const onEndBout = (value: EndBoutProps) => {
    endBout.mutate(value);
  };

  const isLoading = isApisLoading({ card, bout, fouls });

  const nextRoundState = useMutateNextRoundState({ token, cardId, boutId });

  const onNextRoundState = async () => {
    const curr = await nextRoundState.mutateAsync();
    if (curr > 0) {
      setRoundNumber(curr);
    }
  };

  return (
    <PageLayout
      action={<PageActions bout={bout.data!} cardId={cardId!} token={token} />}
      title="Bout details"
      subTitle={
        <>
          <CardSummary card={card.data!} />
          <JudgeConnectionQuickLook
            requiredJudges={bout.data?.numberOfJudges ?? 5}
            devices={judgeDevices.data || []}
            onRefreshCode={(values) => {
              generateCode.mutate(values);
            }}
          />
        </>
      }
      breadCrumbs={[
        { title: <a href="/">home</a> },
        { title: <a href={`/card/${cardId}`}>card</a> },
        { title: `bout ${boutId}` },
      ]}
    >
      <BoutIndex
        isLoading={isLoading}
        loadingComponent={<ApiLoading apis={{ card, bout, fouls }} />}
        bout={bout.data!}
        fouls={fouls.data!}
        round={round.data!}
        scores={scores.data}
        controls={{
          onNextRoundState,
          setRound,
          handleFoul: (value) => {
            handleFoul.mutate(value);
          },
          handleEightCount: (value) => {
            handleEightCount.mutate(value);
          },
          onStartBout,
          onEndBout,
        }}
      />
    </PageLayout>
  );
};
// onStartRound: () => void;
// onEndRound: () => void;
// onScoreRound: () => void;
// onNextRound: () => void;
// setRound: (currentRound: number) => void;
// handleFoul: (props: MutateHandleFoulProps) => void;
// onStartBout: () => void;
// onEndBout: () => void;

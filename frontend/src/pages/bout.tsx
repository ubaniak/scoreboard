import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "../api/constants";
import {
  useGetBoutById,
  useGetFouls,
  useGetRound,
  useMutateCompleteBout,
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
import { useGetOfficials } from "../api/officials";
import { ActionMenu } from "../components/actionMenu/actionMenu";
import { BoutIndex } from "../components/bout";
import { ExportBout } from "../components/bout/export";
import { EditBout } from "../components/bouts/edit";
import { CardSummary } from "../components/cards/summery";
import { ApiLoading } from "../components/loading/Apiloading";
import type { Bout, Card, Official } from "../entities/cards";
import type { ScoresByRound } from "../entities/scores";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";
import { useGetScores } from "../api/score";
import { useJudgeDevices, useMutationGenerateCode } from "../api/devices";
import { JudgeConnectionQuickLook } from "../components/devices/JudgeConnectionQuickLook";

const PageActions = ({
  bout,
  card,
  scores,
  officials,
  cardId,
  token,
}: {
  bout: Bout;
  card: Card;
  scores: ScoresByRound;
  officials: Official[];
  cardId: string;
  token: string;
}) => {
  const navigate = useNavigate();
  const deleteBout = useMutateDeleteBout(cardId, token);
  const updateBout = useMutateUpdateBout({ token, cardId });

  return (
    <>
      <ActionMenu
        trigger={{ text: "Export" }}
        content={{
          title: "Export Bout",
          body: () => <ExportBout card={card} bout={bout} scores={scores} />,
        }}
      />
      <ActionMenu
        trigger={{ text: "Edit" }}
        content={{
          title: "Edit Bout",
          body: (close) => (
            <EditBout
              bout={bout}
              officials={officials}
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
    </>
  );
};

export const BoutPage = () => {
  const { token } = useProfile();
  const queryClient = useQueryClient();
  const { cardId, boutId } = useParams({ strict: false });

  useEffect(() => {
    const es = new EventSource(`${baseUrl}/api/current/events`);
    es.addEventListener("update", () => {
      queryClient.invalidateQueries({ queryKey: ["scores"] });
    });
    return () => es.close();
  }, [queryClient]);

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

  const completeBout = useMutateCompleteBout({
    token,
    boutId: boutId!,
    cardId: cardId!,
  });

  const scores = useGetScores({ token, cardId, boutId });
  const officials = useGetOfficials({ token, cardId });
  const updateBout = useMutateUpdateBout({ token, cardId });

  const onStartBout = () => {
    updateBoutStatus.mutate({ status: "in_progress" });
  };

  const onSetReferee = (name: string) => {
    updateBout.mutate({ toUpdate: { referee: name }, boutInfo: { boutId: boutId! } });
  };

  const onEndBout = (value: EndBoutProps) => {
    endBout.mutate(value);
  };

  const isLoading = isApisLoading({ card, bout, fouls });

  const nextRoundState = useMutateNextRoundState({ token, cardId, boutId, roundNumber });

  const onNextRoundState = async () => {
    const curr = await nextRoundState.mutateAsync();
    if (curr > 0) {
      setRoundNumber(curr);
    }
  };

  return (
    <PageLayout
      action={<PageActions bout={bout.data!} card={card.data!} scores={scores.data ?? {}} officials={officials.data ?? []} cardId={cardId!} token={token} />}
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
        officials={officials.data}
        controls={{
          onNextRoundState,
          setRound,
          handleFoul: (value) => { handleFoul.mutate(value); },
          handleEightCount: (value) => { handleEightCount.mutate(value); },
          onStartBout,
          onEndBout,
          onSetReferee,
          onCompleteBout: () => completeBout.mutate(),
        }}
      />
    </PageLayout>
  );
};

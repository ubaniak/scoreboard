import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Button, Space } from "antd";
import { useEffect, useState } from "react";
import {
  useGetBoutById,
  useGetBouts,
  useGetFouls,
  useGetRound,
  useMutateCompleteBout,
  useMutateDeleteBout,
  useMutateEightCount,
  useMutateHandleFoul,
  useMutateMakeDecision,
  useMutateNextRoundState,
  useMutateShowDecision,
  useMutateUpdateBout,
  useMutateUpdateBoutStatus,
  type MakeDecisionProps,
} from "../api/bouts";
import { useGetCardById } from "../api/cards";
import { baseUrl } from "../api/constants";
import { useJudgeDevices, useMutationGenerateCode } from "../api/devices";
import { isApisLoading } from "../api/handlers";
import { useGetOfficials } from "../api/officials";
import { useGetScores } from "../api/score";
import { ActionMenu } from "../components/actionMenu/actionMenu";
import { BoutIndex } from "../components/bout";
import { ExportBout } from "../components/bout/export";
import { EditBout } from "../components/bouts/edit";
import { CardSummary } from "../components/cards/summery";
import { DeviceQuickLook } from "../components/devices/DeviceQuickLook";
import { ApiLoading } from "../components/loading/Apiloading";
import type { Bout, Card, Official } from "../entities/cards";
import type { ScoresByRound } from "../entities/scores";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

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

  const navigate = useNavigate();
  const card = useGetCardById({ token, cardId });
  const bout = useGetBoutById({ token, cardId, boutId });
  const bouts = useGetBouts({ token, cardId });

  const [prevBout, setPrevBout] = useState<Bout | undefined>(undefined);
  const [nextBout, setNextBout] = useState<Bout | undefined>(undefined);

  useEffect(() => {
    const setBouts = async () => {
      const boutList = bouts.data ?? [];
      const currentIndex = boutList.findIndex(
        (b) => b.id.toString() === boutId,
      );
      setPrevBout(undefined);
      setNextBout(undefined);
      if (currentIndex > 0) {
        setPrevBout(boutList[currentIndex - 1]);
      }
      if (currentIndex < boutList.length - 1) {
        setNextBout(boutList[currentIndex + 1]);
      }
    };
    if (!bouts.isLoading) {
      setBouts();
    }
  }, [bouts.isLoading, boutId, bouts.data]);

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

  const makeDecision = useMutateMakeDecision({
    token,
    boutId,
    cardId,
  });

  const showDecision = useMutateShowDecision({
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
    updateBout.mutate({
      toUpdate: { referee: name },
      boutInfo: { boutId: boutId! },
    });
  };

  const isLoading = isApisLoading({ card, bout, fouls });

  const nextRoundState = useMutateNextRoundState({
    token,
    cardId,
    boutId,
    roundNumber,
  });

  const onNextRoundState = async () => {
    const curr = await nextRoundState.mutateAsync();
    if (curr > 0) {
      setRoundNumber(curr);
    }
  };

  return (
    <PageLayout
      action={
        <Space>
          <Button
            icon={<LeftOutlined />}
            onClick={() =>
              prevBout &&
              navigate({ to: `/card/${cardId}/bout/${prevBout.id}` })
            }
            disabled={prevBout === undefined}
          >
            Bout {prevBout?.boutNumber}
          </Button>
          <Button
            icon={<RightOutlined />}
            disabled={nextBout === undefined}
            onClick={() =>
              nextBout &&
              navigate({ to: `/card/${cardId}/bout/${nextBout.id}` })
            }
          >
            Bout {nextBout?.boutNumber}
          </Button>
          <PageActions
            bout={bout.data!}
            card={card.data!}
            scores={scores.data ?? {}}
            officials={officials.data ?? []}
            cardId={cardId!}
            token={token}
          />
        </Space>
      }
      title="Bout details"
      subTitle={
        <>
          <CardSummary card={card.data!} />
          <DeviceQuickLook
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
          handleFoul: (value) => {
            handleFoul.mutate(value);
          },
          handleEightCount: (value) => {
            handleEightCount.mutate(value);
          },
          onStartBout,
          onSetReferee,
          onMakeDecision: (props: MakeDecisionProps) =>
            makeDecision.mutate(props),
          onCompleteBout: () => completeBout.mutate(),
          onShowDecision: () => showDecision.mutate(),
        }}
      />
    </PageLayout>
  );
};

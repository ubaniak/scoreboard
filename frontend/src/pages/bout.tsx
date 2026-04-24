import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Button, Space } from "antd";
import { useEffect, useMemo, useState } from "react";
import {
  useGetBoutById,
  useGetBouts,
  useGetFouls,
  useGetRound,
  useMutateCompleteBout,
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
import { BoutIndex } from "../components/bout";
import { BoutPageActions } from "../components/bouts/BoutPageActions";
import { CardSummary } from "../components/cards/summery";
import { DeviceQuickLook } from "../components/devices/DeviceQuickLook";
import { ApiLoading } from "../components/loading/Apiloading";
import type { Bout } from "../entities/cards";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

export const BoutPage = () => {
  const { token } = useProfile();
  const queryClient = useQueryClient();
  const { cardId, boutId } = useParams({ strict: false });

  useEffect(() => {
    const es = new EventSource(`${baseUrl}/api/current/events`);
    es.addEventListener("update", () => {
      queryClient.invalidateQueries({ queryKey: ["scores", token] });
    });
    return () => es.close();
  }, [queryClient, token]);

  const navigate = useNavigate();
  const card = useGetCardById({ token, cardId });
  const bout = useGetBoutById({ token, cardId, boutId });
  const bouts = useGetBouts({ token, cardId });

  const boutList = useMemo(() => bouts.data ?? [], [bouts.data]);
  const [prevBout, setPrevBout] = useState<Bout | undefined>(undefined);
  const [nextBout, setNextBout] = useState<Bout | undefined>(undefined);

  useEffect(() => {
    const setBouts = () => {
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
  }, [bouts.isLoading, boutId, boutList]);

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
  const officials = useGetOfficials({ token });
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
            aria-label={prevBout ? `Previous bout: Bout ${prevBout.boutNumber}` : "Previous bout"}
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
            aria-label={nextBout ? `Next bout: Bout ${nextBout.boutNumber}` : "Next bout"}
          >
            Bout {nextBout?.boutNumber}
          </Button>
          <BoutPageActions
            bout={bout.data!}
            officials={officials.data ?? []}
            cardId={cardId!}
            token={token}
          />
        </Space>
      }
      title={
        bout.data
          ? `Bout ${bout.data.boutNumber} — ${bout.data.redCorner ?? "—"} vs ${bout.data.blueCorner ?? "—"}`
          : "Bout details"
      }
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
        { title: bout.data ? `Bout ${bout.data.boutNumber}` : `bout ${boutId}` },
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

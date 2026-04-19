import { useParams } from "@tanstack/react-router";
import {
  useGetBouts,
  useMutateCreateBout,
  useMutateDeleteBout,
  useMutateImportBouts,
  useMutateUpdateBout,
} from "../api/bouts";
import { useListAthletes } from "../api/athletes";
import { useGetCardById, useMutateUpdateCardJudges, useMutateUpdateCardStatus } from "../api/cards";
import { useJudgeDevices, useMutationGenerateCode } from "../api/devices";
import { useGetOfficials } from "../api/officials";
import { useGetAllBoutScores } from "../api/score";
import { BoutsIndex } from "../components/bouts";
import { NextBout } from "../components/bouts/nextBout";
import { CardActions } from "../components/cards/CardActions";
import { CardControls } from "../components/cards/cardControls";
import { CardSummary } from "../components/cards/summery";
import { DeviceQuickLook } from "../components/devices/DeviceQuickLook";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

export const CardPage = () => {
  const { token } = useProfile();
  const { cardId } = useParams({ strict: false });

  const bouts = useGetBouts({ token, cardId });
  const officials = useGetOfficials({ token });
  const card = useGetCardById({ token, cardId });
  const athletes = useListAthletes({ token });

  const judgeDevices = useJudgeDevices({ token });
  const generateCode = useMutationGenerateCode({ token });

  const addBout = useMutateCreateBout({ token, cardId });
  const updateBout = useMutateUpdateBout({ token, cardId });
  const deleteBout = useMutateDeleteBout(cardId, token);
  const importBouts = useMutateImportBouts({ token, cardId });
  const allBoutScores = useGetAllBoutScores({
    token,
    cardId,
    boutIds: bouts.data?.map((b) => b.id) ?? [],
  });

  const updateCardStatus = useMutateUpdateCardStatus({ token });
  const updateCardJudges = useMutateUpdateCardJudges({ token });

  const onSetJudges = (count: number) => {
    updateCardJudges.mutate({ id: { cardId }, numberOfJudges: count });
    (bouts.data ?? [])
      .filter((b) => b.boutType === "scored")
      .forEach((b) => {
        updateBout.mutate({
          toUpdate: { numberOfJudges: count },
          boutInfo: { boutId: b.id },
        });
      });
  };

  const start = () => {
    updateCardStatus.mutate({ id: { cardId }, status: "in_progress" });
  };

  const end = () => {
    updateCardStatus.mutate({ id: { cardId }, status: "completed" });
  };

  return (
    <PageLayout
      title="Card details"
      subTitle={
        <>
          <CardSummary card={card.data} />
          <DeviceQuickLook
            requiredJudges={Math.max(...(bouts.data?.map((b) => b.numberOfJudges) ?? [5]))}
            devices={judgeDevices.data || []}
            onRefreshCode={(values) => {
              generateCode.mutate(values);
            }}
          />
        </>
      }
      breadCrumbs={[{ title: <a href="/">home</a> }, { title: "card" }]}
      action={<CardActions status={card.data?.status} onStart={start} onEnd={end} />}
    >
      {card.data && <CardControls card={card.data} onSetJudges={onSetJudges} />}
      <NextBout bouts={bouts.data ?? []} cardId={cardId!} />
      <BoutsIndex
        loading={bouts.isLoading}
        card={card.data}
        bouts={bouts.data}
        officials={officials.data}
        athletes={athletes.data}
        allBoutScores={allBoutScores.data}
        onAddBout={(values) => {
          addBout.mutate(values);
        }}
        onEditBout={(values) => {
          updateBout.mutate(values);
        }}
        onDeleteBout={(boutId) => deleteBout.mutate(boutId)}
        onImport={(file) => importBouts.mutateAsync(file)}
      />
    </PageLayout>
  );
};

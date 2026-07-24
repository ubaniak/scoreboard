import { Outlet, useParams } from "@tanstack/react-router";
import { useGetBouts, useMutateUpdateBout } from "../api/bouts";
import {
  useGetCardById,
  useMutateUpdateCardJudges,
  useMutateUpdateCardStatus,
  useMutateUpdateCards,
} from "../api/cards";
import { NextBout } from "../components/bouts/nextBout";
import { CardActions } from "../components/cards/CardActions";
import { CardControls } from "../components/cards/cardControls";
import { CardExports } from "../components/cards/CardExports";
import { CardSummary } from "../components/cards/summery";
import { RoutedTabs } from "../components/shared/RoutedTabs";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

export const CardPage = () => {
  const { token } = useProfile();
  const { cardId } = useParams({ strict: false });

  const bouts = useGetBouts({ token, cardId });
  const card = useGetCardById({ token, cardId });

  const updateBout = useMutateUpdateBout({ token, cardId });
  const updateCardStatus = useMutateUpdateCardStatus({ token });
  const updateCardJudges = useMutateUpdateCardJudges({ token });
  const updateCard = useMutateUpdateCards({ token });

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
      subTitle={<CardSummary card={card.data} />}
      requiredJudges={Math.max(
        ...(bouts.data?.map((b) => b.numberOfJudges) ?? [5]),
      )}
      breadCrumbs={[{ title: <a href="/">home</a> }, { title: "card" }]}
      action={
        <div style={{ display: "flex", gap: 8 }}>
          <CardExports cardId={cardId!} token={token} />
          <CardActions status={card.data?.status} onStart={start} onEnd={end} />
        </div>
      }
    >
      {card.data && (
        <CardControls
          card={card.data}
          onSetJudges={onSetJudges}
          onPatch={(patch) =>
            updateCard.mutate({
              id: { cardId: String(card.data!.id) },
              toUpdate: patch as never,
            })
          }
        />
      )}
      <NextBout bouts={bouts.data ?? []} cardId={cardId!} />
      <RoutedTabs
        style={{ marginTop: 16 }}
        items={[
          { key: "bouts", label: "Bouts", to: `/card/${cardId}` },
          { key: "roster", label: "Roster", to: `/card/${cardId}/roster` },
          {
            key: "judge-consistency",
            label: "Judge Consistency",
            to: `/card/${cardId}/judge-consistency`,
          },
          {
            key: "activity-log",
            label: "Activity Log",
            to: `/card/${cardId}/activity-log`,
          },
        ]}
      />
      <Outlet />
    </PageLayout>
  );
};

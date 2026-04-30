import { Tabs } from "antd";
import { useParams } from "@tanstack/react-router";
import { useListAthletes } from "../api/athletes";
import { useGetAuditLogs } from "../api/auditLogs";
import {
  useGetBouts,
  useMutateCreateBout,
  useMutateDeleteBout,
  useMutateImportBouts,
  useMutateUpdateBout,
} from "../api/bouts";
import {
  useGetCardById,
  useMutateUpdateCardJudges,
  useMutateUpdateCardStatus,
  useMutateUpdateCards,
} from "../api/cards";
import { useGetBaseUrl, useJudgeDevices, useMutationGenerateCode } from "../api/devices";
import { useGetOfficials } from "../api/officials";
import { CardAuditTimeline } from "../components/auditLogs/CardAuditTimeline";
import { BoutsIndex } from "../components/bouts";
import { NextBout } from "../components/bouts/nextBout";
import { CardActions } from "../components/cards/CardActions";
import { CardControls } from "../components/cards/cardControls";
import { CardExports } from "../components/cards/CardExports";
import { JudgeConsistency } from "../components/cards/JudgeConsistency";
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
  const auditLogs = useGetAuditLogs({ token, cardId });

  const judgeDevices = useJudgeDevices({ token });
  const generateCode = useMutationGenerateCode({ token });
  const { data: baseUrl } = useGetBaseUrl({ token });

  const addBout = useMutateCreateBout({ token, cardId });
  const updateBout = useMutateUpdateBout({ token, cardId });
  const deleteBout = useMutateDeleteBout(cardId, token);
  const importBouts = useMutateImportBouts({ token, cardId });

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
      subTitle={
        <>
          <CardSummary card={card.data} />
          <DeviceQuickLook
            requiredJudges={Math.max(
              ...(bouts.data?.map((b) => b.numberOfJudges) ?? [5]),
            )}
            devices={judgeDevices.data || []}
            baseUrl={baseUrl}
            onRefreshCode={(values) => {
              generateCode.mutate(values);
            }}
          />
        </>
      }
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
      <Tabs
        defaultActiveKey="bouts"
        items={[
          {
            key: "bouts",
            label: "Bouts",
            children: (
              <BoutsIndex
                loading={bouts.isLoading}
                card={card.data}
                bouts={bouts.data}
                officials={officials.data}
                athletes={athletes.data}
                onAddBout={(values) => addBout.mutateAsync(values)}
                onEditBout={(values) => updateBout.mutateAsync(values)}
                onDeleteBout={(boutId) => deleteBout.mutate(boutId)}
                onImport={(file) => importBouts.mutateAsync(file)}
              />
            ),
          },
          {
            key: "judge-consistency",
            label: "Judge Consistency",
            children: <JudgeConsistency cardId={cardId!} token={token} />,
          },
          {
            key: "activity-log",
            label: "Activity Log",
            children: <CardAuditTimeline logs={auditLogs.data ?? []} />,
          },
        ]}
      />
    </PageLayout>
  );
};

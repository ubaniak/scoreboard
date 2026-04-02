import { useParams } from "@tanstack/react-router";
import { Button } from "antd";
import {
  useGetBouts,
  useMutateCreateBout,
  useMutateDeleteBout,
  useMutateImportBouts,
  useMutateUpdateBout,
} from "../api/bouts";
import { useGetCardById, useMutateUpdateCardStatus } from "../api/cards";
import { useJudgeDevices, useMutationGenerateCode } from "../api/devices";
import {
  useGetOfficials,
  useMutateCreateOfficial,
  useMutateImportOfficials,
  useMutateUpdateOfficial,
} from "../api/officials";
import { BoutsIndex } from "../components/bouts";
import { CardSummary } from "../components/cards/summery";
import { JudgeConnectionQuickLook } from "../components/devices/JudgeConnectionQuickLook";
import { OfficialIndex } from "../components/officials";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

type CardActionProps = {
  start: () => void;
};

const CardActions = (props: CardActionProps) => {
  return (
    <div>
      <Button onClick={props.start}>Start</Button>
    </div>
  );
};

export const CardPage = () => {
  const { token } = useProfile();
  const { cardId } = useParams({ strict: false });

  const bouts = useGetBouts({ token, cardId });
  const officials = useGetOfficials({ token, cardId });
  const card = useGetCardById({ token, cardId });

  const judgeDevices = useJudgeDevices({ token });
  const generateCode = useMutationGenerateCode({ token });

  const addBout = useMutateCreateBout({ token, cardId });
  const updateBout = useMutateUpdateBout({ token, cardId });
  const deleteBout = useMutateDeleteBout(cardId, token);
  const importBouts = useMutateImportBouts({ token, cardId });

  const addOfficial = useMutateCreateOfficial({ token, cardId });
  const updateOfficial = useMutateUpdateOfficial({ token, cardId });
  const importOfficials = useMutateImportOfficials({ token, cardId });
  const updateCardStatus = useMutateUpdateCardStatus({ token });

  const start = () => {
    updateCardStatus.mutate({
      id: { cardId },
      status: "in_progress",
    });
  };

  return (
    <PageLayout
      title="Card details"
      subTitle={
        <>
          <CardSummary card={card.data} />
          <JudgeConnectionQuickLook
            requiredJudges={Math.max(...(bouts.data?.map((b) => b.numberOfJudges) ?? [5]))}
            devices={judgeDevices.data || []}
            onRefreshCode={(values) => {
              generateCode.mutate(values);
            }}
          />
        </>
      }
      breadCrumbs={[{ title: <a href="/">home</a> }, { title: "card" }]}
      action={<CardActions start={start} />}
    >
      <BoutsIndex
        loading={bouts.isLoading}
        bouts={bouts.data}
        onAddBout={(values) => {
          addBout.mutate(values);
        }}
        onEditBout={(values) => {
          updateBout.mutate(values);
        }}
        onDeleteBout={(boutId) => deleteBout.mutate(boutId)}
        onImport={(file) => importBouts.mutateAsync(file)}
      />
      <OfficialIndex
        loading={officials.isLoading}
        officials={officials.data}
        onEditOfficial={(values) => {
          updateOfficial.mutate(values);
        }}
        onCreateOfficial={(values) => {
          addOfficial.mutate(values);
        }}
        onImport={(file) => importOfficials.mutate(file)}
      />
    </PageLayout>
  );
};

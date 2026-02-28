import { useParams } from "@tanstack/react-router";
import { Button } from "antd";
import {
  useGetBouts,
  useMutateCreateBout,
  useMutateUpdateBout,
} from "../api/bouts";
import { useGetCardById, useMutateUpdateCardStatus } from "../api/cards";
import { useJudgeDevices, useMutationGenerateCode } from "../api/devices";
import {
  useGetOfficials,
  useMutateCreateOfficial,
  useMutateUpdateOfficial,
} from "../api/officials";
import { BoutsIndex } from "../components/bouts";
import { CardSummary } from "../components/cards/summery";
import { JudgeConnectionQuickLook } from "../components/devices/JudgeConnectionQuickLook";
import { OfficialIndex } from "../components/officials";
import type { Card } from "../entities/cards";
import type { JudgeDevice } from "../entities/device";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

type CardActionProps = {
  card?: Card;
  start: () => void;
  judgeDevices?: JudgeDevice[];
  onRefreshCode: (props: { role: string }) => void;
};

const CardActions = (props: CardActionProps) => {
  return (
    <div>
      <Button onClick={props.start}>Start</Button>
      <JudgeConnectionQuickLook
        requiredJudges={1}
        devices={props.judgeDevices || []}
        onRefreshCode={props.onRefreshCode}
      />
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

  const addOfficial = useMutateCreateOfficial({ token, cardId });
  const updateOfficial = useMutateUpdateOfficial({ token, cardId });
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
      subTitle={<CardSummary card={card.data} />}
      breadCrumbs={[{ title: <a href="/">home</a> }, { title: "card" }]}
      action={
        <CardActions
          card={card.data}
          start={start}
          judgeDevices={judgeDevices.data || []}
          onRefreshCode={(values) => {
            generateCode.mutate(values);
          }}
        />
      }
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
      />
    </PageLayout>
  );
};

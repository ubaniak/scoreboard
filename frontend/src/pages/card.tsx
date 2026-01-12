import { useParams } from "@tanstack/react-router";
import { Button } from "antd";
import {
  useGetBouts,
  useMutateCreateBout,
  useMutateUpdateBout,
} from "../api/bouts";
import { useGetCardById, useMutateUpdateCardStatus } from "../api/cards";
import {
  useGetOfficials,
  useMutateCreateOfficial,
  useMutateUpdateOfficial,
} from "../api/officials";
import { BoutsIndex } from "../components/bouts";
import { CardSummary } from "../components/cards/summery";
import { OfficialIndex } from "../components/officials";
import type { Card } from "../entities/cards";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

type CardActionProps = {
  card?: Card;
  start: () => void;
};

const CardActions = (props: CardActionProps) => {
  if (props.card?.status === "upcoming") {
    return <Button onClick={props.start}>Start</Button>;
  }
  return null;
};

export const CardPage = () => {
  const { token } = useProfile();
  const { cardId } = useParams({ from: "/card/$cardId" });

  const bouts = useGetBouts({ token, cardId });
  const officials = useGetOfficials({ token, cardId });
  const card = useGetCardById({ token, cardId });

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
      action={<CardActions card={card.data} start={start} />}
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

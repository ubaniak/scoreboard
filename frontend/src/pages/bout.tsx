import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  useGetBoutById,
  useGetFouls,
  useGetRound,
  useMutateAddFoul,
  useMutateUpdateBoutStatus,
} from "../api/bouts";
import { useGetCardById } from "../api/cards";
import { isApisLoading } from "../api/handlers";
import { BoutIndex } from "../components/bout";
import { EditBout } from "../components/bouts/edit";
import { CardSummary } from "../components/cards/summery";
import { ApiLoading } from "../components/loading/Apiloading";
import { Modal } from "../components/modal/modal";
import type { Bout } from "../entities/cards";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

const PageActions = ({ bout }: { bout: Bout }) => {
  return (
    <Modal
      button={{ text: "Edit" }}
      modal={{
        title: "Edit Bout",
        body: (close) => (
          // TODO: Handle this better
          <EditBout bout={bout} onClose={close} onSubmit={() => {}} />
        ),
      }}
    />
  );
};

export const BoutPage = () => {
  const { token } = useProfile();
  const { cardId, boutId } = useParams({
    from: "/card/$cardId/bout/$boutId",
  });

  const card = useGetCardById({ token, cardId });
  const bout = useGetBoutById({ token, cardId, boutId });
  const fouls = useGetFouls({ token });

  const [roundNumber, setRoundNumber] = useState(1);
  const round = useGetRound({ token, cardId, boutId, roundNumber });

  const addFoul = useMutateAddFoul({ token, cardId, boutId, roundNumber });
  const nextRound = (currentRound: number) => {
    setRoundNumber(currentRound + 1);
    round.refetch();
  };

  const updateBoutStatus = useMutateUpdateBoutStatus({
    token,
    boutId,
    cardId,
  });

  const previousRound = (currentRound: number) => {
    setRoundNumber(currentRound + 1);
    round.refetch();
  };

  const startBout = () => {
    updateBoutStatus.mutate({ status: "in_progress" });
  };

  const isLoading = isApisLoading({ card, bout, fouls });

  return (
    <PageLayout
      action={<PageActions bout={bout.data!} />}
      title="Bout details"
      subTitle={<CardSummary card={card.data!} />}
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
        controls={{
          startBout,
          nextRound,
          previousRound,
          addFoul: (value) => {
            addFoul.mutate(value);
          },
        }}
      />
    </PageLayout>
  );
};

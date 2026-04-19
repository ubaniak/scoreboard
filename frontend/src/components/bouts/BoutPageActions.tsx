import { useNavigate } from "@tanstack/react-router";
import { useMutateDeleteBout, useMutateUpdateBout } from "../../api/bouts";
import { ActionMenu } from "../actionMenu/actionMenu";
import { ExportBout } from "../bout/export";
import { EditBout } from "./edit";
import type { Bout, Card, Official } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";

type BoutPageActionsProps = {
  bout: Bout;
  card: Card;
  scores: ScoresByRound;
  officials: Official[];
  cardId: string;
  token: string;
};

export const BoutPageActions = ({ bout, card, scores, officials, cardId, token }: BoutPageActionsProps) => {
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
              onSubmit={(toUpdate) => updateBout.mutate({ toUpdate, boutInfo: { boutId: bout.id } })}
              onDelete={() => deleteBout.mutate(bout.id, { onSuccess: () => navigate({ to: `/card/${cardId}` }) })}
            />
          ),
        }}
      />
    </>
  );
};

import { useNavigate } from "@tanstack/react-router";
import { useMutateDeleteBout, useMutateUpdateBout } from "../../api/bouts";
import { ActionMenu } from "../actionMenu/actionMenu";
import { EditBout } from "./edit";
import type { Bout, Official } from "../../entities/cards";

type BoutPageActionsProps = {
  bout: Bout;
  officials: Official[];
  cardId: string;
  token: string;
};

export const BoutPageActions = ({ bout, officials, cardId, token }: BoutPageActionsProps) => {
  const navigate = useNavigate();
  const deleteBout = useMutateDeleteBout(cardId, token);
  const updateBout = useMutateUpdateBout({ token, cardId });

  return (
    <>
      <ActionMenu
        trigger={{ text: "Edit" }}
        content={{
          title: "Edit Bout",
          body: (close) => (
            <EditBout
              bout={bout}
              officials={officials}
              onClose={close}
              onSubmit={(toUpdate) => updateBout.mutateAsync({ toUpdate, boutInfo: { boutId: bout.id } })}
              onDelete={() => deleteBout.mutate(bout.id, { onSuccess: () => navigate({ to: `/card/${cardId}` }) })}
            />
          ),
        }}
      />
    </>
  );
};

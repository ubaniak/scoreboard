import { useNavigate } from "@tanstack/react-router";
import { ActionMenu } from "../actionMenu/actionMenu";
import { EditBoutPanel } from "./EditBoutPanel";
import type { Bout, Official } from "../../entities/cards";
import type { UpdateBoutProps } from "../../api/bouts";

type BoutPageActionsProps = {
  token: string;
  bout: Bout;
  officials: Official[];
  cardId: string;
  onUpdate: (toUpdate: UpdateBoutProps) => Promise<void>;
  onDelete: () => void;
};

export const BoutPageActions = ({
  token,
  bout,
  officials,
  cardId,
  onUpdate,
  onDelete,
}: BoutPageActionsProps) => {
  const navigate = useNavigate();

  return (
    <ActionMenu
      trigger={{ text: "Edit" }}
      content={{
        title: "Edit Bout",
        body: (close) => (
          <EditBoutPanel
            token={token}
            cardId={cardId}
            bout={bout}
            officials={officials}
            onClose={close}
            onSubmit={(toUpdate) => onUpdate(toUpdate)}
            onDelete={() => {
              onDelete();
              navigate({ to: `/card/${cardId}` });
            }}
          />
        ),
      }}
    />
  );
};

import { useNavigate } from "@tanstack/react-router";
import { ActionMenu } from "../actionMenu/actionMenu";
import { EditBout } from "./edit";
import type { Bout, Official } from "../../entities/cards";
import type { UpdateBoutProps } from "../../api/bouts";

type BoutPageActionsProps = {
  bout: Bout;
  officials: Official[];
  cardId: string;
  onUpdate: (toUpdate: UpdateBoutProps["toUpdate"]) => Promise<void>;
  onDelete: () => void;
};

export const BoutPageActions = ({
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
          <EditBout
            bout={bout}
            officials={officials}
            onClose={close}
            onSubmit={(toUpdate) => onUpdate(toUpdate)}
            onDelete={() =>
              onDelete();
              navigate({ to: `/card/${cardId}` });
            }
          />
        ),
      }}
    />
  );
};

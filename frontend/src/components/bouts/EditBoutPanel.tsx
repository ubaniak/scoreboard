import { useMutateAddBoutComment, useMutateDeleteBoutComment, useMutateUpdateBoutComment } from "../../api/comments";
import { useGetBoutById, type UpdateBoutProps } from "../../api/bouts";
import type { Athlete } from "../../api/athletes";
import type { Bout, Official } from "../../entities/cards";
import { EditBout } from "./edit";

export type EditBoutPanelProps = {
  token: string;
  cardId: string;
  bout: Bout;
  officials?: Official[];
  athletes?: Athlete[];
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (values: UpdateBoutProps) => Promise<unknown>;
  onDelete?: () => void;
};

// Bout list rows never carry hydrated comments (avoids an N+1 query on List),
// so this fetches the bout fresh when the edit panel opens rather than
// trusting the row data passed in.
export const EditBoutPanel = (props: EditBoutPanelProps) => {
  const fresh = useGetBoutById({ token: props.token, cardId: props.cardId, boutId: props.bout.id });
  const addComment = useMutateAddBoutComment({ token: props.token, cardId: props.cardId });
  const updateComment = useMutateUpdateBoutComment({ token: props.token, cardId: props.cardId });
  const deleteComment = useMutateDeleteBoutComment({ token: props.token, cardId: props.cardId });

  return (
    <EditBout
      bout={props.bout}
      officials={props.officials}
      athletes={props.athletes}
      comments={fresh.data?.comments ?? []}
      onClose={props.onClose}
      onSubmit={props.onSubmit}
      onDelete={props.onDelete}
      onAddComment={(text) => addComment.mutateAsync({ boutId: props.bout.id, comment: text })}
      onUpdateComment={(commentId, text) =>
        updateComment.mutateAsync({ boutId: props.bout.id, commentId, comment: text })
      }
      onDeleteComment={(commentId) => deleteComment.mutateAsync({ boutId: props.bout.id, commentId })}
    />
  );
};

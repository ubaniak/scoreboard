import { useParams } from "@tanstack/react-router";
import { useListAthletes } from "../../api/athletes";
import {
  useGetBouts,
  useMutateCreateBout,
  useMutateDeleteBout,
  useMutateImportBouts,
  useMutateUpdateBout,
} from "../../api/bouts";
import { useGetCardById } from "../../api/cards";
import { useMutateAddBoutComment } from "../../api/comments";
import { useGetOfficials } from "../../api/officials";
import { BoutsIndex } from "../../components/bouts";
import { useProfile } from "../../providers/login";

export const CardBoutsPage = () => {
  const { token } = useProfile();
  const { cardId } = useParams({ strict: false });

  const bouts = useGetBouts({ token, cardId });
  const officials = useGetOfficials({ token });
  const card = useGetCardById({ token, cardId });
  const athletes = useListAthletes({ token });

  const addBout = useMutateCreateBout({ token, cardId });
  const addBoutComment = useMutateAddBoutComment({ token, cardId });
  const updateBout = useMutateUpdateBout({ token, cardId });
  const deleteBout = useMutateDeleteBout(cardId, token);
  const importBouts = useMutateImportBouts({ token, cardId });

  return (
    <BoutsIndex
      token={token}
      cardId={cardId}
      loading={bouts.isLoading}
      card={card.data}
      bouts={bouts.data}
      officials={officials.data}
      athletes={athletes.data}
      onAddBout={(values) => addBout.mutateAsync(values)}
      onAddBoutComment={(boutId, comment) =>
        addBoutComment.mutateAsync({ boutId: String(boutId), comment })
      }
      onEditBout={(values) => updateBout.mutateAsync(values)}
      onDeleteBout={(boutId) => deleteBout.mutate(boutId)}
      onImport={(file) => importBouts.mutateAsync(file)}
    />
  );
};

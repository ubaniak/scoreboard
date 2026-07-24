import { useParams } from "@tanstack/react-router";
import { useListAthletes } from "../../api/athletes";
import {
  useListRoster,
  useMutateAddToRoster,
  useMutateRemoveFromRoster,
  useMutateSetRosterAvailable,
} from "../../api/roster";
import { RosterIndex } from "../../components/roster";
import { useProfile } from "../../providers/login";

export const CardRosterPage = () => {
  const { token } = useProfile();
  const { cardId } = useParams({ strict: false });

  const roster = useListRoster({ token, cardId });
  const athletes = useListAthletes({ token });

  const addToRoster = useMutateAddToRoster({ token, cardId });
  const removeFromRoster = useMutateRemoveFromRoster({ token, cardId });
  const setRosterAvailable = useMutateSetRosterAvailable({ token, cardId });

  return (
    <RosterIndex
      loading={roster.isLoading}
      entries={roster.data}
      athletes={athletes.data}
      onAdd={(athleteId) => addToRoster.mutateAsync(athleteId)}
      onSetAvailable={(athleteId, available) =>
        setRosterAvailable.mutateAsync({ athleteId, available })
      }
      onRemove={(athleteId) => removeFromRoster.mutateAsync(athleteId)}
    />
  );
};

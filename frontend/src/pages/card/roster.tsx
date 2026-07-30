import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useListAffiliations } from "../../api/affiliations";
import { useListAthletes, useMutateCreateAthlete } from "../../api/athletes";
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
  const affiliations = useListAffiliations({ token });

  const addToRoster = useMutateAddToRoster({ token, cardId });
  const removeFromRoster = useMutateRemoveFromRoster({ token, cardId });
  const setRosterAvailable = useMutateSetRosterAvailable({ token, cardId });
  const createAthlete = useMutateCreateAthlete({ token });

  const allAffiliations = useMemo(() => affiliations.data ?? [], [affiliations.data]);
  const clubOptions = useMemo(
    () => allAffiliations.filter((a) => a.type === "club").map((a) => ({ value: a.id, label: a.name })),
    [allAffiliations],
  );
  const provinceOptions = useMemo(
    () => allAffiliations.filter((a) => a.type === "province").map((a) => ({ value: a.id, label: a.name })),
    [allAffiliations],
  );
  const nationOptions = useMemo(
    () => allAffiliations.filter((a) => a.type === "nation").map((a) => ({ value: a.id, label: a.name })),
    [allAffiliations],
  );

  return (
    <RosterIndex
      loading={roster.isLoading}
      entries={roster.data}
      athletes={athletes.data}
      clubs={clubOptions}
      provinces={provinceOptions}
      nations={nationOptions}
      onAdd={(athleteId) => addToRoster.mutateAsync(athleteId)}
      onAddNewAthlete={async (vals) => {
        const created = await createAthlete.mutateAsync(vals);
        return addToRoster.mutateAsync(created.id);
      }}
      onSetAvailable={(athleteId, available) =>
        setRosterAvailable.mutateAsync({ athleteId, available })
      }
      onRemove={(athleteId) => removeFromRoster.mutateAsync(athleteId)}
    />
  );
};

import { useMemo } from "react";
import { useListAffiliations } from "../../api/affiliations";
import {
  useGetOfficials,
  useMutateCreateOfficial,
  useMutateDeleteOfficial,
  useMutateImportOfficials,
  useMutateUpdateOfficial,
} from "../../api/officials";
import { OfficialIndex } from "../../components/officials";
import { useProfile } from "../../providers/login";

type Option = { value: number; label: string };

export const HomeOfficialsPage = () => {
  const { token } = useProfile();

  const affiliationsQuery = useListAffiliations({ token });
  const officialsQuery = useGetOfficials({ token });
  const createOfficial = useMutateCreateOfficial({ token });
  const updateOfficial = useMutateUpdateOfficial({ token });
  const deleteOfficial = useMutateDeleteOfficial({ token });
  const importOfficials = useMutateImportOfficials({ token });

  const allAffiliations = useMemo(
    () => affiliationsQuery.data ?? [],
    [affiliationsQuery.data],
  );
  const provinceOptions: Option[] = useMemo(
    () => allAffiliations.filter((a) => a.type === "province").map((a) => ({ value: a.id, label: a.name })),
    [allAffiliations],
  );
  const nationOptions: Option[] = useMemo(
    () => allAffiliations.filter((a) => a.type === "nation").map((a) => ({ value: a.id, label: a.name })),
    [allAffiliations],
  );

  return (
    <OfficialIndex
      loading={officialsQuery.isLoading}
      officials={officialsQuery.data}
      provinces={provinceOptions}
      nations={nationOptions}
      onCreateOfficial={(values) => createOfficial.mutateAsync(values)}
      onEditOfficial={(values) => updateOfficial.mutateAsync(values)}
      onDeleteOfficial={(id) => deleteOfficial.mutate(id)}
      onImport={(file) => importOfficials.mutateAsync(file)}
    />
  );
};

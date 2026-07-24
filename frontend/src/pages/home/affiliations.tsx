import { useMemo } from "react";
import {
  useListAffiliations,
  useMutateCreateAffiliation,
  useMutateDeleteAffiliation,
  useMutateImportAffiliations,
  useMutateRemoveAffiliationImage,
  useMutateUpdateAffiliation,
  useMutateUploadAffiliationImage,
} from "../../api/affiliations";
import { AffiliationIndex } from "../../components/affiliations";
import { useProfile } from "../../providers/login";

export const HomeAffiliationsPage = () => {
  const { token } = useProfile();

  const affiliationsQuery = useListAffiliations({ token });
  const createAffiliation = useMutateCreateAffiliation({ token });
  const updateAffiliation = useMutateUpdateAffiliation({ token });
  const deleteAffiliation = useMutateDeleteAffiliation({ token });
  const uploadAffiliationImage = useMutateUploadAffiliationImage({ token });
  const removeAffiliationImage = useMutateRemoveAffiliationImage({ token });
  const importAffiliations = useMutateImportAffiliations({ token });

  const allAffiliations = useMemo(
    () => affiliationsQuery.data ?? [],
    [affiliationsQuery.data],
  );

  return (
    <AffiliationIndex
      affiliations={allAffiliations}
      loading={affiliationsQuery.isLoading}
      onCreate={(vals) => createAffiliation.mutateAsync(vals)}
      onUpdate={(args) => updateAffiliation.mutateAsync(args)}
      onDelete={(id) => deleteAffiliation.mutate(id)}
      onUploadImage={(args) => uploadAffiliationImage.mutateAsync(args)}
      onRemoveImage={(id) => removeAffiliationImage.mutate(id)}
      onImport={(file) => importAffiliations.mutateAsync(file)}
    />
  );
};

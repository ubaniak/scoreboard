import {
  useGetOfficials,
  useMutateCreateOfficial,
  useMutateDeleteOfficial,
  useMutateImportOfficials,
  useMutateUpdateOfficial,
} from "../../api/officials";
import { OfficialIndex } from "../../components/officials";
import { useProfile } from "../../providers/login";

export const HomeOfficialsPage = () => {
  const { token } = useProfile();

  const officialsQuery = useGetOfficials({ token });
  const createOfficial = useMutateCreateOfficial({ token });
  const updateOfficial = useMutateUpdateOfficial({ token });
  const deleteOfficial = useMutateDeleteOfficial({ token });
  const importOfficials = useMutateImportOfficials({ token });

  return (
    <OfficialIndex
      loading={officialsQuery.isLoading}
      officials={officialsQuery.data}
      onCreateOfficial={(values) => createOfficial.mutateAsync(values)}
      onEditOfficial={(values) => updateOfficial.mutateAsync(values)}
      onDeleteOfficial={(id) => deleteOfficial.mutate(id)}
      onImport={(file) => importOfficials.mutateAsync(file)}
    />
  );
};

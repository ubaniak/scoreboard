import { Outlet } from "@tanstack/react-router";
import { useListAffiliations } from "../api/affiliations";
import { useListAthletes } from "../api/athletes";
import {
  useListCards,
  useMutateCreateCards,
  useMutateDeleteCard,
  useMutateImportCard,
  useMutateUpdateCards,
  useMutateUploadCardImage,
  useMutateRemoveCardImage,
} from "../api/cards";
import { useJudgeDevices } from "../api/devices";
import { useGetOfficials } from "../api/officials";
import { CardIndex } from "../components/cards";
import { RoutedTabs } from "../components/shared/RoutedTabs";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

export const HomePage = () => {
  const { token } = useProfile();

  const cards = useListCards({ token });
  const createCard = useMutateCreateCards({ token });
  const updateCard = useMutateUpdateCards({ token });
  const deleteCard = useMutateDeleteCard({ token });
  const uploadCardImage = useMutateUploadCardImage({ token });
  const removeCardImage = useMutateRemoveCardImage({ token });
  const importCard = useMutateImportCard({ token });
  const judgeDevices = useJudgeDevices({ token });

  // Lightweight, read-only fetches just for the tab counts below — the actual
  // listing + mutations for each entity live in their own routed page.
  const affiliationsQuery = useListAffiliations({ token });
  const athletesQuery = useListAthletes({ token });
  const officialsQuery = useGetOfficials({ token });

  return (
    <PageLayout breadCrumbs={[{ title: "Home" }]} title="Home Page">
      <CardIndex
        isLoading={cards.isLoading || cards.isError}
        cards={cards.data}
        judges={judgeDevices.data}
        onCreateCard={(values) => createCard.mutateAsync(values)}
        onUpdateCard={(values) => updateCard.mutateAsync(values)}
        onDeleteCard={(id) => deleteCard.mutate(id)}
        onUploadCardImage={(id, file) => uploadCardImage.mutate({ id, file })}
        onRemoveCardImage={(id) => removeCardImage.mutate(id)}
        onImport={(file) => importCard.mutateAsync(file)}
      />
      <RoutedTabs
        style={{ marginTop: 40 }}
        items={[
          {
            key: "affiliations",
            label: `Affiliations (${affiliationsQuery.data?.length ?? 0})`,
            to: "/",
          },
          {
            key: "athletes",
            label: `Athletes (${athletesQuery.data?.length ?? 0})`,
            to: "/athletes",
          },
          {
            key: "officials",
            label: `Officials (${officialsQuery.data?.length ?? 0})`,
            to: "/officials",
          },
        ]}
      />
      <Outlet />
    </PageLayout>
  );
};

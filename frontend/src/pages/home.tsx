import {
  useListCards,
  useMutateCreateCards,
  useMutateUpdateCards,
} from "../api/cards";
import { CardIndex } from "../components/cards";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

export const HomePage = () => {
  const profile = useProfile();
  const cards = useListCards({ token: profile.token });

  const createCard = useMutateCreateCards({ token: profile.token });
  const updateCard = useMutateUpdateCards({ token: profile.token });

  return (
    <PageLayout breadCrumbs={[{ title: "home" }]} title="Home page">
      <CardIndex
        isLoading={cards.isLoading || cards.isError}
        cards={cards.data}
        onCreateCard={(values) => {
          createCard.mutate(values);
        }}
        onUpdateCard={(values) => {
          updateCard.mutate(values);
        }}
      />
    </PageLayout>
  );
};

import { useParams } from "@tanstack/react-router";
import { PageLayout } from "../layouts/page";
import { ShowBout } from "../components/bouts/show";

export const BoutPage = () => {
  const { cardId, boutId } = useParams({
    from: "/card/$cardId/bout/$boutId",
  });

  return (
    <PageLayout title={`Bout: ${boutId} ${cardId}`}>
      <ShowBout boutId={boutId} cardId={cardId} />
    </PageLayout>
  );
};

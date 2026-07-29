import { useParams } from "@tanstack/react-router";
import { CardExports } from "../../components/cards/CardExports";
import { useProfile } from "../../providers/login";

export const CardReportsPage = () => {
  const { token } = useProfile();
  const { cardId } = useParams({ strict: false });

  return <CardExports cardId={cardId!} token={token} />;
};

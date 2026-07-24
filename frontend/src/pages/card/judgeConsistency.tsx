import { useParams } from "@tanstack/react-router";
import { JudgeConsistency } from "../../components/cards/JudgeConsistency";
import { useProfile } from "../../providers/login";

export const CardJudgeConsistencyPage = () => {
  const { token } = useProfile();
  const { cardId } = useParams({ strict: false });

  return <JudgeConsistency cardId={cardId!} token={token} />;
};

import { Empty } from "antd";
import type { Round, RoundDetails } from "../../entities/cards";
import { RoundControls } from "./controls";
import { useGetRound } from "../../api/bouts";
import { useProfile } from "../../providers/login";

export type ShowRoundProps = {
  cardId: string;
  boutId: string;
  round: Round;
};

export const ShowRound = (props: ShowRoundProps) => {
  const profile = useProfile();

  const { data: roundDetails, isLoading } = useGetRound(
    props.cardId,
    props.boutId,
    props.round.roundNumber,
    profile.token
  );

  if (isLoading) {
    return <>loading</>;
  }

  if (props.round.status === "not_started") {
    return <Empty description="round has not started" />;
  }

  return (
    <>
      <RoundControls
        cardId={props.cardId}
        boutId={props.boutId}
        roundNumber={props.round.roundNumber}
        roundDetails={roundDetails?.data || ({} as RoundDetails)}
      />
    </>
  );
};

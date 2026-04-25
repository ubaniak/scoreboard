import { Button, Flex, Select } from "antd";
import type {
  MakeDecisionProps,
  MutateEightCountProps,
  MutateHandleFoulProps,
} from "../../api/bouts";
import type { Bout, Official, RoundDetails } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import { Card } from "../card/card";
import { RoundIndex } from "../round";
import { Scores } from "../score/scores";
import { Show } from "../show/show";
import { DescribeBout } from "./describe";

export type Controls = {
  onNextRoundState: () => void;
  setRound: (currentRound: number) => void;
  handleFoul: (props: MutateHandleFoulProps) => void;
  handleEightCount: (props: MutateEightCountProps) => void;
  onStartBout: () => void;
  onMakeDecision: (props: MakeDecisionProps) => void;
  onShowDecision: () => void;
  onSetReferee: (name: string) => void;
  onCompleteBout: () => void;
};

export type BoutIndexProps = {
  fouls?: string[];
  bout?: Bout;
  round?: RoundDetails;
  scores?: ScoresByRound;
  isLoading?: boolean;
  loadingComponent?: React.ReactNode | null;
  officials?: Official[];
  controls: Controls;
};

export const BoutIndex = (props: BoutIndexProps) => {
  if (props.isLoading && props.loadingComponent) {
    return <>{props.loadingComponent}</>;
  }

  const isReady = props.bout?.status !== "not_started";
  const isFinished =
    props.bout?.status === "completed" || props.bout?.status === "cancelled";

  return (
    <>
      <DescribeBout
        bout={props.bout}
        onSetRound={props.controls.setRound}
        activeRoundNumber={props.round?.roundNumber}
      />

      <Show show={!isReady}>
        <Card>
          <Flex vertical align="center" justify="center" gap="middle">
            {props.bout?.boutType !== "sparring" && (
              <Select
                style={{ width: 240 }}
                placeholder="Select referee..."
                value={props.bout?.referee || undefined}
                options={(props.officials ?? []).map((o) => ({
                  value: o.name,
                  label: o.name,
                }))}
                onChange={(name) => props.controls.onSetReferee(name)}
                allowClear
              />
            )}
            <Button onClick={() => props.controls.onStartBout()}>
              Start Bout
            </Button>
          </Flex>
        </Card>
      </Show>

      <Show show={isReady && !isFinished}>
        <RoundIndex
          controls={props.controls}
          round={props.round}
          fouls={props.fouls || []}
          rounds={props.bout?.rounds}
          scores={props.scores}
          length={props.bout?.roundLength || 0}
          boutStatus={props.bout?.status}
          handleFoul={props.controls.handleFoul}
          handleEightCount={props.controls.handleEightCount}
          onChange={props.controls.setRound}
        />
      </Show>

      <Show show={isReady}>
        <Scores
          scores={props.scores ?? {}}
          currentRound={props.round?.roundNumber}
          rounds={props.bout?.rounds}
          boutStatus={props.bout?.status}
          isAdmin
        />
      </Show>
    </>
  );
};

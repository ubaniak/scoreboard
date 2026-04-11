import { Button, Flex, Select } from "antd";
import type {
  EndBoutProps,
  MutateEightCountProps,
  MutateHandleFoulProps,
} from "../../api/bouts";
import type { Bout, RoundDetails } from "../../entities/cards";
import type { Official } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import { Card } from "../card/card";
import { RoundIndex } from "../round";
import { Scores } from "../score/scores";
import { Show } from "../show/show";
import { CornerInfo } from "./cornerInfo";
import { DescribeBout } from "./describe";

export type Controls = {
  onNextRoundState: () => void;
  setRound: (currentRound: number) => void;
  handleFoul: (props: MutateHandleFoulProps) => void;
  handleEightCount: (props: MutateEightCountProps) => void;
  onStartBout: () => void;
  onEndBout: (props: EndBoutProps) => void;
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
  return (
    <>
      <DescribeBout bout={props.bout} />

      <CornerInfo bout={props.bout} />

      <Show show={!isReady}>
        <Card>
          <Flex vertical align="center" justify="center" gap="middle">
            {props.bout?.boutType !== "sparring" && (
              <Select
                style={{ width: 240 }}
                placeholder="Select referee..."
                value={props.bout?.referee || undefined}
                options={(props.officials ?? []).map((o) => ({ value: o.name, label: o.name }))}
                onChange={(name) => props.controls.onSetReferee(name)}
                allowClear
              />
            )}
            {props.bout?.boutType === "scored" && (() => {
              const round1Scores = props.scores?.[1] ?? [];
              const allReady = round1Scores.length > 0 && round1Scores.every(s => s.status && s.status !== "not_started");
              return !allReady ? (
                <span style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
                  Waiting for all judges to check in…
                </span>
              ) : null;
            })()}
            <Button onClick={() => props.controls.onStartBout()}>
              Start Bout
            </Button>
          </Flex>
        </Card>
      </Show>

      <Show show={props.bout?.status === "decision_made"}>
        <Card>
          <Flex align="center" justify="center">
            <Button type="primary" onClick={() => props.controls.onCompleteBout()}>
              Complete Bout
            </Button>
          </Flex>
        </Card>
      </Show>

      <Show show={isReady}>
        <RoundIndex
          controls={props.controls}
          round={props.round}
          fouls={props.fouls || []}
          rounds={props.bout?.rounds}
          scores={props.scores}
          length={props.bout?.roundLength || 0}
          handleFoul={props.controls.handleFoul}
          handleEightCount={props.controls.handleEightCount}
          onChange={props.controls.setRound}
        />
      </Show>
      <Scores scores={props.scores ?? {}} rounds={props.bout?.rounds} />
    </>
  );
};

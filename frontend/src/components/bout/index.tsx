import { Button, Flex } from "antd";
import type {
  EndBoutProps,
  MutateEightCountProps,
  MutateHandleFoulProps,
} from "../../api/bouts";
import type { Bout, RoundDetails } from "../../entities/cards";
import { Card } from "../card/card";
import { RoundIndex } from "../round";
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
};

export type BoutIndexProps = {
  fouls?: string[];
  bout?: Bout;
  round?: RoundDetails;
  isLoading?: boolean;
  loadingComponent?: React.ReactNode | null;
  controls: Controls;
};
export const BoutIndex = (props: BoutIndexProps) => {
  if (props.isLoading && props.loadingComponent) {
    return <>{props.loadingComponent}</>;
  }

  const isReady = props.bout?.status !== "not_started" || false;
  return (
    <>
      <DescribeBout bout={props.bout} />

      <CornerInfo bout={props.bout} />

      <Show show={!isReady}>
        <Card>
          <Flex align="center" justify="center">
            <Button
              onClick={() => {
                props.controls.onStartBout();
              }}
            >
              Start Bout
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
          // length={props.bout?.roundLength || 0}
          length={0.2}
          handleFoul={props.controls.handleFoul}
          handleEightCount={props.controls.handleEightCount}
          onChange={props.controls.setRound}
        />
      </Show>
    </>
  );
};

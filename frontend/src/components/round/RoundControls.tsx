import { StopOutlined, TrophyOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";
import type { MakeDecisionProps } from "../../api/bouts";
import type { RoundDetails } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import { ActionMenu } from "../actionMenu/actionMenu";
import { MakeDecision } from "../bouts/end";
import { Card } from "../card/card";

type RoundControlsProps = {
  isDecisionPhase: boolean;
  boutStatus?: string;
  roundStatus?: string;
  scores?: ScoresByRound;
  rounds?: RoundDetails[];
  onNextRoundState: () => void;
  onMakeDecision: (props: MakeDecisionProps) => void;
  onShowDecision: () => void;
  onCompleteBout: () => void;
};

const accentColor = (roundStatus?: string) => {
  if (roundStatus === "in_progress") return "#1677ff";           // blue
  if (roundStatus === "waiting_for_results") return "#faad14";   // yellow
  if (roundStatus === "score_complete") return "#95de64";        // light green
  if (roundStatus === "complete") return "#52c41a";              // green
  return "#ff4d4f";                                              // red — ready/locked
};

export const RoundControls = ({
  isDecisionPhase,
  boutStatus,
  roundStatus,
  scores,
  rounds,
  onNextRoundState,
  onMakeDecision,
  onShowDecision,
  onCompleteBout,
}: RoundControlsProps) => (
  <Card
    style={{
      borderTop: `3px solid ${accentColor(roundStatus)}`,
    }}
  >
    <Space size={12} style={{ display: "flex", justifyContent: "center" }}>
      {!isDecisionPhase && (
        <Button type="primary" size="large" onClick={onNextRoundState}>
          Advance Round State
        </Button>
      )}
      {isDecisionPhase && (
        <ActionMenu
          menuOpen={boutStatus === "waiting_for_decision"}
          width={1200}
          trigger={{
            override: (onOpen) => (
              <Button size="large" type="primary" icon={<TrophyOutlined />} onClick={onOpen}>
                Make Decision
              </Button>
            ),
          }}
          content={{
            title: "Final Decision",
            body: (close) => (
              <MakeDecision
                onClose={close}
                onMakeDecision={onMakeDecision}
                onShowDecision={onShowDecision}
                onComplete={onCompleteBout}
                scores={scores}
                rounds={rounds}
              />
            ),
          }}
        />
      )}
      <ActionMenu
        menuOpen={false}
        width={1200}
        trigger={{
          override: (onOpen) => (
            <Button size="large" danger icon={<StopOutlined />} onClick={onOpen}>
              End Bout
            </Button>
          ),
        }}
        content={{
          title: "End bout",
          body: (close) => (
            <MakeDecision
              onClose={close}
              onMakeDecision={onMakeDecision}
              onShowDecision={onShowDecision}
              onComplete={onCompleteBout}
              scores={scores}
              rounds={rounds}
            />
          ),
        }}
      />
    </Space>
  </Card>
);

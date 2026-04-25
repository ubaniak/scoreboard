import { Col, Row } from "antd";
import { useEffect, useState } from "react";
import type {
  MakeDecisionProps,
  MutateEightCountProps,
  MutateHandleFoulProps,
} from "../../api/bouts";
import type { RoundDetails } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import { CornerControls } from "../bout/cornerControls";
import { Card } from "../card/card";
import { RoundControls } from "./RoundControls";

const statusLabel = (status: RoundDetails["status"]) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export type RoundIndexProps = {
  round?: RoundDetails;
  rounds?: RoundDetails[];
  scores?: ScoresByRound;
  length: number;
  boutStatus?: string;
  onChange: (roundNumber: number) => void;
  fouls: string[];
  handleFoul: (props: MutateHandleFoulProps) => void;
  handleEightCount: (props: MutateEightCountProps) => void;
  controls: {
    onNextRoundState: () => void;
    onMakeDecision: (props: MakeDecisionProps) => void;
    onShowDecision: () => void;
    onCompleteBout: () => void;
  };
};

export const RoundIndex = (props: RoundIndexProps) => {
  const currentRound = props.round?.roundNumber || 1;
  const [selectedRound, setSelectedRound] = useState(currentRound - 1);

  useEffect(() => {
    setSelectedRound(currentRound - 1);
  }, [currentRound]);

  const isRound3 = props.round?.roundNumber === 3;
  const isDecisionPhase =
    props.boutStatus === "waiting_for_decision" ||
    props.boutStatus === "decision_made" ||
    props.boutStatus === "show_decision" ||
    (isRound3 && props.boutStatus === "score_complete");

  const viewingRound = (props.rounds || [])[selectedRound];

  return (
    <>
      <RoundControls
        isDecisionPhase={isDecisionPhase}
        boutStatus={props.boutStatus}
        roundStatus={viewingRound?.status}
        scores={props.scores}
        rounds={props.rounds}
        onNextRoundState={props.controls.onNextRoundState}
        onMakeDecision={props.controls.onMakeDecision}
        onShowDecision={props.controls.onShowDecision}
        onCompleteBout={props.controls.onCompleteBout}
      />

      <Card>
        {viewingRound && (
          <Row justify="center" style={{ margin: "4px 0 20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>
                Round {viewingRound.roundNumber}
              </div>
              <div
                style={{
                  fontSize: 13,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  opacity: 0.5,
                  marginTop: 4,
                }}
              >
                {statusLabel(viewingRound.status)}
              </div>
            </div>
          </Row>
        )}
        {props.rounds && (
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <CornerControls
                corner="red"
                allFouls={props.fouls}
                handleFoul={props.handleFoul}
                handleEightCount={props.handleEightCount}
                warnings={props.rounds[selectedRound].red.warnings}
                cautions={props.rounds[selectedRound].red.cautions}
                eightCounts={props.rounds[selectedRound].red.eightCounts}
              />
            </Col>
            <Col xs={24} md={12}>
              <CornerControls
                corner="blue"
                allFouls={props.fouls}
                handleFoul={props.handleFoul}
                handleEightCount={props.handleEightCount}
                warnings={props.rounds[selectedRound].blue.warnings}
                cautions={props.rounds[selectedRound].blue.cautions}
                eightCounts={props.rounds[selectedRound].blue.eightCounts}
              />
            </Col>
          </Row>
        )}
      </Card>
    </>
  );
};

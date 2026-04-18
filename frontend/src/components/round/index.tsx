import {
  CheckOutlined,
  LoadingOutlined,
  LockOutlined,
  PlayCircleOutlined,
  StopOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Button, Col, Row, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import type {
  MakeDecisionProps,
  MutateEightCountProps,
  MutateHandleFoulProps,
} from "../../api/bouts";
import type { RoundDetails } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import { ActionMenu } from "../actionMenu/actionMenu";
import { CornerControls } from "../bout/cornerControls";
import { MakeDecision } from "../bouts/end";
import { Card } from "../card/card";

const { Text } = Typography;

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

const statusIcon = (status: RoundDetails["status"]) => {
  if (status === "waiting_for_results") return <LoadingOutlined />;
  if (status === "in_progress" || status === "score_complete")
    return <PlayCircleOutlined />;
  if (status === "complete") return <CheckOutlined />;
  return <LockOutlined />;
};

const statusLabel = (status: RoundDetails["status"]) =>
  status.replace(/_/g, " ");

const isActive = (status: RoundDetails["status"]) =>
  status === "in_progress" ||
  status === "waiting_for_results" ||
  status === "score_complete";

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
      {/* Round selector */}
      <Row gutter={[12, 12]} style={{ marginBottom: 8 }}>
        {(props.rounds || []).map((r, i) => {
          const active = isActive(r.status);
          const selected = selectedRound === i;
          const complete = r.status === "complete";
          return (
            <Col key={r.roundNumber} xs={8}>
              <div
                onClick={() => {
                  setSelectedRound(i);
                  props.onChange(r.roundNumber);
                }}
                style={{
                  cursor: "pointer",
                  borderRadius: 12,
                  padding: "12px 16px",
                  border: selected
                    ? "2px solid #1677ff"
                    : active
                      ? "2px solid rgba(255,255,255,0.25)"
                      : "2px solid rgba(255,255,255,0.08)",
                  background: active
                    ? "rgba(22,119,255,0.12)"
                    : selected
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(255,255,255,0.02)",
                  transition: "all 0.2s",
                }}
              >
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Space
                    style={{ justifyContent: "space-between", width: "100%" }}
                  >
                    <Text style={{ fontWeight: 700, fontSize: 14 }}>
                      Round {r.roundNumber}
                    </Text>
                    <span
                      style={{
                        color: complete
                          ? "#52c41a"
                          : active
                            ? "#1677ff"
                            : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {statusIcon(r.status)}
                    </span>
                  </Space>
                  <Text
                    style={{
                      fontSize: 11,
                      textTransform: "capitalize",
                      color: active
                        ? "#1677ff"
                        : complete
                          ? "#52c41a"
                          : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {statusLabel(r.status)}
                  </Text>
                </Space>
              </div>
            </Col>
          );
        })}
      </Row>

      <Card>
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          {!isDecisionPhase && (
            <Button size="large" onClick={props.controls.onNextRoundState}>
              Advance Round State
            </Button>
          )}
          {isDecisionPhase && (
            <ActionMenu
              menuOpen={props.boutStatus === "waiting_for_decision"}
              width={1200}
              trigger={{
                override: (onOpen) => (
                  <Button
                    size="large"
                    type="primary"
                    icon={<TrophyOutlined />}
                    onClick={onOpen}
                  >
                    Make Decision
                  </Button>
                ),
              }}
              content={{
                title: "Final Decision",
                body: (close) => (
                  <MakeDecision
                    onClose={close}
                    onMakeDecision={(values) =>
                      props.controls.onMakeDecision(values)
                    }
                    onShowDecision={props.controls.onShowDecision}
                    onComplete={props.controls.onCompleteBout}
                    scores={props.scores}
                    rounds={props.rounds}
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
                <Button
                  size="large"
                  danger
                  icon={<StopOutlined />}
                  onClick={onOpen}
                >
                  End Bout
                </Button>
              ),
            }}
            content={{
              title: "End bout",
              body: (close) => (
                <MakeDecision
                  onClose={close}
                  onMakeDecision={(values) =>
                    props.controls.onMakeDecision(values)
                  }
                  onShowDecision={props.controls.onShowDecision}
                  onComplete={props.controls.onCompleteBout}
                  scores={props.scores}
                  rounds={props.rounds}
                />
              ),
            }}
          />
        </div>
      </Card>

      <Card>
        {viewingRound && (
          <Row justify="center" style={{ margin: "4px 0 12px" }}>
            <Text
              style={{
                fontWeight: 600,
                fontSize: 16,
                textTransform: "capitalize",
              }}
            >
              Round {viewingRound.roundNumber} —{" "}
              {statusLabel(viewingRound.status)}
            </Text>
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

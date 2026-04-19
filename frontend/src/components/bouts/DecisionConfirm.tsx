import { CheckCircleOutlined } from "@ant-design/icons";
import { Button, Space, Typography } from "antd";
import { useState } from "react";
import type { MakeDecisionProps } from "../../api/bouts";
import type { RoundDetails } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import { Scores } from "../score/scores";
import { decisionLabels } from "./decisionLabels";

const { Text } = Typography;

type DecisionConfirmProps = {
  submitted: MakeDecisionProps;
  scores?: ScoresByRound;
  rounds?: RoundDetails[];
  onShowDecision: () => void;
  onComplete: () => void;
  onClose: () => void;
};

export const DecisionConfirm = ({ submitted, scores, rounds, onShowDecision, onComplete, onClose }: DecisionConfirmProps) => {
  const [shown, setShown] = useState(false);

  const winnerLabel =
    submitted.winner === "red" ? "Red Corner" : submitted.winner === "blue" ? "Blue Corner" : "No Winner";
  const decisionLabel = decisionLabels[submitted.decision] ?? submitted.decision;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {scores && <Scores scores={scores} rounds={rounds} boutStatus="waiting_for_scores" isAdmin />}

      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: "24px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 11, letterSpacing: 3, opacity: 0.5, textTransform: "uppercase" }}>
          Decision Recorded
        </Text>
        <div style={{ display: "flex", gap: 32, alignItems: "baseline" }}>
          <div>
            <Text style={{ fontSize: 11, opacity: 0.45, display: "block", marginBottom: 4 }}>Winner</Text>
            <Text style={{ fontSize: 22, fontWeight: 700 }}>{winnerLabel}</Text>
          </div>
          {decisionLabel && (
            <div>
              <Text style={{ fontSize: 11, opacity: 0.45, display: "block", marginBottom: 4 }}>Method</Text>
              <Text style={{ fontSize: 22, fontWeight: 700 }}>{decisionLabel}</Text>
            </div>
          )}
        </div>
        {submitted.comment && (
          <div>
            <Text style={{ fontSize: 11, opacity: 0.45, display: "block", marginBottom: 4 }}>Comment</Text>
            <Text style={{ opacity: 0.8 }}>{submitted.comment}</Text>
          </div>
        )}
      </div>

      <Space>
        <Button
          size="large"
          type={shown ? "default" : "primary"}
          icon={shown ? <CheckCircleOutlined /> : undefined}
          onClick={(e) => { setShown(true); onShowDecision(); e.stopPropagation(); }}
        >
          {shown ? "Showing on Scoreboard" : "Show Decision on Scoreboard"}
        </Button>
        <Button
          size="large"
          danger
          onClick={(e) => { e.stopPropagation(); onComplete(); onClose(); }}
        >
          End Bout
        </Button>
      </Space>
    </div>
  );
};

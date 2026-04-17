import {
  Button,
  Form,
  Input,
  Segmented,
  Select,
  Space,
  Typography,
  type FormProps,
} from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { RoundDetails } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import { Scores } from "../score/scores";
import type { MakeDecisionProps } from "../../api/bouts";

const { Text } = Typography;

const decisionLabels: Record<string, string> = {
  ud: "Unanimous Decision",
  sd: "Split Decision",
  md: "Majority Decision",
  rsc: "Referee Stop Contest",
  "rsc-i": "Referee Stop Contest (Injury)",
  abd: "Abandon",
  dq: "Disqualified",
  c: "Cancelled",
  wo: "Walk Over",
};

export type MakeDecisionFormProps = {
  onClose: () => void;
  onMakeDecision: (values: MakeDecisionProps) => void;
  onShowDecision: () => void;
  onComplete: () => void;
  scores?: ScoresByRound;
  rounds?: RoundDetails[];
};

export const MakeDecision = (props: MakeDecisionFormProps) => {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [submitted, setSubmitted] = useState<MakeDecisionProps | null>(null);
  const [shown, setShown] = useState(false);

  const onFinish: FormProps<MakeDecisionProps>["onFinish"] = async (values) => {
    console.log("hi");
    props.onMakeDecision(values);
    setSubmitted(values);
    setStep("confirm");
  };

  if (step === "confirm" && submitted) {
    const winnerLabel =
      submitted.winner === "red"
        ? "Red Corner"
        : submitted.winner === "blue"
          ? "Blue Corner"
          : "No Winner";
    const decisionLabel =
      decisionLabels[submitted.decision] ?? submitted.decision;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {props.scores && (
          <Scores
            scores={props.scores}
            rounds={props.rounds}
            boutStatus="waiting_for_scores"
          />
        )}

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
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 3,
              opacity: 0.5,
              textTransform: "uppercase",
            }}
          >
            Decision Recorded
          </Text>
          <div style={{ display: "flex", gap: 32, alignItems: "baseline" }}>
            <div>
              <Text
                style={{
                  fontSize: 11,
                  opacity: 0.45,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Winner
              </Text>
              <Text style={{ fontSize: 22, fontWeight: 700 }}>
                {winnerLabel}
              </Text>
            </div>
            {decisionLabel && (
              <div>
                <Text
                  style={{
                    fontSize: 11,
                    opacity: 0.45,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Method
                </Text>
                <Text style={{ fontSize: 22, fontWeight: 700 }}>
                  {decisionLabel}
                </Text>
              </div>
            )}
          </div>
          {submitted.comment && (
            <div>
              <Text
                style={{
                  fontSize: 11,
                  opacity: 0.45,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Comment
              </Text>
              <Text style={{ opacity: 0.8 }}>{submitted.comment}</Text>
            </div>
          )}
        </div>

        <Space>
          <Button
            size="large"
            type={shown ? "default" : "primary"}
            icon={shown ? <CheckCircleOutlined /> : undefined}
            onClick={() => {
              setShown(true);
              props.onShowDecision();
            }}
          >
            {shown ? "Showing on Scoreboard" : "Show Decision on Scoreboard"}
          </Button>
          <Button
            size="large"
            danger
            onClick={() => {
              props.onComplete();
              props.onClose();
            }}
          >
            End Bout
          </Button>
        </Space>
      </div>
    );
  }

  return (
    <>
      {props.scores && (
        <Scores
          scores={props.scores}
          rounds={props.rounds}
          boutStatus="waiting_for_scores"
        />
      )}
      <Form
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        initialValues={{
          boutNumber: 0,
          redCorner: "",
          blueCorner: "",
          ageCategory: "",
          gender: "male",
          experience: "novice",
        }}
        style={{ maxWidth: 600 }}
        onFinish={onFinish}
      >
        <Form.Item label="Overall Winner" name="winner">
          <Segmented
            size={"large"}
            shape="round"
            options={[
              { value: "na", label: "None" },
              { value: "red", label: "Red" },
              { value: "blue", label: "Blue" },
            ]}
          />
        </Form.Item>
        <Form.Item label="Decision" name="decision">
          <Select
            placeholder="Select decision"
            options={Object.entries(decisionLabels).map(([value, label]) => ({
              value,
              label,
            }))}
            style={{ width: 280 }}
          />
        </Form.Item>
        <Form.Item label="Comment" name="comment">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item label={null}>
          <Space>
            <Button type="text" onClick={props.onClose}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
};

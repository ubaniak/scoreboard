import {
  Button,
  Form,
  Input,
  Segmented,
  Select,
  Space,
  type FormProps,
} from "antd";
import { useState } from "react";
import type { RoundDetails } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import { Scores } from "../score/scores";
import type { MakeDecisionProps } from "../../api/bouts";
import { DecisionConfirm } from "./DecisionConfirm";
import { decisionLabels } from "./decisionLabels";

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

  const onFinish: FormProps<MakeDecisionProps>["onFinish"] = async (values) => {
    props.onMakeDecision(values);
    setSubmitted(values);
    setStep("confirm");
  };

  if (step === "confirm" && submitted) {
    return (
      <DecisionConfirm
        submitted={submitted}
        scores={props.scores}
        rounds={props.rounds}
        onShowDecision={props.onShowDecision}
        onComplete={props.onComplete}
        onClose={props.onClose}
      />
    );
  }

  return (
    <>
      {props.scores && (
        <Scores
          scores={props.scores}
          rounds={props.rounds}
          boutStatus="waiting_for_scores"
          isAdmin
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
          winner: "na",
        }}
        style={{ maxWidth: 600 }}
        onFinish={onFinish}
      >
        <Form.Item label="Overall Winner" name="winner" rules={[{ required: true, message: "Winner is required" }]}>
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
        <Form.Item label="Decision" name="decision" rules={[{ required: true, message: "Decision is required" }]}>
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

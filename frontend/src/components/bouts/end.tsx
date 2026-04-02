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
import type { EndBoutProps } from "../../api/bouts";
import type { RoundDetails } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import { Scores } from "../score/scores";

export type EndBoutFormProps = {
  onClose: () => void;
  onSubmit: (values: EndBoutProps) => void;
  scores?: ScoresByRound;
  rounds?: RoundDetails[];
};
export const EndBout = (props: EndBoutFormProps) => {
  const onFinish: FormProps<EndBoutProps>["onFinish"] = async (values) => {
    props.onSubmit(values);
    props.onClose();
  };
  const [decision, setDecision] = useState<string | null>();
  return (
    <>
      {props.scores && (
        <Scores scores={props.scores} rounds={props.rounds} />
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
          value={decision || ""}
          onChange={(values) => setDecision(values.at(-1) || null)}
          options={[
            { value: "ud", label: "Unanimous Decision" },
            { value: "sd", label: "Split Decision" },
            { value: "md", label: "Majority Decision" },
            { value: "rsc", label: "Referee stop contest" },
            { value: "rsc-i", label: "Referee stop contest due to injury" },
            { value: "abd", label: "Abandon" },
            { value: "dq", label: "Disqualified" },
            { value: "c", label: "Cancelled" },
            { value: "wo", label: "Walk over" },
          ]}
          style={{ width: 220 }}
          tokenSeparators={[","]}
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

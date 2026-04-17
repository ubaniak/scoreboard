import {
  Button,
  Form,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  type FormProps,
} from "antd";
import type { CreateBoutProps } from "../../api/bouts";
import type { Athlete } from "../../api/athletes";

export type AddBoutProps = {
  onClose: () => void;
  onSubmit: (values: CreateBoutProps) => void;
  athletes?: Athlete[];
};

export const AddBout = (props: AddBoutProps) => {
  const athleteOptions = (props.athletes ?? []).map((a) => ({
    value: a.id,
    label: a.clubName ? `${a.name} (${a.clubName})` : a.name,
  }));

  const onFinish: FormProps<CreateBoutProps>["onFinish"] = async (values) => {
    props.onSubmit(values);
    props.onClose();
  };

  return (
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
        boutType: "scored",
      }}
      style={{ maxWidth: 600 }}
      onFinish={onFinish}
    >
      <Form.Item<CreateBoutProps> label="Bout Type" name="boutType">
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: "sparring", label: "Sparring" },
            { value: "developmental", label: "Developmental" },
            { value: "scored", label: "Scored" },
          ]}
        />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Bout Number" name="boutNumber">
        <InputNumber />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Red Athlete" name="redAthleteId">
        <Select options={athleteOptions} allowClear showSearch optionFilterProp="label" placeholder="Select athlete..." />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Red" name="redCorner">
        <Input />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Blue Athlete" name="blueAthleteId">
        <Select options={athleteOptions} allowClear showSearch optionFilterProp="label" placeholder="Select athlete..." />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Blue" name="blueCorner">
        <Input />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Age Cat" name="ageCategory">
        <Select
          options={[
            { value: "juniorA", label: "Junior A" },
            { value: "juniorB", label: "Junior B" },
            { value: "juniorC", label: "Junior C" },
            { value: "youth", label: "youth" },
            { value: "elite", label: "Elite" },
            { value: "masters", label: "Masters" },
          ]}
        />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Gender" name="gender">
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Experience" name="experience">
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: "novice", label: "Novice" },
            { value: "open", label: "Open" },
          ]}
        />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Referee" name="referee">
        <Input />
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
  );
};

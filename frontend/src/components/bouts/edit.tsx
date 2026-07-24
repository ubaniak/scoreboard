import { DeleteOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Form,
  InputNumber,
  Popconfirm,
  Segmented,
  Select,
  Space,
  type FormProps,
} from "antd";
import { useEffect } from "react";
import type { UpdateBoutProps } from "../../api/bouts";
import type { Athlete } from "../../api/athletes";
import type { Bout, Official } from "../../entities/cards";
import { matchWarnings } from "./matchCompatibility";

export type EditBoutProps = {
  bout: Bout;
  officials?: Official[];
  athletes?: Athlete[];
  availableAthleteIds?: number[];
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (values: UpdateBoutProps) => Promise<unknown>;
  onDelete?: () => void;
};

export const EditBout = (props: EditBoutProps) => {
  const officialOptions = (props.officials ?? []).map((o) => ({
    value: o.name,
    label: o.name,
  }));

  const availableSet = new Set(props.availableAthleteIds ?? []);
  // Each corner's own current assignment stays selectable even if it's no longer
  // roster-available, so editing a bout doesn't force the corner to appear empty.
  const redAthleteOptions = (props.athletes ?? [])
    .filter((a) => availableSet.has(a.id) || a.id === props.bout.redAthleteId)
    .map((a) => ({ value: a.id, label: a.clubName ? `${a.name} (${a.clubName})` : a.name }));
  const blueAthleteOptions = (props.athletes ?? [])
    .filter((a) => availableSet.has(a.id) || a.id === props.bout.blueAthleteId)
    .map((a) => ({ value: a.id, label: a.clubName ? `${a.name} (${a.clubName})` : a.name }));

  const [form] = Form.useForm<Bout>();
  const boutType = Form.useWatch("boutType", form);
  const isScored = !boutType || boutType === "scored";

  const redAthleteId = Form.useWatch("redAthleteId", form);
  const blueAthleteId = Form.useWatch("blueAthleteId", form);
  const redAthlete = (props.athletes ?? []).find((a) => a.id === redAthleteId);
  const blueAthlete = (props.athletes ?? []).find((a) => a.id === blueAthleteId);
  const warnings = matchWarnings(redAthlete, blueAthlete);

  useEffect(() => {
    form.setFieldsValue({
      ...props.bout,
    });
  }, [props.bout, form]); // Dependency on props.bout triggers the update

  const handleRedAthleteChange = (value: number) => {
    const athlete = (props.athletes ?? []).find((a) => a.id === value);
    if (athlete) {
      form.setFieldsValue({
        ageCategory: athlete.ageCategory,
        gender: athlete.gender,
        experience: athlete.experience,
        weightClass: athlete.weightClass,
      } as Partial<Bout>);
    }
  };

  const onFinish: FormProps<UpdateBoutProps>["onFinish"] = (values) => {
    props.onClose(props.onSubmit(values));
  };

  return (
    <Form
      labelCol={{ xs: { span: 24 }, md: { span: 4 } }}
      wrapperCol={{ xs: { span: 24 }, md: { span: 14 } }}
      layout="horizontal"
      form={form}
      style={{ width: "100%", maxWidth: 600 }}
      onFinish={onFinish}
    >
      <Form.Item<UpdateBoutProps> label="Bout Type" name="boutType">
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
      <Form.Item<UpdateBoutProps> label="Bout Number" name="boutNumber" rules={[{ required: true, message: "Bout number is required" }]}>
        <InputNumber />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Red Athlete" name="redAthleteId" rules={[{ required: true, message: "Red athlete is required" }]}>
        <Select
          options={redAthleteOptions}
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Select athlete…"
          onChange={handleRedAthleteChange}
        />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Blue Athlete" name="blueAthleteId" rules={[{ required: true, message: "Blue athlete is required" }]}>
        <Select options={blueAthleteOptions} allowClear showSearch optionFilterProp="label" placeholder="Select athlete…" />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Weight (kg)" name="weightClass">
        <InputNumber min={0} step={0.5} style={{ width: "100%" }} placeholder="Auto-filled from red athlete" />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Age Cat" name="ageCategory" rules={[{ required: true, message: "Age category is required" }]}>
        <Select
          options={[
            { value: "u13", label: "U13" },
            { value: "u15", label: "U15" },
            { value: "u17", label: "U17" },
            { value: "u19", label: "U19" },
            { value: "elite", label: "Elite" },
            { value: "masters", label: "Masters" },
          ]}
        />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Glove Size" name="gloveSize" rules={[{ required: true, message: "Glove size is required" }]}>
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: "10oz", label: "10oz" },
            { value: "12oz", label: "12oz" },
            { value: "16oz", label: "16oz" },
          ]}
        />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Gender" name="gender">
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Experience" name="experience">
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: "open", label: "Open" },
            { value: "novice", label: "Novice" },
          ]}
        />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Round Length" name="roundLength" rules={[{ required: true, message: "Round length is required" }]}>
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: 1, label: "1" },
            { value: 1.5, label: "1.5" },
            { value: 2, label: "2" },
            { value: 3, label: "3" },
          ]}
        />
      </Form.Item>
      {isScored && (
        <Form.Item<UpdateBoutProps> label="Judges" name="numberOfJudges">
          <Segmented
            size={"large"}
            shape="round"
            options={[
              { value: 3, label: "3" },
              { value: 5, label: "5" },
            ]}
          />
        </Form.Item>
      )}
      <Form.Item<UpdateBoutProps> label="Referee" name="referee">
        <Select
          options={officialOptions}
          allowClear
          placeholder="Select referee…"
        />
      </Form.Item>
      {warnings.length > 0 && (
        <Form.Item label={null}>
          <Alert
            type="warning"
            showIcon
            message="Possible mismatch"
            description={
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            }
          />
        </Form.Item>
      )}
      <Form.Item label={null}>
        <Space>
          <Button type="text" onClick={() => props.onClose()}>
            Cancel
          </Button>
          {warnings.length > 0 ? (
            <Popconfirm
              title="Match anyway?"
              description="This pairing has mismatches — see warning above."
              onConfirm={() => form.submit()}
              okText="Match anyway"
              cancelText="Cancel"
            >
              <Button type="primary">Submit</Button>
            </Popconfirm>
          ) : (
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          )}
          {props.onDelete && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                props.onDelete!();
                props.onClose();
              }}
            >
              Delete
            </Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
};

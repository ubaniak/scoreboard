import {
  Alert,
  Button,
  Divider,
  Form,
  InputNumber,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Input,
  type FormProps,
} from "antd";
import type { CreateBoutProps } from "../../api/bouts";
import type { Athlete } from "../../api/athletes";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { matchWarnings } from "./matchCompatibility";

export type AddBoutProps = {
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (values: CreateBoutProps) => Promise<unknown>;
  athletes?: Athlete[];
  availableAthleteIds?: number[];
  nextBoutNumber?: number;
};

export const AddBout = (props: AddBoutProps) => {
  const [form] = Form.useForm<CreateBoutProps>();
  const screens = useBreakpoint();
  const twoColumn = screens.lg;

  const availableSet = new Set(props.availableAthleteIds ?? []);
  const athleteOptions = (props.athletes ?? [])
    .filter((a) => availableSet.has(a.id))
    .map((a) => ({
      value: a.id,
      label: a.clubName ? `${a.name} (${a.clubName})` : a.name,
    }));

  const redAthleteId = Form.useWatch("redAthleteId", form);
  const blueAthleteId = Form.useWatch("blueAthleteId", form);
  const redAthlete = (props.athletes ?? []).find((a) => a.id === redAthleteId);
  const blueAthlete = (props.athletes ?? []).find((a) => a.id === blueAthleteId);
  const warnings = matchWarnings(redAthlete, blueAthlete);

  const handleRedAthleteChange = (value: number) => {
    const athlete = (props.athletes ?? []).find((a) => a.id === value);
    if (athlete) {
      form.setFieldsValue({
        ageCategory: athlete.ageCategory,
        gender: athlete.gender,
        experience: athlete.experience,
        weightClass: athlete.weightClass,
      });
    }
  };

  const onFinish: FormProps<CreateBoutProps>["onFinish"] = (values) => {
    props.onClose(props.onSubmit(values));
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        boutNumber: props.nextBoutNumber ?? 1,
        ageCategory: "",
        gender: "male",
        experience: "novice",
        boutType: "scored",
        gloveSize: "10oz",
        roundLength: 1,
      }}
      style={{ width: "100%", maxWidth: twoColumn ? 900 : 600 }}
      onFinish={onFinish}
    >
      <div style={{ display: "flex", gap: 32, flexDirection: twoColumn ? "row" : "column" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Divider titlePlacement="left" plain style={{ marginTop: 0 }}>Matchup</Divider>
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
          <Form.Item<CreateBoutProps> label="Bout #" name="boutNumber" rules={[{ required: true, message: "Bout number is required" }]}>
            <InputNumber />
          </Form.Item>
          <Form.Item<CreateBoutProps> label="Red Athlete" name="redAthleteId" rules={[{ required: true, message: "Red athlete is required" }]}>
            <Select
              options={athleteOptions}
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Select athlete…"
              onChange={handleRedAthleteChange}
            />
          </Form.Item>
          <Form.Item<CreateBoutProps> label="Blue Athlete" name="blueAthleteId" rules={[{ required: true, message: "Blue athlete is required" }]}>
            <Select
              options={athleteOptions}
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Select athlete…"
            />
          </Form.Item>
          <Form.Item<CreateBoutProps> label="Weight (kg)" name="weightClass">
            <InputNumber min={0} step={0.5} style={{ width: "100%" }} placeholder="Auto-filled from red athlete" />
          </Form.Item>
          <Form.Item<CreateBoutProps> label="Age Cat" name="ageCategory" rules={[{ required: true, message: "Age category is required" }]}>
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
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Divider titlePlacement="left" plain style={{ marginTop: twoColumn ? 0 : undefined }}>Format</Divider>
          <Form.Item<CreateBoutProps>
            label="Round Length"
            name="roundLength"
            rules={[{ required: true, message: "Round length is required" }]}
          >
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
          <Form.Item<CreateBoutProps>
            label="Glove Size"
            name="gloveSize"
            rules={[{ required: true, message: "Glove size is required" }]}
          >
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
          <Form.Item<CreateBoutProps> label="Referee" name="referee">
            <Input autoComplete="off" />
          </Form.Item>
        </div>
      </div>
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
        </Space>
      </Form.Item>
    </Form>
  );
};

import { DeleteOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Segmented, Select, Space, type FormProps } from "antd";
import { useEffect, useState } from "react";
import type { UpdateBoutProps } from "../../api/bouts";
import type { Athlete } from "../../api/athletes";
import type { Comment } from "../../api/comments";
import type { Bout, Official } from "../../entities/cards";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useTheme } from "../../theme";
import { PersistedCommentsList } from "./commentsUI";
import { getMismatches } from "./matchCompatibility";
import { CornerCard, MismatchRow, VsBadge, type AthleteOption } from "./matchupUI";

export type EditBoutProps = {
  bout: Bout;
  officials?: Official[];
  athletes?: Athlete[];
  availableAthleteIds?: number[];
  comments: Comment[];
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (values: UpdateBoutProps) => Promise<unknown>;
  onDelete?: () => void;
  onAddComment: (text: string) => Promise<unknown>;
  onUpdateComment: (commentId: number, text: string) => Promise<unknown>;
  onDeleteComment: (commentId: number) => Promise<unknown>;
};

export const EditBout = (props: EditBoutProps) => {
  const officialOptions = (props.officials ?? []).map((o) => ({
    value: o.name,
    label: o.name,
  }));

  const [form] = Form.useForm<Bout>();
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const screens = useBreakpoint();
  const stackCorners = !screens.md;
  const { colors } = useTheme();
  const boutType = Form.useWatch("boutType", form);
  const isScored = !boutType || boutType === "scored";

  const availableSet = new Set(props.availableAthleteIds ?? []);
  // Each corner's own current assignment stays selectable even if it's no longer
  // roster-available, so editing a bout doesn't force the corner to appear empty.
  const redAthleteOptions: AthleteOption[] = (props.athletes ?? [])
    .filter((a) => availableSet.has(a.id) || a.id === props.bout.redAthleteId)
    .map((a) => ({ value: a.id, label: a.clubName ? `${a.name} (${a.clubName})` : a.name }));
  const blueAthleteOptions: AthleteOption[] = (props.athletes ?? [])
    .filter((a) => availableSet.has(a.id) || a.id === props.bout.blueAthleteId)
    .map((a) => ({ value: a.id, label: a.clubName ? `${a.name} (${a.clubName})` : a.name }));

  const redAthleteId = Form.useWatch("redAthleteId", form);
  const blueAthleteId = Form.useWatch("blueAthleteId", form);
  const redAthlete = (props.athletes ?? []).find((a) => a.id === redAthleteId);
  const blueAthlete = (props.athletes ?? []).find((a) => a.id === blueAthleteId);
  const mismatches = getMismatches(redAthlete, blueAthlete);
  const bothPicked = !!redAthlete && !!blueAthlete;

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
    <Form layout="vertical" form={form} style={{ width: "100%" }} onFinish={onFinish}>
      {/* Kept mounted (but hidden) so these fields are always registered with
          the form — otherwise antd only includes fields with a rendered
          Form.Item in onFinish's values, and these only get a visible control
          when Stage 1 surfaces a mismatch to resolve. */}
      <Form.Item name="ageCategory" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="gender" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="experience" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="weightClass" hidden>
        <InputNumber />
      </Form.Item>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
          fontSize: 12,
          color: colors.textFaint,
        }}
      >
        <span style={{ fontWeight: stage === 1 ? 700 : 400, color: stage === 1 ? colors.text : colors.textFaint }}>
          ① Who's fighting
        </span>
        <span style={{ width: 20, height: 1, background: colors.border }} />
        <span style={{ fontWeight: stage === 2 ? 700 : 400, color: stage === 2 ? colors.text : colors.textFaint }}>
          ② Confirm format
        </span>
        <span style={{ width: 20, height: 1, background: colors.border }} />
        <span style={{ fontWeight: stage === 3 ? 700 : 400, color: stage === 3 ? colors.text : colors.textFaint }}>
          ③ Comments
        </span>
      </div>

      <div style={{ display: stage === 1 ? "block" : "none" }}>
        <Form.Item<UpdateBoutProps>
          label="Bout #"
          name="boutNumber"
          rules={[{ required: true, message: "Bout number is required" }]}
          style={{ width: 100 }}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <div style={{ display: "flex", flexDirection: stackCorners ? "column" : "row", alignItems: stackCorners ? "stretch" : "center", gap: 4, marginBottom: 16 }}>
          <CornerCard
            corner="red"
            fieldName="redAthleteId"
            athleteOptions={redAthleteOptions}
            athlete={redAthlete}
            onChange={handleRedAthleteChange}
          />
          <VsBadge vertical={stackCorners} />
          <CornerCard corner="blue" fieldName="blueAthleteId" athleteOptions={blueAthleteOptions} athlete={blueAthlete} />
        </div>

        {bothPicked && (
          <div style={{ marginBottom: 8 }}>
            {mismatches.length === 0 ? (
              <div style={{ padding: "10px 12px", borderRadius: 8, background: colors.bg, color: colors.textMuted, fontSize: 13 }}>
                ✓ Clean match — ready to confirm format.
              </div>
            ) : (
              <Space direction="vertical" style={{ width: "100%" }} size={6}>
                {mismatches.map((m) => (
                  <MismatchRow key={m.dimension} mismatch={m} form={form} />
                ))}
              </Space>
            )}
          </div>
        )}
      </div>

      <div style={{ display: stage === 2 ? "block" : "none" }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 4 }}>
          <Form.Item<UpdateBoutProps> label="Bout Type" name="boutType" style={{ flex: "1 1 240px", minWidth: 240 }}>
            <Segmented
              size="large"
              shape="round"
              options={[
                { value: "sparring", label: "Sparring" },
                { value: "developmental", label: "Developmental" },
                { value: "scored", label: "Scored" },
              ]}
            />
          </Form.Item>
          <Form.Item<UpdateBoutProps> label="Round Length" name="roundLength" style={{ flex: "1 1 220px", minWidth: 220 }}>
            <Segmented
              size="large"
              shape="round"
              options={[
                { value: 1, label: "1" },
                { value: 1.5, label: "1.5" },
                { value: 2, label: "2" },
                { value: 3, label: "3" },
              ]}
            />
          </Form.Item>
          <Form.Item<UpdateBoutProps> label="Glove Size" name="gloveSize" style={{ flex: "1 1 220px", minWidth: 220 }}>
            <Segmented
              size="large"
              shape="round"
              options={[
                { value: "10oz", label: "10oz" },
                { value: "12oz", label: "12oz" },
                { value: "16oz", label: "16oz" },
              ]}
            />
          </Form.Item>
          {isScored && (
            <Form.Item<UpdateBoutProps> label="Judges" name="numberOfJudges" style={{ flex: "1 1 160px", minWidth: 160 }}>
              <Segmented
                size="large"
                shape="round"
                options={[
                  { value: 3, label: "3" },
                  { value: 5, label: "5" },
                ]}
              />
            </Form.Item>
          )}
          <Form.Item<UpdateBoutProps> label="Referee" name="referee" style={{ flex: "1 1 220px", minWidth: 220 }}>
            <Select options={officialOptions} allowClear placeholder="Select referee…" />
          </Form.Item>
        </div>
      </div>

      <div style={{ display: stage === 3 ? "block" : "none" }}>
        <PersistedCommentsList
          comments={props.comments}
          onAdd={props.onAddComment}
          onUpdate={props.onUpdateComment}
          onDelete={props.onDeleteComment}
        />
      </div>

      <Form.Item label={null} style={{ marginTop: 8, marginBottom: 0 }}>
        <Space>
          <Button type="text" onClick={() => props.onClose()}>
            Cancel
          </Button>
          {stage === 1 && (
            <Button type="primary" disabled={!bothPicked} onClick={() => setStage(2)}>
              Next: Confirm Format →
            </Button>
          )}
          {stage === 2 && (
            <>
              <Button onClick={() => setStage(1)}>← Back</Button>
              <Button type="primary" onClick={() => setStage(3)}>
                Next: Comments →
              </Button>
            </>
          )}
          {stage === 3 && (
            <>
              <Button onClick={() => setStage(2)}>← Back</Button>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </>
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

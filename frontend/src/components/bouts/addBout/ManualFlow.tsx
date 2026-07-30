import { App, Button, Form, Input, InputNumber, Segmented, Space, type FormProps } from "antd";
import { useState } from "react";
import type { CreateBoutProps } from "../../../api/bouts";
import type { Athlete } from "../../../api/athletes";
import type { Bout } from "../../../entities/cards";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import { useTheme } from "../../../theme";
import { DraftCommentsList } from "../commentsUI";
import { getMismatches } from "../matchCompatibility";
import { CornerCard, MismatchRow, VsBadge, type AthleteOption } from "../matchupUI";
import { lastUsedFormat } from "./lastUsedFormat";

export type ManualFlowProps = {
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (values: CreateBoutProps) => Promise<{ id: number }>;
  onAddComment: (boutId: number, comment: string) => Promise<unknown>;
  athletes?: Athlete[];
  nextBoutNumber?: number;
  bouts?: Bout[];
};

export const ManualFlow = (props: ManualFlowProps) => {
  const [form] = Form.useForm<CreateBoutProps>();
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [draftComments, setDraftComments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const stackCorners = !screens.md;
  const { colors } = useTheme();

  const { format: defaultFormat, source: formatSource } = lastUsedFormat(props.bouts);

  const athleteOptions: AthleteOption[] = (props.athletes ?? []).map((a) => ({
    value: a.id,
    label: a.clubName ? `${a.name} (${a.clubName})` : a.name,
  }));

  const redAthleteId = Form.useWatch("redAthleteId", form);
  const blueAthleteId = Form.useWatch("blueAthleteId", form);
  const redAthlete = (props.athletes ?? []).find((a) => a.id === redAthleteId);
  const blueAthlete = (props.athletes ?? []).find((a) => a.id === blueAthleteId);
  const mismatches = getMismatches(redAthlete, blueAthlete);
  const bothPicked = !!redAthlete && !!blueAthlete;

  const handleRedAthleteChange = (value: number) => {
    const athlete = (props.athletes ?? []).find((a) => a.id === value);
    if (!athlete) return;
    // Only overwrite fields the athlete actually has data for — falling back
    // to the form's initial defaults (e.g. gender/experience) when the
    // athlete record is missing a value, rather than clobbering a valid
    // default with an empty one (the bout record requires all four fields).
    const updates: Partial<CreateBoutProps> = { ageCategory: athlete.ageCategory };
    if (athlete.gender) updates.gender = athlete.gender;
    if (athlete.experience) updates.experience = athlete.experience;
    if (athlete.weightClass != null) updates.weightClass = athlete.weightClass;
    form.setFieldsValue(updates);
  };

  const onFinish: FormProps<CreateBoutProps>["onFinish"] = (values) => {
    const run = async () => {
      const created = await props.onSubmit({ ...values, referee: "" });
      for (const text of draftComments) {
        await props.onAddComment(created.id, text);
      }
    };
    setSubmitting(true);
    props.onClose(
      run()
        .catch((err) => {
          message.error((err as Error).message || "Failed to create bout");
          throw err;
        })
        .finally(() => setSubmitting(false)),
    );
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
        boutType: defaultFormat.boutType,
        gloveSize: defaultFormat.gloveSize,
        roundLength: defaultFormat.roundLength,
      }}
      style={{ width: "100%" }}
      onFinish={onFinish}
    >
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
        <Form.Item<CreateBoutProps>
          label="Bout #"
          name="boutNumber"
          rules={[{ required: true, message: "Bout number is required" }]}
          style={{ width: 100 }}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <div style={{ display: "flex", flexDirection: stackCorners ? "column" : "row", alignItems: stackCorners ? "stretch" : "center", gap: 4, marginBottom: 16 }}>
          <CornerCard corner="red" fieldName="redAthleteId" athleteOptions={athleteOptions} athlete={redAthlete} onChange={handleRedAthleteChange} />
          <VsBadge vertical={stackCorners} />
          <CornerCard corner="blue" fieldName="blueAthleteId" athleteOptions={athleteOptions} athlete={blueAthlete} />
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
          <Form.Item<CreateBoutProps> label="Bout Type" name="boutType" style={{ flex: "1 1 240px", minWidth: 240 }}>
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
          <Form.Item<CreateBoutProps> label="Round Length" name="roundLength" style={{ flex: "1 1 220px", minWidth: 220 }}>
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
          <Form.Item<CreateBoutProps> label="Glove Size" name="gloveSize" style={{ flex: "1 1 220px", minWidth: 220 }}>
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
        </div>
        <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 8 }}>
          {formatSource ? `Remembered from bout #${formatSource} — change any field to override just this bout.` : "Defaults — change any field to override just this bout."}
        </div>
      </div>

      <div style={{ display: stage === 3 ? "block" : "none" }}>
        <DraftCommentsList
          comments={draftComments}
          onAdd={(text) => setDraftComments((c) => [...c, text])}
          onRemove={(index) => setDraftComments((c) => c.filter((_, i) => i !== index))}
        />
      </div>

      <Form.Item label={null} style={{ marginTop: 8, marginBottom: 0 }}>
        <Space>
          <Button type="text" onClick={() => props.onClose()} disabled={submitting}>
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
              <Button onClick={() => setStage(2)} disabled={submitting}>
                ← Back
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Submit
              </Button>
            </>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
};

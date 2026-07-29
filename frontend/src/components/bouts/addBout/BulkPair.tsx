import { CloseOutlined } from "@ant-design/icons";
import { App, Button, Input, Segmented, Space, Typography } from "antd";
import { useMemo, useState } from "react";
import type { CreateBoutProps } from "../../../api/bouts";
import type { Athlete } from "../../../api/athletes";
import type { Bout } from "../../../entities/cards";
import { useTheme } from "../../../theme";
import { getMismatches } from "../matchCompatibility";
import { lastUsedFormat, type BoutFormat } from "./lastUsedFormat";

export type BulkPairProps = {
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (values: CreateBoutProps) => Promise<unknown>;
  athletes?: Athlete[];
  availableAthleteIds?: number[];
  nextBoutNumber?: number;
  bouts?: Bout[];
};

type Pair = { id: string; redId: number; blueId: number; suggested?: boolean };

const groupKey = (a: Athlete) => `${a.gender ?? ""}|${a.experience ?? ""}|${a.ageCategory}`;

const autoPairAthletes = (pool: Athlete[]): Pair[] => {
  const groups = new Map<string, Athlete[]>();
  for (const a of pool) {
    const key = groupKey(a);
    const existing = groups.get(key);
    if (existing) existing.push(a);
    else groups.set(key, [a]);
  }
  const pairs: Pair[] = [];
  for (const group of groups.values()) {
    group.sort((a, b) => (a.weightClass ?? 0) - (b.weightClass ?? 0));
    for (let i = 0; i + 1 < group.length; i += 2) {
      pairs.push({ id: `auto-${group[i].id}-${group[i + 1].id}`, redId: group[i].id, blueId: group[i + 1].id, suggested: true });
    }
  }
  return pairs;
};

export const BulkPair = (props: BulkPairProps) => {
  const { colors } = useTheme();
  const { message } = App.useApp();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [armedId, setArmedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { format: initialFormat } = lastUsedFormat(props.bouts);
  const [format, setFormat] = useState<BoutFormat>(initialFormat);

  const athleteById = useMemo(() => {
    const map = new Map<number, Athlete>();
    for (const a of props.athletes ?? []) map.set(a.id, a);
    return map;
  }, [props.athletes]);

  const pairedIds = useMemo(() => {
    const set = new Set<number>();
    for (const p of pairs) {
      set.add(p.redId);
      set.add(p.blueId);
    }
    return set;
  }, [pairs]);

  const pool = useMemo(() => {
    const availableSet = new Set(props.availableAthleteIds ?? []);
    return (props.athletes ?? []).filter(
      (a) => availableSet.has(a.id) && !pairedIds.has(a.id) && a.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [props.athletes, props.availableAthleteIds, pairedIds, search]);

  const handleChipClick = (athleteId: number) => {
    if (armedId === null) {
      setArmedId(athleteId);
      return;
    }
    if (armedId === athleteId) {
      setArmedId(null);
      return;
    }
    setPairs((p) => [...p, { id: `manual-${armedId}-${athleteId}-${p.length}`, redId: armedId, blueId: athleteId }]);
    setArmedId(null);
  };

  const removePair = (id: string) => setPairs((p) => p.filter((pair) => pair.id !== id));

  const handleAutoPair = () => {
    const remaining = (props.athletes ?? []).filter((a) => {
      const availableSet = new Set(props.availableAthleteIds ?? []);
      return availableSet.has(a.id) && !pairedIds.has(a.id);
    });
    const suggested = autoPairAthletes(remaining);
    setPairs((p) => [...p, ...suggested]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let boutNumber = props.nextBoutNumber ?? 1;
      for (const pair of pairs) {
        const red = athleteById.get(pair.redId);
        await props.onSubmit({
          boutNumber: boutNumber++,
          ageCategory: red?.ageCategory ?? "",
          gender: red?.gender ?? "male",
          experience: red?.experience ?? "novice",
          weightClass: red?.weightClass,
          redAthleteId: pair.redId,
          blueAthleteId: pair.blueId,
          referee: "",
          boutType: format.boutType,
          roundLength: format.roundLength,
          gloveSize: format.gloveSize,
        });
      }
      props.onClose(Promise.resolve());
    } catch (err) {
      message.error((err as Error).message || "Failed to create bouts — nothing after the failure was created");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16, alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 6 }}>Bout Type</div>
          <Segmented
            value={format.boutType}
            onChange={(v) => setFormat((f) => ({ ...f, boutType: String(v) }))}
            options={[
              { value: "sparring", label: "Sparring" },
              { value: "developmental", label: "Developmental" },
              { value: "scored", label: "Scored" },
            ]}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 6 }}>Round Length</div>
          <Segmented
            value={format.roundLength}
            onChange={(v) => setFormat((f) => ({ ...f, roundLength: Number(v) }))}
            options={[
              { value: 1, label: "1" },
              { value: 1.5, label: "1.5" },
              { value: 2, label: "2" },
              { value: 3, label: "3" },
            ]}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 6 }}>Glove Size</div>
          <Segmented
            value={format.gloveSize}
            onChange={(v) => setFormat((f) => ({ ...f, gloveSize: String(v) }))}
            options={[
              { value: "10oz", label: "10oz" },
              { value: "12oz", label: "12oz" },
              { value: "16oz", label: "16oz" },
            ]}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ width: 220, flexShrink: 0 }}>
          <Input.Search placeholder="Search pool…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 10 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
            {pool.length === 0 && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                No athletes left in the pool.
              </Typography.Text>
            )}
            {pool.map((a) => (
              <div
                key={a.id}
                onClick={() => handleChipClick(a.id)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: armedId === a.id ? colors.blueMuted : colors.bg,
                  border: `1px solid ${armedId === a.id ? colors.blue : colors.borderSubtle}`,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 600 }}>{a.name}</div>
                <div style={{ color: colors.textFaint, fontSize: 11 }}>
                  {[a.ageCategory?.toUpperCase(), a.weightClass != null ? `${a.weightClass}kg` : null, a.experience].filter(Boolean).join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              {pairs.length} pair{pairs.length === 1 ? "" : "s"} queued
            </Typography.Text>
            <Button onClick={handleAutoPair}>Auto-pair remaining</Button>
          </div>

          {pairs.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: colors.textFaint, fontSize: 13, border: `1px dashed ${colors.border}`, borderRadius: 12 }}>
              Tap an athlete, then tap their opponent to queue a bout.
            </div>
          )}

          <Space direction="vertical" style={{ width: "100%" }} size={8}>
            {pairs.map((pair) => {
              const red = athleteById.get(pair.redId);
              const blue = athleteById.get(pair.blueId);
              const mismatches = getMismatches(red, blue);
              return (
                <div
                  key={pair.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: colors.bg,
                    border: `1px solid ${colors.borderSubtle}`,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: mismatches.length > 0 ? "#d97706" : "#16a34a",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, fontSize: 13 }}>
                    {red?.name ?? "?"} <span style={{ color: colors.textFaint }}>vs</span> {blue?.name ?? "?"}
                  </span>
                  {pair.suggested && (
                    <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: colors.blue, background: colors.blueMuted, padding: "1px 6px", borderRadius: 999 }}>
                      Suggested
                    </span>
                  )}
                  <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => removePair(pair.id)} aria-label="Remove pair" />
                </div>
              );
            })}
          </Space>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <Button onClick={() => props.onClose()}>Cancel</Button>
        <Button type="primary" disabled={pairs.length === 0} loading={submitting} onClick={handleSubmit}>
          Create {pairs.length} Bout{pairs.length === 1 ? "" : "s"}
        </Button>
      </div>
    </div>
  );
};

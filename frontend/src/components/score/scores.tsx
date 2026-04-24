import { Table, Tag, Typography } from "antd";
import type { ColumnType } from "antd/es/table";
import type { RoundDetails } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import { Card } from "../card/card";

const { Text } = Typography;

export type ScoresProps = {
  scores: ScoresByRound;
  currentRound?: number;
  rounds?: RoundDetails[];
  boutStatus?: string;
  isAdmin?: boolean;
};


type RowData = {
  key: string;
  label: string;
  [k: string]: string | number | undefined;
};

export const Scores = ({
  scores,
  rounds,
  isAdmin,
  currentRound,
}: ScoresProps) => {
  const ROUNDS = rounds && rounds.length > 0 ? rounds.map((r) => r.roundNumber) : [1, 2, 3];

  // Collect judge roles in order from all rounds
  const judgeRoles: string[] = [];
  const judgeNames: Record<string, string> = {};
  const judgeStatuses: Record<string, string> = {};
  for (const round of ROUNDS) {
    for (const s of scores[round] ?? []) {
      if (!judgeRoles.includes(s.judgeRole)) judgeRoles.push(s.judgeRole);
      if (s.judgeName) judgeNames[s.judgeRole] = s.judgeName;
    }
  }
  for (const s of scores[currentRound || 0] ?? []) {
    if (s.status) judgeStatuses[s.judgeRole] = s.status;
  }

  // Total warnings across all rounds
  let totalRedWarn = 0;
  let totalBlueWarn = 0;
  for (const round of ROUNDS) {
    const rd = rounds?.find((r) => r.roundNumber === round);
    totalRedWarn += rd?.red.warnings.length ?? 0;
    totalBlueWarn += rd?.blue.warnings.length ?? 0;
  }
  const hasDeductions = totalRedWarn > 0 || totalBlueWarn > 0;

  // Round rows
  const roundRows: RowData[] = ROUNDS.flatMap((round) => {
    const roundScores = scores[round] ?? [];
    if (roundScores.length === 0) return [];
    const row: RowData = { key: `round_${round}`, label: `Round ${round}` };
    judgeRoles.forEach((role, i) => {
      const s = roundScores.find((sc) => sc.judgeRole === role);
      row[`j${i}_red`] = s?.red;
      row[`j${i}_blue`] = s?.blue;
    });
    return [row];
  });

  // Deductions row
  const deductionsRow: RowData = { key: "__deductions__", label: "Deductions" };
  judgeRoles.forEach((_, i) => {
    deductionsRow[`j${i}_red`] = totalRedWarn > 0 ? totalRedWarn : undefined;
    deductionsRow[`j${i}_blue`] = totalBlueWarn > 0 ? totalBlueWarn : undefined;
  });

  // Total row — per-judge sum across all rounds minus deductions
  const totalRow: RowData = { key: "__total__", label: "Total" };
  judgeRoles.forEach((role, i) => {
    const redSum = ROUNDS.reduce(
      (s, r) =>
        s + ((scores[r] ?? []).find((sc) => sc.judgeRole === role)?.red ?? 0),
      0,
    );
    const blueSum = ROUNDS.reduce(
      (s, r) =>
        s + ((scores[r] ?? []).find((sc) => sc.judgeRole === role)?.blue ?? 0),
      0,
    );
    const redTotal = redSum - totalRedWarn;
    const blueTotal = blueSum - totalBlueWarn;
    totalRow[`j${i}_red`] = redTotal;
    totalRow[`j${i}_blue`] = blueTotal;
    totalRow[`j${i}_winner`] = redTotal > blueTotal ? "red" : blueTotal > redTotal ? "blue" : "tie";
  });

  // Overall winner row — admin only, read from round 3 scores
  const overallWinnerRow: RowData = {
    key: "__overall__",
    label: "Overall Winner",
  };
  let hasOverallWinner = false;
  if (isAdmin) {
    judgeRoles.forEach((role, i) => {
      const pick = (scores[3] ?? []).find(
        (sc) => sc.judgeRole === role,
      )?.overallWinner;
      if (pick) {
        overallWinnerRow[`j${i}_pick`] = pick;
        hasOverallWinner = true;
      }
    });
  }

  const dataSource =
    roundRows.length > 0
      ? [
          ...roundRows,
          ...(hasDeductions ? [deductionsRow] : []),
          totalRow,
          ...(hasOverallWinner ? [overallWinnerRow] : []),
        ]
      : [];

  const sep = { borderTop: "1px solid rgba(255,255,255,0.12)" };

  const scoreCell = (
    val: number | string | undefined,
    corner: "red" | "blue",
    rowKey: string,
    isWinner?: boolean,
  ) => {
    if (val === undefined) return <Text type="secondary">–</Text>;
    const isDeduction = rowKey === "__deductions__";
    const isTotal = rowKey === "__total__";
    const color = isDeduction
      ? "rgba(255,255,255,0.45)"
      : corner === "red"
        ? "#ff4d4f"
        : "#1677ff";
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <Text
          style={{
            color,
            fontFamily: "monospace",
            fontVariantNumeric: "tabular-nums",
            fontWeight: isTotal ? 800 : 700,
            fontSize: isTotal ? 16 : 14,
          }}
        >
          {isDeduction ? `-${val}` : val}
        </Text>
        {isWinner && (
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
        )}
      </div>
    );
  };

  const statusTagColor: Record<string, string> = {
    complete: "success",
    ready: "processing",
    requested: "warning",
    not_started: "default",
  };
  const statusLabel: Record<string, string> = {
    complete: "Complete",
    ready: "Ready",
    requested: "Requested",
    not_started: "Not Started",
  };

  const judgeColumns: ColumnType<RowData>[] = judgeRoles.map((role, i) => ({
    title: (
      <div style={{ textAlign: "center", lineHeight: 1.5 }}>
        <Text strong style={{ display: "block", fontSize: 13 }}>
          Judge {i + 1}
        </Text>
        <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
          {judgeNames[role] || role}
        </Text>
        {judgeStatuses[role] && (
          <Tag
            color={statusTagColor[judgeStatuses[role]] ?? "default"}
            style={{ marginTop: 5 }}
          >
            {statusLabel[judgeStatuses[role]] ?? judgeStatuses[role]}
          </Tag>
        )}
      </div>
    ),
    children: [
      {
        title: <Text style={{ color: "#ff4d4f", fontWeight: 600 }}>Red</Text>,
        dataIndex: `j${i}_red`,
        key: `j${i}_red`,
        align: "center" as const,
        width: 56,
        render: (val: number | undefined, record: RowData) => {
          if (record.key === "__overall__") {
            const pick = record[`j${i}_pick`];
            if (!pick) return <Text type="secondary">–</Text>;
            return pick === "red" ? (
              <span style={{ fontSize: 18 }}>✓</span>
            ) : null;
          }
          const isWinner = record.key === "__total__" && record[`j${i}_winner`] === "red";
          return scoreCell(val, "red", record.key, isWinner);
        },
        onCell: (record: RowData) => ({
          style:
            record.key === "__deductions__" ||
            record.key === "__total__" ||
            record.key === "__overall__"
              ? sep
              : {},
        }),
      } as ColumnType<RowData>,
      {
        title: <Text style={{ color: "#1677ff", fontWeight: 600 }}>Blue</Text>,
        dataIndex: `j${i}_blue`,
        key: `j${i}_blue`,
        align: "center" as const,
        width: 56,
        render: (val: number | undefined, record: RowData) => {
          if (record.key === "__overall__") {
            const pick = record[`j${i}_pick`];
            if (!pick) return <Text type="secondary">–</Text>;
            return pick === "blue" ? (
              <span style={{ fontSize: 18 }}>✓</span>
            ) : null;
          }
          const isWinner = record.key === "__total__" && record[`j${i}_winner`] === "blue";
          return scoreCell(val, "blue", record.key, isWinner);
        },
        onCell: (record: RowData) => ({
          style:
            record.key === "__deductions__" ||
            record.key === "__total__" ||
            record.key === "__overall__"
              ? sep
              : {},
        }),
      } as ColumnType<RowData>,
    ],
  }));

  const columns: ColumnType<RowData>[] = [
    {
      title: "",
      dataIndex: "label",
      key: "label",
      render: (label: string, record: RowData) => {
        if (record.key === "__deductions__")
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Deductions
            </Text>
          );
        if (record.key === "__total__") return <Text strong>Total</Text>;
        if (record.key === "__overall__")
          return <Text strong>Overall Winner</Text>;
        return <Text>{label}</Text>;
      },
      onCell: (record: RowData) => ({
        style:
          record.key === "__deductions__" ||
          record.key === "__total__" ||
          record.key === "__overall__"
            ? sep
            : {},
      }),
    },
    ...judgeColumns,
  ];

  return (
    <Card title="Scores">
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        rowClassName={(record) =>
          record.key === "__total__" ? "scores-total-row" : ""
        }
      />
    </Card>
  );
};

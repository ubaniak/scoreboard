import { Table, Typography } from "antd";
import type { ColumnType } from "antd/es/table";
import type { RoundDetails } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import { Card } from "../card/card";

const { Text } = Typography;

export type ScoresProps = {
  scores: ScoresByRound;
  rounds?: RoundDetails[];
  boutStatus?: string;
};

const ROUNDS = [1, 2, 3];

type RowData = {
  key: string;
  judgeRole: string;
  judgeName?: string;
  [key: string]: string | number | undefined; // r1_red, r1_blue, r2_red, ...
};

export const Scores = ({ scores, rounds }: ScoresProps) => {
  // Collect all judge roles in order from the first round that has scores
  const judgeRoles: string[] = [];
  for (const round of ROUNDS) {
    const roundScores = scores[round] ?? [];
    for (const s of roundScores) {
      if (!judgeRoles.includes(s.judgeRole)) {
        judgeRoles.push(s.judgeRole);
      }
    }
  }

  // Build rows — one per judge
  const rows: RowData[] = judgeRoles.map((role) => {
    const row: RowData = { key: role, judgeRole: role };
    for (const round of ROUNDS) {
      const score = (scores[round] ?? []).find((s) => s.judgeRole === role);
      row[`r${round}_red`] = score?.red ?? undefined;
      row[`r${round}_blue`] = score?.blue ?? undefined;
      if (score?.judgeName) row.judgeName = score.judgeName;
    }
    return row;
  });

  // Warnings row
  const warningsRow: RowData = { key: "__warnings__", judgeRole: "Warnings" };
  let hasWarnings = false;
  for (const round of ROUNDS) {
    const roundDetails = rounds?.find((r) => r.roundNumber === round);
    const redWarn = roundDetails?.red.warnings.length ?? 0;
    const blueWarn = roundDetails?.blue.warnings.length ?? 0;
    if (redWarn > 0 || blueWarn > 0) hasWarnings = true;
    warningsRow[`r${round}_red`] = redWarn > 0 ? redWarn : undefined;
    warningsRow[`r${round}_blue`] = blueWarn > 0 ? blueWarn : undefined;
  }

  // Totals row — sum per round, minus warnings
  const totalRow: RowData = { key: "__total__", judgeRole: "Total" };
  for (const round of ROUNDS) {
    const roundScores = scores[round] ?? [];
    const roundDetails = rounds?.find((r) => r.roundNumber === round);
    const redWarn = roundDetails?.red.warnings.length ?? 0;
    const blueWarn = roundDetails?.blue.warnings.length ?? 0;
    totalRow[`r${round}_red`] = roundScores.length
      ? roundScores.reduce((s, sc) => s + sc.red, 0) - redWarn
      : undefined;
    totalRow[`r${round}_blue`] = roundScores.length
      ? roundScores.reduce((s, sc) => s + sc.blue, 0) - blueWarn
      : undefined;
  }

  const dataSource = rows.length > 0
    ? [...rows, ...(hasWarnings ? [warningsRow] : []), totalRow]
    : [];

  const scoreCell = (val: number | string | undefined, corner: "red" | "blue", rowKey: string) => {
    if (val === undefined) return <Text type="secondary">–</Text>;
    const isWarning = rowKey === "__warnings__";
    const isTotal = rowKey === "__total__";
    return (
      <Text
        style={{
          color: isWarning ? "rgba(255,255,255,0.45)" : corner === "red" ? "#ff4d4f" : "#1677ff",
          fontFamily: "monospace",
          fontWeight: isTotal ? 800 : 700,
          fontSize: isTotal ? 16 : 14,
        }}
      >
        {isWarning ? `-${val}` : val}
      </Text>
    );
  };

  const separatorStyle = { borderTop: "1px solid rgba(255,255,255,0.15)" };

  const roundColumns = ROUNDS.map((round) => ({
    title: <Text strong>Round {round}</Text>,
    children: [
      {
        title: <Text style={{ color: "#ff4d4f", fontWeight: 600 }}>Red</Text>,
        dataIndex: `r${round}_red`,
        key: `r${round}_red`,
        align: "center" as const,
        width: 56,
        render: (val: number | undefined, record: RowData) => scoreCell(val, "red", record.key),
        onCell: (record: RowData) => ({
          style: record.key === "__warnings__" || record.key === "__total__" ? separatorStyle : {},
        }),
      } as ColumnType<RowData>,
      {
        title: <Text style={{ color: "#1677ff", fontWeight: 600 }}>Blue</Text>,
        dataIndex: `r${round}_blue`,
        key: `r${round}_blue`,
        align: "center" as const,
        width: 56,
        render: (val: number | undefined, record: RowData) => scoreCell(val, "blue", record.key),
        onCell: (record: RowData) => ({
          style: record.key === "__warnings__" || record.key === "__total__" ? separatorStyle : {},
        }),
      } as ColumnType<RowData>,
    ],
  }));

  const columns = [
    {
      title: "Judge",
      key: "judge",
      render: (_: unknown, record: RowData) => {
        if (record.key === "__warnings__") return <Text type="secondary" style={{ fontSize: 12 }}>Warnings</Text>;
        if (record.key === "__total__") return <Text strong>Total</Text>;
        return (
          <div>
            <Text strong style={{ display: "block" }}>{record.judgeRole}</Text>
            {record.judgeName && (
              <Text type="secondary" style={{ fontSize: 12 }}>{record.judgeName}</Text>
            )}
          </div>
        );
      },
      onCell: (record: RowData) => ({
        style: record.key === "__warnings__" || record.key === "__total__" ? separatorStyle : {},
      }),
    },
    ...roundColumns,
  ];

  return (
    <Card title="Scores">
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        rowClassName={(record) => record.key === "__total__" ? "scores-total-row" : ""}
      />
    </Card>
  );
};

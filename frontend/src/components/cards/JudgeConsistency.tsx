import { Empty, Table, Tag, Typography, type TableProps } from "antd";
import { useMemo } from "react";
import {
  type BoutRow,
  type JudgeRow,
  useGetJudgeConsistency,
} from "../../api/score";
import { ActionMenu } from "../actionMenu/actionMenu";

type Props = {
  cardId: string;
  token: string;
};

const fmtPct = (n: number) => `${n.toFixed(1)}%`;
const fmtScore = (n: number) => n.toFixed(1);

export const JudgeConsistency = ({ cardId, token }: Props) => {
  const { data, isLoading } = useGetJudgeConsistency({ token, cardId });

  const judgeBouts = useMemo(() => {
    const judges = data?.judges ?? [];
    const bouts = data?.bouts ?? [];
    const map = new Map<string, BoutRow[]>();
    for (const j of judges) {
      const found = bouts.filter((b) => {
        if (b.overallWinners.some((o) => keyOf(o) === j.judgeName)) return true;
        return b.rounds.some((r) =>
          r.scores.some((s) => keyOf(s) === j.judgeName),
        );
      });
      map.set(j.judgeName, found);
    }
    return map;
  }, [data]);

  const judges = data?.judges ?? [];

  const columns: TableProps<JudgeRow>["columns"] = [
    { title: "Judge", dataIndex: "judgeName", key: "judgeName" },
    { title: "# Bouts", dataIndex: "boutsCount", key: "boutsCount" },
    { title: "Total Red", dataIndex: "totalRed", key: "totalRed" },
    { title: "Total Blue", dataIndex: "totalBlue", key: "totalBlue" },
    {
      title: "Overall Winner Agree",
      dataIndex: "overallWinnerAgreePct",
      key: "overallWinnerAgreePct",
      render: fmtPct,
    },
    {
      title: "Round Agree",
      dataIndex: "roundAgreementPct",
      key: "roundAgreementPct",
      render: fmtPct,
    },
    {
      title: "Consistency Score",
      dataIndex: "consistencyScore",
      key: "consistencyScore",
      render: fmtScore,
      sorter: (a, b) => a.consistencyScore - b.consistencyScore,
      defaultSortOrder: "descend",
    },
    {
      title: "Positions",
      dataIndex: "positions",
      key: "positions",
      render: (positions: string[]) => (
        <>
          {(positions ?? []).map((p) => (
            <Tag key={p}>{p}</Tag>
          ))}
        </>
      ),
    },
    {
      title: "Details",
      key: "details",
      render: (_, record) => (
        <ActionMenu
          trigger={{ text: "View bouts" }}
          content={{
            title: `${record.judgeName} — bout breakdown`,
            body: () => (
              <JudgeBoutBreakdown
                judgeName={record.judgeName}
                bouts={judgeBouts.get(record.judgeName) ?? []}
              />
            ),
          }}
          width={900}
        />
      ),
    },
  ];

  if (!isLoading && judges.length === 0) {
    return <Empty description="No scored bouts yet" />;
  }

  return (
    <Table
      rowKey="judgeName"
      loading={isLoading}
      dataSource={judges}
      columns={columns}
      pagination={false}
    />
  );
};

const keyOf = (s: { judgeName: string; judgeRole: string }) =>
  s.judgeName !== "" ? s.judgeName : s.judgeRole;

type BreakdownProps = {
  judgeName: string;
  bouts: BoutRow[];
};

const JudgeBoutBreakdown = ({ judgeName, bouts }: BreakdownProps) => {
  if (bouts.length === 0) {
    return <Empty description="No bouts for this judge" />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {bouts.map((b) => (
        <BoutBlock key={b.boutId} bout={b} highlight={judgeName} />
      ))}
    </div>
  );
};

const BoutBlock = ({
  bout,
  highlight,
}: {
  bout: BoutRow;
  highlight: string;
}) => {
  // Build a single table: one row per judge, columns red/blue per round.
  const judges = Array.from(
    new Set(
      bout.rounds.flatMap((r) => r.scores.map((s) => keyOf(s))),
    ),
  );

  const overallByJudge = new Map(
    bout.overallWinners.map((o) => [keyOf(o), o.winner]),
  );

  const rows = judges.map((j) => {
    const row: Record<string, string | number> = { judge: j };
    for (const r of bout.rounds) {
      const found = r.scores.find((s) => keyOf(s) === j);
      row[`r${r.roundNumber}`] = found ? `${found.red} / ${found.blue}` : "—";
    }
    row.overall = overallByJudge.get(j) ?? "—";
    return row;
  });

  const cols: TableProps<(typeof rows)[number]>["columns"] = [
    {
      title: "Judge",
      dataIndex: "judge",
      key: "judge",
      render: (v: string) =>
        v === highlight ? <strong>{v}</strong> : v,
    },
    ...bout.rounds.map((r) => ({
      title: `R${r.roundNumber} (Red/Blue)`,
      dataIndex: `r${r.roundNumber}`,
      key: `r${r.roundNumber}`,
    })),
    { title: "Overall Pick", dataIndex: "overall", key: "overall" },
  ];

  return (
    <div>
      <Typography.Title level={5} style={{ marginBottom: 4 }}>
        Bout {bout.boutNumber}: {bout.redName || "Red"} vs{" "}
        {bout.blueName || "Blue"}
      </Typography.Title>
      <Typography.Text type="secondary">
        Winner: {bout.winner || "—"} · Decision: {bout.decision || "—"}
      </Typography.Text>
      <Table
        size="small"
        rowKey="judge"
        dataSource={rows}
        columns={cols}
        pagination={false}
        style={{ marginTop: 8 }}
      />
    </div>
  );
};

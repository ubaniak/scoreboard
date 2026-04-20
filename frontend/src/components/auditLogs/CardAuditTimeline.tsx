import { Divider, Timeline, Typography } from "antd";
import type { AuditLog } from "../../entities/auditLogs";

const { Text } = Typography;

type Props = {
  logs: AuditLog[];
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

export const CardAuditTimeline = ({ logs }: Props) => {
  const sorted = [...logs].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  const groups = new Map<number | "none", AuditLog[]>();
  for (const l of sorted) {
    const key = typeof l.boutId === "number" ? l.boutId : "none";
    groups.set(key, [...(groups.get(key) ?? []), l]);
  }

  return (
    <>
      {[...groups.entries()]
        .sort(([a], [b]) => {
          if (a === "none" && b === "none") return 0;
          if (a === "none") return -1;
          if (b === "none") return 1;
          return a - b;
        })
        .map(([boutId, items]) => (
          <div key={boutId}>
            <Divider orientation="horizontal">
              {boutId === "none" ? "Card" : `Bout ${boutId}`}
            </Divider>
            <Timeline
              items={items.map((l) => {
                const actor = l.actorName
                  ? `${l.actorRole} (${l.actorName})`
                  : l.actorRole;
                return {
                  children: (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "baseline",
                          flexWrap: "wrap",
                        }}
                      >
                        <Text strong>{l.summary}</Text>
                        <Text type="secondary">{actor}</Text>
                        {typeof l.roundNumber === "number" && (
                          <Text type="secondary">• Round {l.roundNumber}</Text>
                        )}
                      </div>
                      <Text type="secondary">{formatTime(l.createdAt)}</Text>
                    </div>
                  ),
                };
              })}
            />
          </div>
        ))}
    </>
  );
};

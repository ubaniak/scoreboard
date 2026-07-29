import { Link } from "@tanstack/react-router";
import { Button, Progress, Typography } from "antd";
import type { Card } from "../../entities/cards";
import type { JudgeDevice } from "../../entities/device";
import { radius, space, tracking, type, useTheme } from "../../theme";

type LiveSpotlightProps = {
  card?: Card;
  judges?: JudgeDevice[];
};

const connectedCount = (judges: JudgeDevice[], numberOfJudges: number) => {
  const assigned = judges.filter((j) => j.role.startsWith("judge")).slice(0, numberOfJudges);
  return assigned.filter((j) => j.status !== "offline" && j.status !== "unknown").length;
};

export const LiveSpotlight = ({ card, judges = [] }: LiveSpotlightProps) => {
  const { colors } = useTheme();

  if (!card) {
    return (
      <div
        style={{
          border: `1px dashed ${colors.border}`,
          borderRadius: radius.lg,
          padding: space.lg,
          textAlign: "center",
          color: colors.textFaint,
          fontSize: type.caption + 1,
          marginBottom: space.xl,
        }}
      >
        No bout is live right now.
      </div>
    );
  }

  const total = card.boutsTotal ?? 0;
  const complete = card.boutsComplete ?? 0;
  const percent = total > 0 ? Math.round((complete / total) * 100) : 0;
  const connected = connectedCount(judges, card.numberOfJudges);

  return (
    <div
      style={{
        marginBottom: space.xl,
        position: "relative",
        borderRadius: radius.lg,
        background: `linear-gradient(180deg, ${colors.insetHighlight} 0%, transparent 55%), linear-gradient(145deg, ${colors.bgElevated} 0%, ${colors.bg} 100%)`,
        border: `1px solid ${colors.borderSubtle}`,
        boxShadow: `${colors.shadowLg}, ${colors.glowBlue}`,
        padding: space.lg,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.md }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {card.name}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: type.caption }}>
            {card.date}
          </Typography.Text>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(22,163,74,0.12)",
            color: "#16a34a",
            padding: "4px 10px",
            borderRadius: radius.pill,
            fontSize: type.caption,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: tracking.caps,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#16a34a",
            }}
          />
          Live
        </div>
      </div>

      <div style={{ marginBottom: space.md }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: type.caption,
            color: colors.textMuted,
            marginBottom: 4,
          }}
        >
          <span>
            Bout {Math.min(complete + 1, total || 1)} of {total}
          </span>
          <span>{percent}%</span>
        </div>
        <Progress percent={percent} showInfo={false} strokeColor={colors.blue} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
        <Typography.Text style={{ fontSize: type.caption, color: colors.textMuted }}>
          {connected} of {card.numberOfJudges} judges connected
        </Typography.Text>
        <Link to="/card/$cardId" params={{ cardId: card.id }}>
          <Button type="primary">Open live bout</Button>
        </Link>
      </div>
    </div>
  );
};


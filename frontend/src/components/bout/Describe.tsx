import {
  CheckOutlined,
  LoadingOutlined,
  LockOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import {
  Col,
  Collapse,
  Descriptions,
  Divider,
  Row,
  Space,
  Typography,
} from "antd";
import type { Bout, RoundDetails } from "../../entities/cards";
import { BLUE, RED } from "../../entities/corner";
import { StatusTag } from "../status/tag";
import { Card } from "../card/card";
import { RoundSummary } from "./RoundSummary";
import { RoundDetailsButton } from "../round/RoundDetailsButton";
import { decisionLabels } from "../bouts/decisionLabels";

const { Text, Title } = Typography;

const statusIcon = (status: RoundDetails["status"]) => {
  if (status === "waiting_for_results") return <LoadingOutlined />;
  if (status === "in_progress" || status === "score_complete")
    return <PlayCircleOutlined />;
  if (status === "complete") return <CheckOutlined />;
  return <LockOutlined />;
};

export type DescribeBoutProps = {
  bout?: Bout;
  onSetRound?: (roundNumber: number) => void;
  activeRoundNumber?: number;
};

const MetaDescriptions = ({ bout }: { bout: Bout }) => (
  <Descriptions size="small" column={{ xs: 2, sm: 3, md: 4 }} colon={false}>
    {bout.referee && (
      <Descriptions.Item label={<Text type="secondary">Referee</Text>}>
        {bout.referee}
      </Descriptions.Item>
    )}
    <Descriptions.Item label={<Text type="secondary">Gloves</Text>}>
      {bout.gloveSize}
    </Descriptions.Item>
    <Descriptions.Item label={<Text type="secondary">Round</Text>}>
      {bout.roundLength} min
    </Descriptions.Item>
    <Descriptions.Item label={<Text type="secondary">Weight</Text>}>
      {bout.weightClass} lbs
    </Descriptions.Item>
    <Descriptions.Item label={<Text type="secondary">Exp</Text>}>
      <span style={{ textTransform: "capitalize" }}>{bout.experience}</span>
    </Descriptions.Item>
    <Descriptions.Item label={<Text type="secondary">Gender</Text>}>
      <span style={{ textTransform: "capitalize" }}>{bout.gender}</span>
    </Descriptions.Item>
    <Descriptions.Item label={<Text type="secondary">Judges</Text>}>
      {bout.numberOfJudges}
    </Descriptions.Item>
  </Descriptions>
);

const ACTIVE_ROUND_STATUSES = new Set(["in_progress", "waiting_for_results", "ready"]);

function findActiveRound(rounds: RoundDetails[]) {
  return rounds.find((r) => ACTIVE_ROUND_STATUSES.has(r.status));
}

const RoundsRow = ({
  rounds,
  activeRoundNumber,
  onSelectRound,
}: {
  rounds: RoundDetails[];
  activeRoundNumber?: number;
  onSelectRound?: (roundNumber: number) => void;
}) => (
  <Row gutter={[12, 12]} style={{ marginTop: 4 }}>
    {rounds.map((r) => {
      const isActive = r.roundNumber === activeRoundNumber;
      const isDimmed = activeRoundNumber !== undefined && !isActive;
      return (
        <Col key={r.roundNumber} xs={24} sm={12} md={8}>
          <div
            style={{
              border: isActive ? "2px solid #faad14" : "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              opacity: isDimmed ? 0.4 : 1,
              transition: "opacity 0.2s, border-color 0.2s",
              background: "transparent",
              position: "relative",
            }}
          >
            <button
              onClick={() => onSelectRound?.(r.roundNumber)}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && onSelectRound?.(r.roundNumber)
              }
              aria-label={`Select Round ${r.roundNumber}`}
              aria-pressed={isActive}
              style={{
                border: "none",
                background: "transparent",
                padding: 12,
                width: "100%",
                textAlign: "left",
                cursor: onSelectRound ? "pointer" : "default",
                color: "inherit",
              }}
            >
              <Row justify="space-between" style={{ marginBottom: 6 }}>
                <Text strong style={{ fontSize: 13 }}>
                  Round {r.roundNumber}
                </Text>
                <span
                  style={{
                    color: r.status === "complete"
                      ? "#52c41a"
                      : (r.status === "in_progress" || r.status === "score_complete" || r.status === "waiting_for_results")
                        ? "#1677ff"
                        : "rgba(255,255,255,0.3)",
                  }}
                >
                  {statusIcon(r.status)}
                </span>
              </Row>
              <RoundSummary round={r} />
            </button>
            <div style={{ padding: "0 8px 8px", textAlign: "right" }}>
              <RoundDetailsButton round={r} />
            </div>
          </div>
        </Col>
      );
    })}
  </Row>
);

export const DescribeBout = ({
  bout,
  onSetRound,
  activeRoundNumber,
}: DescribeBoutProps) => {
  if (!bout) return null;

  const { status, rounds = [] } = bout;
  const isCompleted =
    status === "completed" ||
    status === "decision_made" ||
    status === "show_decision";
  const isInProgress =
    !isCompleted &&
    status !== "not_started" &&
    status !== "cancelled";

  const activeRound = findActiveRound(rounds);

  const winnerColor = bout.winner === "red" ? RED : bout.winner === "blue" ? BLUE : null;
  const winnerName =
    bout.winner === "red"
      ? bout.redCorner
      : bout.winner === "blue"
        ? bout.blueCorner
        : null;

  return (
    <Card>
      {/* Header strip — always visible */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
        <Col>
          <Space size={8}>
            <Text strong>Bout {bout.boutNumber}</Text>
            {bout.boutType && (
              <Text type="secondary" style={{ textTransform: "capitalize" }}>
                {bout.boutType}
              </Text>
            )}
            {bout.ageCategory && (
              <Text type="secondary" style={{ textTransform: "capitalize" }}>
                {bout.ageCategory}
              </Text>
            )}
          </Space>
        </Col>
        <Col>
          <StatusTag text={bout.status} />
        </Col>
      </Row>

      <Divider style={{ margin: "8px 0" }} />

      {/* UPCOMING / NOT STARTED */}
      {!isInProgress && !isCompleted && (
        <>
          <Row align="middle" style={{ marginBottom: 16 }}>
            <Col span={10} style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 11,
                  color: RED,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  marginBottom: 4,
                }}
              >
                Red Corner
              </div>
              <Title level={3} style={{ color: RED, margin: 0 }}>
                {bout.redCorner || "—"}
              </Title>
            </Col>
            <Col span={4} style={{ textAlign: "center" }}>
              <Text strong style={{ fontSize: 20, opacity: 0.3 }}>
                VS
              </Text>
            </Col>
            <Col span={10}>
              <div
                style={{
                  fontSize: 11,
                  color: BLUE,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  marginBottom: 4,
                }}
              >
                Blue Corner
              </div>
              <Title level={3} style={{ color: BLUE, margin: 0 }}>
                {bout.blueCorner || "—"}
              </Title>
            </Col>
          </Row>
          <Divider dashed style={{ margin: "0 0 12px 0" }} />
          <MetaDescriptions bout={bout} />
        </>
      )}

      {/* IN PROGRESS */}
      {isInProgress && (
        <>
          <Row align="middle" style={{ marginBottom: 12 }}>
            <Col span={11} style={{ textAlign: "right" }}>
              <Text strong style={{ color: RED, fontSize: 18 }}>
                {bout.redCorner || "—"}
              </Text>
            </Col>
            <Col span={2} style={{ textAlign: "center" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                vs
              </Text>
            </Col>
            <Col span={11}>
              <Text strong style={{ color: BLUE, fontSize: 18 }}>
                {bout.blueCorner || "—"}
              </Text>
            </Col>
          </Row>

          {rounds.length > 0 && (
            <RoundsRow
              rounds={rounds}
              activeRoundNumber={activeRound?.roundNumber}
              onSelectRound={onSetRound}
            />
          )}

          <Collapse
            ghost
            size="small"
            style={{ marginTop: 8 }}
            items={[
              {
                key: "meta",
                label: <Text type="secondary">Bout Details</Text>,
                children: <MetaDescriptions bout={bout} />,
              },
            ]}
          />
        </>
      )}

      {/* COMPLETED */}
      {isCompleted && (
        <>
          {(winnerName || bout.decision) && (
            <div
              style={{
                background: winnerColor ? `${winnerColor}15` : "transparent",
                border: `1px solid ${winnerColor ?? "#d9d9d9"}`,
                borderRadius: 8,
                padding: "16px 20px",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {bout.decision && (
                <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
                  {decisionLabels[bout.decision] ?? bout.decision}
                </Text>
              )}
              {winnerName && (
                <>
                  <Title level={2} style={{ color: winnerColor ?? undefined, margin: 0 }}>
                    {winnerName}
                  </Title>
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}
                  >
                    Winner
                  </Text>
                </>
              )}
            </div>
          )}

          <Row justify="center" gutter={8} style={{ marginBottom: 8 }}>
            <Col>
              <Text
                style={{
                  color: RED,
                  opacity: bout.winner === "red" ? 1 : 0.3,
                  fontSize: 14,
                }}
              >
                {bout.redCorner || "—"}
              </Text>
            </Col>
            <Col>
              <Text type="secondary">vs</Text>
            </Col>
            <Col>
              <Text
                style={{
                  color: BLUE,
                  opacity: bout.winner === "blue" ? 1 : 0.3,
                  fontSize: 14,
                }}
              >
                {bout.blueCorner || "—"}
              </Text>
            </Col>
          </Row>

          {bout.comments && bout.comments.length > 0 && (
            <Space direction="vertical" size={2} style={{ marginBottom: 4 }}>
              {bout.comments.map((c, i) => (
                <Text key={i} type="secondary" style={{ fontSize: 12 }}>
                  — {c}
                </Text>
              ))}
            </Space>
          )}

          {rounds.length > 0 && (
            <>
              <Divider style={{ margin: "12px 0" }} />
              <RoundsRow
                rounds={rounds}
                activeRoundNumber={activeRoundNumber}
                onSelectRound={onSetRound}
              />
            </>
          )}

          <Collapse
            ghost
            size="small"
            style={{ marginTop: 8 }}
            items={[
              {
                key: "meta",
                label: <Text type="secondary">Bout Details</Text>,
                children: <MetaDescriptions bout={bout} />,
              },
            ]}
          />
        </>
      )}
    </Card>
  );
};

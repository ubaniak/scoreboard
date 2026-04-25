import {
  CheckOutlined,
  LoadingOutlined,
  LockOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Col, Row, Space, Typography } from "antd";
import type { RoundDetails } from "../../entities/cards";

const { Text } = Typography;

const statusIcon = (status: RoundDetails["status"]) => {
  if (status === "waiting_for_results") return <LoadingOutlined />;
  if (status === "in_progress" || status === "score_complete")
    return <PlayCircleOutlined />;
  if (status === "complete") return <CheckOutlined />;
  return <LockOutlined />;
};

const statusLabel = (status: RoundDetails["status"]) =>
  status.replace(/_/g, " ");

const isActive = (status: RoundDetails["status"]) =>
  status === "in_progress" ||
  status === "waiting_for_results" ||
  status === "score_complete";

type RoundSelectorProps = {
  rounds: RoundDetails[];
  selectedIndex: number;
  onSelect: (index: number, roundNumber: number) => void;
};

export const RoundSelector = ({
  rounds,
  selectedIndex,
  onSelect,
}: RoundSelectorProps) => (
  <Row gutter={[12, 12]} style={{ marginBottom: 8 }}>
    {rounds.map((r, i) => {
      const active = isActive(r.status);
      const selected = selectedIndex === i;
      const complete = r.status === "complete";
      return (
        <Col key={r.roundNumber} xs={8}>
          <button
            onClick={() => onSelect(i, r.roundNumber)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && onSelect(i, r.roundNumber)
            }
            aria-label={`Select Round ${r.roundNumber}`}
            aria-pressed={selected}
            style={{
              cursor: "pointer",
              borderRadius: 12,
              padding: "12px 16px",
              border: selected
                ? "2px solid #1677ff"
                : active
                  ? "2px solid rgba(255,255,255,0.25)"
                  : "2px solid rgba(255,255,255,0.08)",
              background: active
                ? "rgba(22,119,255,0.12)"
                : selected
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(255,255,255,0.02)",
              transition: "border-color 0.2s, background 0.2s",
              width: "100%",
              display: "block",
              textAlign: "left",
            }}
          >
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Space style={{ justifyContent: "space-between", width: "100%" }}>
                <Text style={{ fontWeight: 700, fontSize: 14 }}>
                  Round {r.roundNumber}
                </Text>
                <span
                  style={{
                    color: complete
                      ? "#52c41a"
                      : active
                        ? "#1677ff"
                        : "rgba(255,255,255,0.3)",
                  }}
                >
                  {statusIcon(r.status)}
                </span>
              </Space>
              <Text
                style={{
                  fontSize: 11,
                  textTransform: "capitalize",
                  color: active
                    ? "#1677ff"
                    : complete
                      ? "#52c41a"
                      : "rgba(255,255,255,0.35)",
                }}
              >
                {statusLabel(r.status)}
              </Text>
            </Space>
          </button>
        </Col>
      );
    })}
  </Row>
);

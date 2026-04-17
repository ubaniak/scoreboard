import { Col, Divider, Row, Space, Tag, Typography } from "antd";
import type { Bout, RoundDetails } from "../../entities/cards";
import { StatusTag } from "../status/tag";
import { Card } from "../card/card";

const { Text, Title } = Typography;

const decisionLabels: Record<string, string> = {
  ud: "Unanimous Decision",
  sd: "Split Decision",
  md: "Majority Decision",
  rsc: "Referee Stop Contest",
  "rsc-i": "Referee Stop Contest (Injury)",
  abd: "Abandon",
  dq: "Disqualified",
  c: "Cancelled",
  wo: "Walk Over",
};

type RoundSummaryProps = {
  round: RoundDetails;
};

const RoundSummary = ({ round }: RoundSummaryProps) => {
  const redWarnings = round.red.warnings.length;
  const blueWarnings = round.blue.warnings.length;
  const redCautions = round.red.cautions.length;
  const blueCautions = round.blue.cautions.length;
  const redEights = round.red.eightCounts;
  const blueEights = round.blue.eightCounts;

  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
        Round {round.roundNumber}
      </Text>
      <Space direction="vertical" size={4}>
        <Space size={4}>
          <Text style={{ fontSize: 12, minWidth: 70 }} type="secondary">Cautions</Text>
          <Text style={{ color: "#ff4d4f", fontWeight: 700, fontSize: 12 }}>{redCautions}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>|</Text>
          <Text style={{ color: "#1677ff", fontWeight: 700, fontSize: 12 }}>{blueCautions}</Text>
        </Space>
        <Space size={4}>
          <Text style={{ fontSize: 12, minWidth: 70 }} type="secondary">Warnings</Text>
          <Text style={{ color: "#ff4d4f", fontWeight: 700, fontSize: 12 }}>{redWarnings}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>|</Text>
          <Text style={{ color: "#1677ff", fontWeight: 700, fontSize: 12 }}>{blueWarnings}</Text>
        </Space>
        <Space size={4}>
          <Text style={{ fontSize: 12, minWidth: 70 }} type="secondary">8-Counts</Text>
          <Text style={{ color: "#ff4d4f", fontWeight: 700, fontSize: 12 }}>{redEights}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>|</Text>
          <Text style={{ color: "#1677ff", fontWeight: 700, fontSize: 12 }}>{blueEights}</Text>
        </Space>
      </Space>
    </div>
  );
};

export type DescribeBoutProps = {
  bout?: Bout;
};

export const DescribeBout = ({ bout }: DescribeBoutProps) => {
  const isCompleted = bout?.status === "completed";
  const rounds = bout?.rounds ?? [];

  return (
    <Card>
      <Row gutter={[24, 16]} align="top">
        {/* Bout identity */}
        <Col xs={24} sm={12} md={8}>
          <Space align="baseline" size={12}>
            <Title level={3} style={{ margin: 0 }}>
              Bout {bout?.boutNumber}
            </Title>
            <StatusTag text={bout?.status || ""} />
          </Space>
          <Space wrap size={12} style={{ marginTop: 8 }}>
            {bout?.boutType && (
              <Space size={4}>
                <Text type="secondary">Type:</Text>
                <Text strong style={{ textTransform: "capitalize" }}>{bout.boutType}</Text>
              </Space>
            )}
            {bout?.referee && (
              <Space size={4}>
                <Text type="secondary">Referee:</Text>
                <Text strong>{bout.referee}</Text>
              </Space>
            )}
          </Space>
          <Space wrap size={12} style={{ marginTop: 6 }}>
            <Space size={4}>
              <Text type="secondary">Weight:</Text>
              <Text>{bout?.weightClass} lbs</Text>
            </Space>
            <Space size={4}>
              <Text type="secondary">Gloves:</Text>
              <Text>{bout?.gloveSize}</Text>
            </Space>
            <Space size={4}>
              <Text type="secondary">Round:</Text>
              <Text>{bout?.roundLength} min</Text>
            </Space>
            <Space size={4}>
              <Text type="secondary">Age:</Text>
              <Text>{bout?.ageCategory}</Text>
            </Space>
            <Space size={4}>
              <Text type="secondary">Exp:</Text>
              <Text style={{ textTransform: "capitalize" }}>{bout?.experience}</Text>
            </Space>
          </Space>
        </Col>

        {/* Round summaries */}
        {rounds.length > 0 && (
          <>
            <Col xs={24} md={0}>
              <Divider style={{ margin: "8px 0" }} />
            </Col>
            <Col xs={0} md={1} style={{ display: "flex", justifyContent: "center" }}>
              <Divider type="vertical" style={{ height: "100%", minHeight: 80 }} />
            </Col>
            <Col xs={24} sm={12} md={15}>
              <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                Round Summary
              </Text>
              <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
                {rounds.map((r) => (
                  <Col key={r.roundNumber} xs={8}>
                    <RoundSummary round={r} />
                  </Col>
                ))}
              </Row>
            </Col>
          </>
        )}

        {/* Decision result */}
        {isCompleted && (bout?.winner || bout?.decision) && (
          <Col xs={24}>
            <Divider style={{ margin: "8px 0" }} />
            <Space wrap size={16}>
              {bout?.winner && bout.winner !== "na" && (
                <Space size={4}>
                  <Text type="secondary">Winner:</Text>
                  <Tag color={bout.winner === "red" ? "red" : "blue"} style={{ fontWeight: 700 }}>
                    {bout.winner === "red" ? "Red" : "Blue"}
                  </Tag>
                </Space>
              )}
              {bout?.decision && (
                <Space size={4}>
                  <Text type="secondary">Decision:</Text>
                  <Text strong>{decisionLabels[bout.decision] ?? bout.decision}</Text>
                </Space>
              )}
            </Space>
            {bout?.comments && bout.comments.length > 0 && (
              <Space direction="vertical" size={2} style={{ marginTop: 6 }}>
                {bout.comments.map((c, i) => (
                  <Text key={i} type="secondary">{c}</Text>
                ))}
              </Space>
            )}
          </Col>
        )}
      </Row>
    </Card>
  );
};

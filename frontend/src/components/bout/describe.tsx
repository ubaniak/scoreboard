import { Col, Divider, Row, Space, Tag, Typography } from "antd";
const { Text, Title } = Typography;
import type { Bout } from "../../entities/cards";
import { StatusTag } from "../status/tag";
import { Card } from "../card/card";

export type DescribeBoutProps = {
  bout?: Bout;
};

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

export const DescribeBout = (props: DescribeBoutProps) => {
  const bout = props.bout;
  const isCompleted = bout?.status === "completed";

  return (
    <Card>
      <Row gutter={[16, 16]} align="middle">
        <Col flex="auto">
          <Space align="baseline" size={16}>
            <Title level={3} style={{ margin: 0 }}>
              Bout {bout?.boutNumber}
            </Title>
            <StatusTag text={bout?.status || ""} />
          </Space>
          <Space wrap size={16} align="baseline" style={{ marginTop: 8 }}>
            {bout?.boutType && (
              <Space>
                <Text type="secondary">Type:</Text>
                <Text style={{ fontWeight: 700, textTransform: "capitalize" }}>{bout.boutType}</Text>
              </Space>
            )}
            <Space>
              <Text type="secondary">Weight Class:</Text>
              <Text style={{ fontWeight: 700 }}>{bout?.weightClass}</Text>
            </Space>
            <Space>
              <Text type="secondary">Glove Size:</Text>
              <Text style={{ fontWeight: 700 }}>{bout?.gloveSize}</Text>
            </Space>
            <Space>
              <Text type="secondary">Experience:</Text>
              <Text style={{ fontWeight: 700 }}>{bout?.experience}</Text>
            </Space>
            <Space>
              <Text type="secondary">Round Length (min):</Text>
              <Text style={{ fontWeight: 700 }}>{bout?.roundLength}</Text>
            </Space>
            <Space>
              <Text type="secondary">Age Category:</Text>
              <Text style={{ fontWeight: 700 }}>{bout?.ageCategory}</Text>
            </Space>
            {bout?.referee && (
              <Space>
                <Text type="secondary">Referee:</Text>
                <Text style={{ fontWeight: 700 }}>{bout.referee}</Text>
              </Space>
            )}
          </Space>

          {isCompleted && (bout?.winner || bout?.decision) && (
            <>
              <Divider style={{ margin: "12px 0" }} />
              <Space wrap size={16} align="baseline">
                {bout.winner && bout.winner !== "na" && (
                  <Space>
                    <Text type="secondary">Winner:</Text>
                    <Tag color={bout.winner === "red" ? "red" : "blue"} style={{ fontWeight: 700 }}>
                      {bout.winner === "red" ? "Red" : "Blue"}
                    </Tag>
                  </Space>
                )}
                {bout.decision && (
                  <Space>
                    <Text type="secondary">Decision:</Text>
                    <Text style={{ fontWeight: 700 }}>
                      {decisionLabels[bout.decision] ?? bout.decision}
                    </Text>
                  </Space>
                )}
              </Space>
              {bout.comments && bout.comments.length > 0 && (
                <Space direction="vertical" size={4} style={{ marginTop: 8, width: "100%" }}>
                  <Text type="secondary">Comments:</Text>
                  {bout.comments.map((c, i) => (
                    <Text key={i}>{c}</Text>
                  ))}
                </Space>
              )}
            </>
          )}
        </Col>
      </Row>
    </Card>
  );
};

import { useNavigate } from "@tanstack/react-router";
import { Button, Col, Divider, Row, Space, Typography } from "antd";
import type { Bout } from "../../entities/cards";
import { Card } from "../card/card";

const { Text, Title } = Typography;

type Props = {
  bouts: Bout[];
  cardId: string;
};

export const NextBout = ({ bouts, cardId }: Props) => {
  const navigate = useNavigate();

  const current = bouts
    .filter((b) => b.status === "in_progress")
    .sort((a, b) => a.boutNumber - b.boutNumber)[0];

  const next = bouts
    .filter((b) => b.status === "not_started")
    .sort((a, b) => a.boutNumber - b.boutNumber)[0];

  if (!current && !next) return null;

  return (
    <Card title="Quick Access">
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {current && (
          <>
            <Row align="middle" justify="space-between" gutter={[16, 16]}>
              <Col>
                <Space direction="vertical" size={4}>
                  <Title level={5} style={{ margin: 0 }}>
                    Current bout
                  </Title>
                  <Title level={4} style={{ margin: 0 }}>
                    Bout {current.boutNumber}
                  </Title>
                  <Space wrap size={16}>
                    <Space>
                      <Text type="secondary">Red:</Text>
                      <Text strong>{current.redCorner}</Text>
                    </Space>
                    <Space>
                      <Text type="secondary">Blue:</Text>
                      <Text strong>{current.blueCorner}</Text>
                    </Space>
                  </Space>
                </Space>
              </Col>
              <Col>
                <Button
                  type="primary"
                  onClick={() =>
                    navigate({ to: `/card/${cardId}/bout/${current.id}` })
                  }
                >
                  Open
                </Button>
              </Col>
            </Row>
            {next && <Divider style={{ margin: 0 }} />}
          </>
        )}

        {next && (
          <Row align="middle" justify="space-between" gutter={[16, 16]}>
            <Col>
              <Space direction="vertical" size={4}>
                <Title level={5} style={{ margin: 0 }}>
                  Next bout
                </Title>
                <Title level={4} style={{ margin: 0 }}>
                  Bout {next.boutNumber}
                </Title>
                <Space wrap size={16}>
                  <Space>
                    <Text type="secondary">Red:</Text>
                    <Text strong>{next.redCorner}</Text>
                  </Space>
                  <Space>
                    <Text type="secondary">Blue:</Text>
                    <Text strong>{next.blueCorner}</Text>
                  </Space>
                  <Space>
                    <Text type="secondary">Age:</Text>
                    <Text>{next.ageCategory}</Text>
                  </Space>
                  <Space>
                    <Text type="secondary">Experience:</Text>
                    <Text>{next.experience}</Text>
                  </Space>
                  <Space>
                    <Text type="secondary">Weight:</Text>
                    <Text>{next.weightClass} lbs</Text>
                  </Space>
                </Space>
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                onClick={() => navigate({ to: `/card/${cardId}/bout/${next.id}` })}
              >
                Open
              </Button>
            </Col>
          </Row>
        )}
      </Space>
    </Card>
  );
};

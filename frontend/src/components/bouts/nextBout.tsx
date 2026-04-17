import { useNavigate } from "@tanstack/react-router";
import { Button, Col, Row, Space, Typography } from "antd";
import type { Bout } from "../../entities/cards";
import { Card } from "../card/card";

const { Text, Title } = Typography;

type Props = {
  bouts: Bout[];
  cardId: string;
};

export const NextBout = ({ bouts, cardId }: Props) => {
  const navigate = useNavigate();

  const next = bouts
    .filter((b) => b.status === "not_started")
    .sort((a, b) => a.boutNumber - b.boutNumber)[0];

  if (!next) return null;

  return (
    <Card title="Next Bout">
      <Row align="middle" justify="space-between" gutter={[16, 16]}>
        <Col>
          <Space direction="vertical" size={4}>
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
            Go to Bout
          </Button>
        </Col>
      </Row>
    </Card>
  );
};

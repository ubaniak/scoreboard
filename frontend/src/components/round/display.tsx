import { Col, Row, Space, Typography } from "antd";
import type { RoundDetails } from "../../entities/cards";
import { Card } from "../card/card";
import { StatusTag } from "../status/tag";
const { Text } = Typography;

export type RoundDisplayProps = {
  round?: RoundDetails;
};

export const RoundDisplay = (props: RoundDisplayProps) => {
  return (
    <Card>
      <Row gutter={[16, 16]} align="middle">
        <Col flex="auto">
          <Space wrap size={16} align="baseline">
            <Space>
              <Text type="secondary">Round number:</Text>
              <Text style={{ fontWeight: 700 }}>
                {props.round?.roundNumber}
              </Text>
            </Space>
          </Space>
        </Col>
        <Col>
          <StatusTag text={props.round?.status || ""} />{" "}
        </Col>
      </Row>
    </Card>
  );
};

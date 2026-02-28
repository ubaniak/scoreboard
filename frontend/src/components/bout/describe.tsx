import { Col, Row, Space, Typography } from "antd";
const { Text } = Typography;
import type { Bout } from "../../entities/cards";
import { StatusTag } from "../status/tag";
import { Card } from "../card/card";

export type DescribeBoutProps = {
  bout?: Bout;
};
export const DescribeBout = (props: DescribeBoutProps) => {
  return (
    <Card>
      <Row gutter={[16, 16]} align="middle">
        <Col flex="auto">
          <Space wrap size={16} align="baseline">
            <Space>
              <Text type="secondary">Bout number:</Text>
              <Text style={{ fontWeight: 700 }}>{props.bout?.boutNumber}</Text>
            </Space>
            <Space>
              <Text type="secondary">Weight Class:</Text>
              <Text style={{ fontWeight: 700 }}>{props.bout?.weightClass}</Text>
            </Space>
            <Space>
              <Text type="secondary">Glove Size:</Text>
              <Text style={{ fontWeight: 700 }}>{props.bout?.gloveSize}</Text>
            </Space>
            <Space>
              <Text type="secondary">Experience:</Text>
              <Text style={{ fontWeight: 700 }}>{props.bout?.experience}</Text>
            </Space>
            <Space>
              <Text type="secondary">Round Length (min):</Text>
              <Text style={{ fontWeight: 700 }}>{props.bout?.roundLength}</Text>
            </Space>
            <Space>
              <Text type="secondary">Age Category:</Text>
              <Text style={{ fontWeight: 700 }}>{props.bout?.ageCategory}</Text>
            </Space>
          </Space>
        </Col>
        <Col>
          <StatusTag text={props.bout?.status || ""} />
        </Col>
      </Row>
    </Card>
  );
};

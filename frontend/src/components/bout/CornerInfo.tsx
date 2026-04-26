import { Col, Row } from "antd";
import { CornerPanel } from "./CornerPanel";
import type { Bout } from "../../entities/cards";

export type CornerInfoProps = {
  bout?: Bout;
};

export const CornerInfo = (props: CornerInfoProps) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <CornerPanel corner="red" athleteName={props.bout?.redCorner} />
      </Col>

      <Col xs={24} md={12}>
        <CornerPanel corner="blue" athleteName={props.bout?.blueCorner} />
      </Col>
    </Row>
  );
};

import { Col, Divider, Flex, Row } from "antd";
import { Typography } from "antd";

const { Title } = Typography;

export type PageLayoutProps = {
  title?: string;
  subheading?: string | React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export const PageLayout = (props: PageLayoutProps) => {
  return (
    <>
      <Row>
        <Col span={12}>
          <Flex vertical={true}>
            <Title style={{ margin: 0 }}>{props.title}</Title>
            <Title level={5} style={{ margin: 0 }}>
              {props.subheading}
            </Title>
          </Flex>
        </Col>
        <Col span={12}>{props.actions}</Col>
      </Row>
      <Divider />
      <Row>
        <Col span={24}>{props.children}</Col>
      </Row>
    </>
  );
};

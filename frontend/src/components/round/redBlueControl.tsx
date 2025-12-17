import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Flex } from "antd";

export type RedBlueControlProps = {
  title: string;
  onRedUpClick: () => void;
  onRedDownClick: () => void;
  onBlueUpClick: () => void;
  onBlueDownClick: () => void;
  total: React.ReactNode;
};
<Card.Grid>content</Card.Grid>;

export const RedBlueControl = (props: RedBlueControlProps) => {
  const gridStyle: React.CSSProperties = {
    width: "50%",
    textAlign: "center",
  };

  const fullWidthStyle: React.CSSProperties = {
    width: "100%",
    textAlign: "center",
  };
  const redColor = "red";
  const blueColor = "#1890ff";
  return (
    <Card title={props.title} style={{ width: 300 }}>
      <Card.Grid style={gridStyle} hoverable={false}>
        <div>Red</div>
        <Flex vertical align="center">
          <Button
            icon={<ArrowUpOutlined style={{ color: redColor }} />}
            onClick={props.onRedUpClick}
          />
          <Button
            icon={<ArrowDownOutlined style={{ color: redColor }} />}
            onClick={props.onRedDownClick}
          />
        </Flex>
      </Card.Grid>
      <Card.Grid style={gridStyle} hoverable={false}>
        <div>Blue</div>
        <Flex vertical align="center">
          <Button
            icon={<ArrowUpOutlined style={{ color: blueColor }} />}
            onClick={props.onBlueUpClick}
          />
          <Button
            icon={<ArrowDownOutlined style={{ color: blueColor }} />}
            onClick={props.onBlueDownClick}
          />
        </Flex>
      </Card.Grid>
      <Card.Grid style={fullWidthStyle} hoverable={false}>
        <div>Total</div>
        {props.total}
      </Card.Grid>
    </Card>
  );
};

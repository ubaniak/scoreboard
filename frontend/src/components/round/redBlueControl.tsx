import { Card } from "antd";

export type RedBlueControlProps = {
  title: string;
  red: React.ReactNode;
  blue: React.ReactNode;
  redTotal: React.ReactNode;
  blueTotal: React.ReactNode;
};

export const RedBlueControl = (props: RedBlueControlProps) => {
  const gridStyle: React.CSSProperties = {
    width: "50%",
    textAlign: "center",
  };

  // const fullWidthStyle: React.CSSProperties = {
  //   width: "100%",
  //   textAlign: "center",
  // };
  return (
    <Card title={props.title} style={{ width: 300 }}>
      <Card.Grid style={gridStyle} hoverable={false}>
        <div>Red</div>
        {props.red}
      </Card.Grid>
      <Card.Grid style={gridStyle} hoverable={false}>
        <div>Blue</div>
        {props.blue}
      </Card.Grid>
      <Card.Grid style={gridStyle} hoverable={false}>
        {props.redTotal}
      </Card.Grid>
      <Card.Grid style={gridStyle} hoverable={false}>
        {props.blueTotal}
      </Card.Grid>
    </Card>
  );
};

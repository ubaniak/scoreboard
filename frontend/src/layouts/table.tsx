import { Card } from "../components/card/card";
import { Heading } from "../components/heading/heading";

export type TableLayoutProps = {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export const TableLayout = (props: TableLayoutProps) => {
  return (
    <Card
      title={props.title && <Heading title={props.title} />}
      extra={props.actions}
    >
      {props.children}
    </Card>
  );
};

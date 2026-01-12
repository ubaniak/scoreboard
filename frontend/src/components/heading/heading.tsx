import { Typography } from "antd";
import type { TitleProps } from "antd/es/typography/Title";

const { Text, Title } = Typography;

export interface HeadingProps extends TitleProps {
  title: string;
  subtitle?: string | React.ReactNode;
}
export const Heading = (props: HeadingProps) => {
  return (
    <>
      <Title {...props}>{props.title}</Title>
      {props.subtitle && <Text type="secondary">{props.subtitle}</Text>}
    </>
  );
};

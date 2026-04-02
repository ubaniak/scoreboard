import { Flex, Typography } from "antd";
const { Text } = Typography;

export type DisplayScoreProps = {
  red: number;
  blue: number;
};

export const DisplayScore = ({ red, blue }: DisplayScoreProps) => {
  return (
    <Flex gap="small" align="center">
      <Text
        style={{
          color: "#ff4d4f",
          fontFamily: "monospace",
          fontWeight: 700,
          minWidth: 24,
          textAlign: "center",
          ...(red > blue && {
            border: "2px solid #ff4d4f",
            borderRadius: 4,
            padding: "0 6px",
          }),
        }}
      >
        {red}
      </Text>
      <Text type="secondary">–</Text>
      <Text
        style={{
          color: "#1677ff",
          fontFamily: "monospace",
          fontWeight: 700,
          minWidth: 24,
          textAlign: "center",
          ...(blue > red && {
            border: "2px solid #1677ff",
            borderRadius: 4,
            padding: "0 6px",
          }),
        }}
      >
        {blue}
      </Text>
    </Flex>
  );
};

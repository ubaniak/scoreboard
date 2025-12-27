import { Badge } from "antd";

type BadgeStatus = "default" | "success" | "processing" | "error";

export const StatusBadge = ({ text }: { text: string }) => {
  let status: BadgeStatus = "default";
  if (text === "inProgress") {
    status = "processing";
  }
  if (text === "cancelled") {
    status = "error";
  }

  if (text === "complete") {
    status = "success";
  }

  return <Badge text={text} status={status} />;
};

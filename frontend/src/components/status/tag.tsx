import { Tag } from "antd";

type TagColors =
  | "default"
  | "success"
  | "processing"
  | "warning"
  | "error"
  | "orange";

export const StatusTag = ({ text }: { text: string }) => {
  let color: TagColors = "default";
  let message = text;

  if (text === "upcoming") {
    message = "Upcoming";
  }

  if (text === "not_started") {
    message = "Not started";
    color = "default";
  }

  if (text === "ready") {
    message = "Ready";
    color = "orange";
  }

  if (text === "waiting_for_results") {
    message = "Waiting for results";
    color = "warning";
  }

  if (text === "in_progress") {
    color = "processing";
    message = "In progress";
  }

  if (text === "complete") {
    message = "Complete";
    color = "success";
  }

  return (
    <Tag variant="outlined" color={color}>
      {message}
    </Tag>
  );
};

import { Tag } from "antd";
import type { DeviceStatus } from "../../entities/device";
import type { TagColors } from "./tag";

export const DeviceStatusTag = ({ status }: { status: DeviceStatus }) => {
  let color: TagColors = "success";
  if (status === "offline") {
    color = "error";
  }

  if (status === "unknown") {
    color = "orange";
  }
  return (
    <Tag variant="outlined" color={color}>
      {status}
    </Tag>
  );
};

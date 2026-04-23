import { Tag } from "antd";
import type { DeviceStatus } from "../../entities/device";
import type { TagColors } from "./tag";

const STATUS_COLOR: Record<DeviceStatus, TagColors> = {
  connected: "blue",
  ready: "cyan",
  requested: "orange",
  complete: "success",
  offline: "error",
  unknown: "default",
};

export const DeviceStatusTag = ({ status }: { status: DeviceStatus }) => (
  <Tag variant="outlined" color={STATUS_COLOR[status] ?? "default"}>
    {status}
  </Tag>
);

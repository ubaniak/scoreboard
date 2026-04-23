export type DeviceStatus = "unknown" | "offline" | "connected" | "ready" | "requested" | "complete";

export type JudgeDevice = {
  role: string;
  code: string;
  status: DeviceStatus;
};

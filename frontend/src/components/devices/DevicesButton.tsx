import { useGetBaseUrl, useJudgeDevices, useMutationGenerateCode } from "../../api/devices";
import { useProfile } from "../../providers/login";
import { DeviceQuickLook } from "./DeviceQuickLook";

type Props = {
  requiredJudges?: number;
};

export const DevicesButton = ({ requiredJudges = 5 }: Props) => {
  const { token, role } = useProfile();

  const judgeDevices = useJudgeDevices({ token });
  const generateCode = useMutationGenerateCode({ token });
  const { data: baseUrl } = useGetBaseUrl({ token });

  if (!token || role !== "admin") return null;

  return (
    <DeviceQuickLook
      requiredJudges={requiredJudges}
      devices={judgeDevices.data || []}
      baseUrl={baseUrl}
      onRefreshCode={(values) => generateCode.mutate(values)}
    />
  );
};

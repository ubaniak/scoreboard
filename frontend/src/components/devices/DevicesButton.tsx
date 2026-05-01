import { useGetBaseUrl, useJudgeDevices, useMutationGenerateCode } from "../../api/devices";
import { useProfile } from "../../providers/login";
import { DeviceQuickLook } from "./DeviceQuickLook";

type Props = {
  requiredJudges?: number;
};

type AdminProps = {
  token: string;
  requiredJudges: number;
};

const AdminDevicesButton = ({ token, requiredJudges }: AdminProps) => {
  const judgeDevices = useJudgeDevices({ token });
  const generateCode = useMutationGenerateCode({ token });
  const { data: baseUrl } = useGetBaseUrl({ token });

  return (
    <DeviceQuickLook
      requiredJudges={requiredJudges}
      devices={judgeDevices.data || []}
      baseUrl={baseUrl}
      onRefreshCode={(values) => generateCode.mutate(values)}
    />
  );
};

export const DevicesButton = ({ requiredJudges = 5 }: Props) => {
  const { token, role } = useProfile();

  if (!token || role !== "admin") return null;

  return <AdminDevicesButton token={token} requiredJudges={requiredJudges} />;
};

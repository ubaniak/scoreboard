import { DataDump } from "../../components/settings/DataDump";
import { useProfile } from "../../providers/login";

export const SettingsDataPage = () => {
  const { token } = useProfile();
  return <DataDump token={token} />;
};

import { GoogleDrive } from "../../components/settings/GoogleDrive";
import { useProfile } from "../../providers/login";

export const SettingsGoogleDrivePage = () => {
  const { token } = useProfile();
  return <GoogleDrive token={token} />;
};

import { Descriptions, Flex, QRCode, type DescriptionsProps } from "antd";
import { useGetBaseUrl, useRegister } from "../../api/devices";
import { useProfile } from "../../providers/login";

export type ConnectDeviceProps = {
  judgeNumber: number;
};

export const ConnectDevice = (props: ConnectDeviceProps) => {
  const profile = useProfile();
  const { data: baseUrlData } = useGetBaseUrl(profile.token);
  const { data: register } = useRegister(profile.token, props.judgeNumber);

  const url = `http://${baseUrlData?.data}:8080`; //?role=judge${props.judgeNumber}`;

  const items: DescriptionsProps["items"] = [
    {
      key: 1,
      label: "QR Code",
      children: <QRCode value={url} />,
    },
    {
      key: 2,
      label: "Url",
      children: url,
    },
    {
      key: 2,
      label: "Role",
      children: `judge${props.judgeNumber}`,
    },
    {
      key: 3,
      label: "code",
      children: register?.data,
    },
  ];

  return (
    <Flex vertical={true}>
      <Descriptions
        bordered
        items={items}
        size="small"
        layout="horizontal"
        column={1}
      />
    </Flex>
  );
};

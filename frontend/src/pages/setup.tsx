import { useNavigate } from "@tanstack/react-router";
import { App, Button, Space, Steps, Typography } from "antd";
import { useState } from "react";
import { useMutateSetup, useSetupStatus } from "../api/setup";

const { Title, Text, Paragraph } = Typography;

export const SetupPage = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { data: status } = useSetupStatus();
  const { mutateAsync: doSetup, isPending } = useMutateSetup();
  const [adminCode, setAdminCode] = useState<string | null>(null);

  if (status && !status.required) {
    navigate({ to: "/login" });
    return null;
  }

  const handleInit = async () => {
    try {
      const result = await doSetup();
      setAdminCode(result.code);
    } catch {
      message.error("Setup failed — please restart the application and try again");
    }
  };

  const handleCopyAndLogin = () => {
    if (adminCode) {
      navigator.clipboard.writeText(adminCode);
      message.success("Code copied");
    }
    navigate({ to: "/login" });
  };

  const currentStep = adminCode ? 1 : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0f1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        <Space direction="vertical" size={32} style={{ width: "100%" }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Welcome to Scoreboard
            </Title>
            <Text type="secondary">First-time setup</Text>
          </div>

          <Steps
            current={currentStep}
            items={[
              { title: "Initialize" },
              { title: "Save Admin Code" },
            ]}
          />

          {currentStep === 0 && (
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Paragraph type="secondary">
                Click below to generate your admin access code. Save it somewhere
                safe — you will need it to log in.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                block
                loading={isPending}
                onClick={handleInit}
              >
                Initialize Application
              </Button>
            </Space>
          )}

          {currentStep === 1 && adminCode && (
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Paragraph type="secondary">
                Your admin code has been generated. Copy it and use it to log in
                as <Text code>admin</Text>.
              </Paragraph>
              <div
                style={{
                  background: "#131929",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  padding: "24px 16px",
                  textAlign: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 36,
                    fontFamily: "monospace",
                    letterSpacing: 8,
                    color: "#1677ff",
                    fontWeight: 700,
                  }}
                >
                  {adminCode}
                </Text>
              </div>
              <Button type="primary" size="large" block onClick={handleCopyAndLogin}>
                Copy Code &amp; Go to Login
              </Button>
            </Space>
          )}
        </Space>
      </div>
    </div>
  );
};

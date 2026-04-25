import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  DisconnectOutlined,
  ExportOutlined,
  FileAddOutlined,
  ImportOutlined,
  LinkOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Badge,
  Button,
  Divider,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Popconfirm,
  Space,
  Steps,
  Typography,
} from "antd";
import { useState } from "react";
import {
  useGetGDriveAuthUrl,
  useGetGDriveConfig,
  useMutateGDriveConfig,
  useMutateGDriveDisconnect,
  useMutateGDriveExport,
  useMutateGDriveImport,
  useMutateGDriveTemplate,
} from "../../api/gdrive";
import { useListCards } from "../../api/cards";
import type { TokenBase } from "../../api/entities";

const { Text, Title, Paragraph, Link } = Typography;

const HelpModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Modal
    open={open}
    onCancel={onClose}
    footer={<Button onClick={onClose}>Close</Button>}
    title="How to set up Google Drive"
    width={640}
  >
    <Steps
      direction="vertical"
      size="small"
      items={[
        {
          title: "Create a Google Cloud project",
          description: (
            <Space direction="vertical" size={2}>
              <Text>Go to <Link href="https://console.cloud.google.com" target="_blank">console.cloud.google.com</Link> and create a new project (or pick an existing one).</Text>
            </Space>
          ),
          status: "process",
        },
        {
          title: "Enable the APIs",
          description: (
            <Space direction="vertical" size={2}>
              <Text>In your project, go to <Text strong>APIs &amp; Services → Library</Text> and enable:</Text>
              <Text><Text code>Google Sheets API</Text> — for importing data</Text>
              <Text><Text code>Google Drive API</Text> — for exporting reports</Text>
            </Space>
          ),
          status: "process",
        },
        {
          title: "Create OAuth credentials",
          description: (
            <Space direction="vertical" size={2}>
              <Text>Go to <Text strong>APIs &amp; Services → Credentials → Create Credentials → OAuth client ID</Text>.</Text>
              <Text>Application type: <Text strong>Web application</Text>.</Text>
              <Text>Under <Text strong>Authorised redirect URIs</Text> add exactly:</Text>
              <Text code>http://localhost:8080/api/gdrive/callback</Text>
              <Text>Copy the <Text strong>Client ID</Text> and <Text strong>Client Secret</Text> into the config modal.</Text>
            </Space>
          ),
          status: "process",
        },
        {
          title: "Get your Google Sheet ID",
          description: (
            <Space direction="vertical" size={2}>
              <Text>Open your spreadsheet in Google Sheets. The URL looks like:</Text>
              <Text code>https://docs.google.com/spreadsheets/d/<Text strong>SHEET_ID</Text>/edit</Text>
              <Text>Copy the highlighted part and paste it into <Text strong>Google Sheet ID</Text>.</Text>
              <Text type="secondary">The sheet must have tabs named exactly: <Text code>Athletes</Text>, <Text code>Officials</Text>, <Text code>Clubs</Text>, <Text code>Cards</Text>.</Text>
            </Space>
          ),
          status: "process",
        },
        {
          title: "Get your Drive Folder ID (optional)",
          description: (
            <Space direction="vertical" size={2}>
              <Text>Open the folder in Google Drive. The URL looks like:</Text>
              <Text code>https://drive.google.com/drive/folders/<Text strong>FOLDER_ID</Text></Text>
              <Text>Copy the highlighted part. Leave blank to upload to Drive root.</Text>
            </Space>
          ),
          status: "process",
        },
        {
          title: "Save config and connect",
          description: (
            <Text>Click <Text strong>Save Config</Text>, then <Text strong>Connect to Google</Text>. A browser tab opens — sign in and grant access. You'll be redirected back here.</Text>
          ),
          status: "process",
        },
      ]}
    />
  </Modal>
);

type ConfigModalProps = {
  open: boolean;
  onClose: () => void;
  initialValues: { clientId: string; clientSecret: string; sheetId: string; folderId: string };
  onSave: (values: { clientId: string; clientSecret: string; sheetId: string; folderId: string }) => Promise<void>;
  saving: boolean;
};

const ConfigModal = ({ open, onClose, initialValues, onSave, saving }: ConfigModalProps) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSave(values);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      okText="Save Config"
      title="Google Drive Configuration"
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={initialValues} style={{ marginTop: 16 }}>
        <Form.Item label="Client ID" name="clientId">
          <Input placeholder="from Google Cloud Console" />
        </Form.Item>
        <Form.Item label="Client Secret" name="clientSecret">
          <Input.Password placeholder="from Google Cloud Console" />
        </Form.Item>
        <Form.Item
          label="Google Sheet ID"
          name="sheetId"
          extra="The ID from the spreadsheet URL: /spreadsheets/d/<ID>/edit"
        >
          <Input placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" />
        </Form.Item>
        <Form.Item
          label="Drive Folder ID (optional)"
          name="folderId"
          extra="Leave blank to upload to root. Get the ID from the folder URL."
        >
          <Input placeholder="1A2B3C4D5E6F7G8H9I" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const GoogleDrive = ({ token }: TokenBase) => {
  const { message } = App.useApp();
  const configQuery = useGetGDriveConfig({ token });
  const saveConfig = useMutateGDriveConfig({ token });
  const getAuthUrl = useGetGDriveAuthUrl({ token });
  const disconnect = useMutateGDriveDisconnect({ token });
  const importData = useMutateGDriveImport({ token });
  const exportCard = useMutateGDriveExport({ token });
  const createTemplate = useMutateGDriveTemplate({ token });
  const cardsQuery = useListCards({ token });

  const cfg = configQuery.data;
  const connected = cfg?.connected ?? false;

  const [exportCardId, setExportCardId] = useState<string | null>(null);
  const [exportLinks, setExportLinks] = useState<string[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const handleConnect = async () => {
    try {
      const url = await getAuthUrl.mutateAsync();
      window.open(url, "_blank");
    } catch (err) {
      message.error((err as Error).message || "Failed to start auth flow");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect.mutateAsync();
      message.success("Disconnected from Google Drive");
    } catch (err) {
      message.error((err as Error).message || "Disconnect failed");
    }
  };

  const handleSaveConfig = async (values: { clientId: string; clientSecret: string; sheetId: string; folderId: string }) => {
    try {
      await saveConfig.mutateAsync(values);
      message.success("Config saved");
    } catch {
      message.error("Failed to save config");
    }
  };

  const handleImport = async () => {
    try {
      const result = await importData.mutateAsync();
      message.success(
        `Imported: ${result.clubs} clubs, ${result.athletes} athletes, ${result.officials} officials, ${result.bouts} bouts`
      );
    } catch (err) {
      message.error((err as Error).message || "Import failed");
    }
  };

  const handleExport = async () => {
    if (!exportCardId) {
      message.warning("Enter a card ID first");
      return;
    }
    try {
      setExportLinks([]);
      const result = await exportCard.mutateAsync(exportCardId);
      setExportLinks(result.links ?? []);
      message.success(`Exported ${result.links?.length ?? 0} file(s) to Google Drive`);
    } catch (err) {
      message.error((err as Error).message || "Export failed");
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ConfigModal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        initialValues={{
          clientId: cfg?.clientId ?? "",
          clientSecret: cfg?.clientSecret ?? "",
          sheetId: cfg?.sheetId ?? "",
          folderId: cfg?.folderId ?? "",
        }}
        onSave={handleSaveConfig}
        saving={saveConfig.isPending}
      />

      {/* ── Header ──────────────────────────────────────────── */}
      <Flex align="center" justify="space-between" wrap gap={8}>
        <Flex align="center" gap={8}>
          <Title level={5} style={{ margin: 0 }}>Google Drive</Title>
          {connected ? (
            <Badge status="success" text="Connected" />
          ) : (
            <Badge status="default" text="Not connected" />
          )}
        </Flex>
        <Space>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setConfigOpen(true)}
          >
            Configure
          </Button>
          <Button
            icon={<QuestionCircleOutlined />}
            onClick={() => setHelpOpen(true)}
          >
            Setup guide
          </Button>
          {connected && (
            <Popconfirm
              title="Disconnect from Google Drive?"
              description="You will need to re-authorise to use import/export."
              okText="Disconnect"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={handleDisconnect}
            >
              <Button icon={<DisconnectOutlined />} danger loading={disconnect.isPending}>
                Disconnect
              </Button>
            </Popconfirm>
          )}
        </Space>
      </Flex>

      {/* ── OAuth connect ───────────────────────────────────── */}
      <Space direction="vertical">
        <Text type="secondary">
          After configuring credentials, click Connect to authorise access to Google Sheets and Drive.
          A browser tab will open — grant access, then return here and refresh.
        </Text>
        <Button
          type="primary"
          icon={<LinkOutlined />}
          loading={getAuthUrl.isPending}
          onClick={handleConnect}
          disabled={!cfg?.clientId || !cfg?.clientSecret}
        >
          Connect to Google
        </Button>
      </Space>

      <Divider />

      {/* ── Import ──────────────────────────────────────────── */}
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={5} style={{ marginBottom: 4 }}>Import from Sheet</Title>
        <Paragraph type="secondary" style={{ marginBottom: 8 }}>
          Reads the <Text code>Athletes</Text>, <Text code>Officials</Text>,{" "}
          <Text code>Clubs</Text>, and <Text code>Cards</Text> tabs from the configured spreadsheet
          and upserts records into the database.
        </Paragraph>
        <Space wrap>
          <Button
            icon={<FileAddOutlined />}
            loading={createTemplate.isPending}
            disabled={!connected}
            onClick={async () => {
              try {
                const link = await createTemplate.mutateAsync();
                window.open(link, "_blank");
              } catch (err) {
                message.error((err as Error).message || "Failed to create template");
              }
            }}
          >
            Upload Template
          </Button>
          <Button
            icon={<ImportOutlined />}
            loading={importData.isPending}
            disabled={!connected || !cfg?.sheetId}
            onClick={handleImport}
          >
            Import Now
          </Button>
        </Space>
      </Space>

      <Divider />

      {/* ── Export ──────────────────────────────────────────── */}
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={5} style={{ marginBottom: 4 }}>Export Card Report to Drive</Title>
        <Paragraph type="secondary" style={{ marginBottom: 8 }}>
          Uploads the Full and Public CSV reports for a card to the configured Drive folder.
        </Paragraph>
        <Space>
          <Select
            placeholder="Select a card"
            style={{ width: 240 }}
            value={exportCardId}
            onChange={(v) => setExportCardId(v)}
            loading={cardsQuery.isLoading}
            showSearch
            optionFilterProp="label"
            options={(cardsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
          <Button
            icon={<CloudUploadOutlined />}
            loading={exportCard.isPending}
            disabled={!connected || !exportCardId}
            onClick={handleExport}
          >
            Export
          </Button>
        </Space>
        {exportLinks.length > 0 && (
          <Alert
            type="success"
            icon={<CheckCircleOutlined />}
            showIcon
            message="Uploaded to Google Drive"
            description={
              <Space direction="vertical">
                {exportLinks.map((link) => (
                  <a key={link} href={link} target="_blank" rel="noreferrer">
                    <ExportOutlined style={{ marginRight: 4 }} />
                    {link}
                  </a>
                ))}
              </Space>
            }
          />
        )}
      </Space>
    </Space>
  );
};

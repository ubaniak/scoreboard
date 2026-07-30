import {
  CloudUploadOutlined,
  DisconnectOutlined,
  FileAddOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  ImportOutlined,
  LinkOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  App,
  Badge,
  Button,
  Collapse,
  Divider,
  Empty,
  Flex,
  Form,
  Input,
  Select,
  Popconfirm,
  Space,
  Table,
  Tooltip,
  Tree,
  Typography,
} from "antd";
import type { TreeDataNode } from "antd";
import { useEffect, useReducer, useState } from "react";
import {
  useGetGDriveAuthUrl,
  useGetGDriveConfig,
  useMutateGDriveConfig,
  useMutateGDriveDisconnect,
  useMutateGDriveExport,
  useMutateGDriveImport,
  useMutateGDriveTemplate,
  useMutateGDriveVerify,
  type ExportResult,
  type GDriveConfig,
  type Sheet,
} from "../../api/gdrive";
import { useListCards } from "../../api/cards";
import { useGetCurrent } from "../../api/current";
import type { TokenBase } from "../../api/entities";
import { ActionMenu, type CloseAction } from "../actionMenu/actionMenu";

const { Text, Title, Paragraph, Link } = Typography;

// ── Sheet mapping editor (reused inside the settings panel) ──────────────

type SheetFormProps = {
  initialCardName?: string;
  initialSheetId?: string;
  onSubmit: (cardName: string, sheetId: string) => void;
  close: CloseAction;
};

const SheetForm = ({ initialCardName = "", initialSheetId = "", onSubmit, close }: SheetFormProps) => {
  const [cardName, setCardName] = useState(initialCardName);
  const [sheetId, setSheetId] = useState(initialSheetId);

  const handleSubmit = () => {
    if (!cardName || !sheetId) return;
    onSubmit(cardName, sheetId);
    close();
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Form layout="vertical">
        <Form.Item label="Card Name" required>
          <Input
            placeholder="e.g., Card A, Card B"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Sheet ID" required>
          <Input
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
          />
        </Form.Item>
      </Form>
      <Flex justify="end" gap={8}>
        <Button onClick={() => close()}>Cancel</Button>
        <Button type="primary" disabled={!cardName || !sheetId} onClick={handleSubmit}>
          Save
        </Button>
      </Flex>
    </Space>
  );
};

const SheetList = ({ value, onChange }: { value?: Sheet[]; onChange?: (sheets: Sheet[]) => void }) => {
  const [sheets, setSheets] = useState<Sheet[]>(value || []);

  const handleAdd = (cardName: string, sheetId: string) => {
    const newSheets = [...sheets, { cardName, sheetId }];
    setSheets(newSheets);
    onChange?.(newSheets);
  };

  const handleUpdate = (idx: number, cardName: string, sheetId: string) => {
    const newSheets = sheets.map((s, i) => (i === idx ? { cardName, sheetId } : s));
    setSheets(newSheets);
    onChange?.(newSheets);
  };

  const handleDelete = (idx: number) => {
    const newSheets = sheets.filter((_, i) => i !== idx);
    setSheets(newSheets);
    onChange?.(newSheets);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Table
        size="small"
        dataSource={sheets.map((s, i) => ({ ...s, key: i }))}
        columns={[
          { title: "Card Name", dataIndex: "cardName", key: "cardName" },
          {
            title: "Sheet ID",
            dataIndex: "sheetId",
            key: "sheetId",
            render: (id: string) => <Text code ellipsis>{id}</Text>,
          },
          {
            title: "",
            key: "action",
            width: 160,
            render: (_, record: Sheet & { key: number }, idx) => (
              <Space size="small">
                <Button
                  type="link"
                  size="small"
                  icon={<LinkOutlined />}
                  href={`https://docs.google.com/spreadsheets/d/${record.sheetId}/edit`}
                  target="_blank"
                >
                  Go to
                </Button>
                <ActionMenu
                  trigger={{
                    override: (onOpen) => (
                      <Button type="link" size="small" onClick={onOpen}>
                        Edit
                      </Button>
                    ),
                  }}
                  content={{
                    title: "Edit Sheet",
                    body: (close) => (
                      <SheetForm
                        initialCardName={record.cardName}
                        initialSheetId={record.sheetId}
                        onSubmit={(cardName, sheetId) => handleUpdate(idx, cardName, sheetId)}
                        close={close}
                      />
                    ),
                  }}
                  width={480}
                />
                <Popconfirm
                  title="Delete sheet?"
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDelete(idx)}
                >
                  <Button type="link" danger size="small">
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "No sheets configured" }}
      />
      <ActionMenu
        trigger={{
          override: (onOpen) => (
            <Button type="dashed" block icon={<PlusOutlined />} onClick={onOpen}>
              Add Sheet
            </Button>
          ),
        }}
        content={{
          title: "Add Sheet",
          body: (close) => <SheetForm onSubmit={handleAdd} close={close} />,
        }}
        width={480}
      />
    </Space>
  );
};

// ── Setup / connection panel — lives entirely inside the settings ActionMenu ──

const SETUP_INSTRUCTIONS: { title: string; description: React.ReactNode }[] = [
  {
    title: "Create a Google Cloud project",
    description: (
      <Text>
        Go to{" "}
        <Link href="https://console.cloud.google.com" target="_blank">
          console.cloud.google.com
        </Link>{" "}
        and create a new project (or pick an existing one).
      </Text>
    ),
  },
  {
    title: "Enable the APIs",
    description: (
      <Space direction="vertical" size={2}>
        <Text>
          In your project, go to <Text strong>APIs &amp; Services → Library</Text> and enable:
        </Text>
        <Text>
          <Text code>Google Sheets API</Text> — for importing data
        </Text>
        <Text>
          <Text code>Google Drive API</Text> — for exporting reports
        </Text>
      </Space>
    ),
  },
  {
    title: "Set up the OAuth Consent Screen",
    description: (
      <Space direction="vertical" size={2}>
        <Text>
          Go to <Text strong>APIs &amp; Services → OAuth consent screen</Text>.
        </Text>
        <Text>
          Choose <Text strong>External</Text> as user type, fill in your app name and email, then
          save.
        </Text>
      </Space>
    ),
  },
  {
    title: "Create OAuth credentials",
    description: (
      <Space direction="vertical" size={2}>
        <Text>
          Go to{" "}
          <Text strong>
            APIs &amp; Services → Credentials → Create Credentials → OAuth client ID
          </Text>
          .
        </Text>
        <Text>
          Application type: <Text strong>Web application</Text>. Under{" "}
          <Text strong>Authorised redirect URIs</Text> add exactly:
        </Text>
        <Text code>http://localhost:8080/api/gdrive/callback</Text>
        <Text>
          Copy the <Text strong>Client ID</Text> and <Text strong>Client Secret</Text> into the
          fields above.
        </Text>
      </Space>
    ),
  },
];

type SettingsPanelProps = {
  cfg?: GDriveConfig;
  connected: boolean;
  onSave: (values: { clientId: string; clientSecret: string; sheets: Sheet[]; folderId: string }) => Promise<void>;
  onVerify: (clientId: string, clientSecret: string) => Promise<void>;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  saving: boolean;
  verifying: boolean;
  connecting: boolean;
  disconnecting: boolean;
  close: CloseAction;
};

const SettingsPanel = ({
  cfg,
  connected,
  onSave,
  onVerify,
  onConnect,
  onDisconnect,
  saving,
  verifying,
  connecting,
  disconnecting,
  close,
}: SettingsPanelProps) => {
  const [clientId, setClientId] = useState(cfg?.clientId ?? "");
  const [clientSecret, setClientSecret] = useState(cfg?.clientSecret ?? "");
  const [sheets, setSheets] = useState<Sheet[]>(cfg?.sheets ?? []);
  const [folderId, setFolderId] = useState(cfg?.folderId ?? "");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "success" | "error">("idle");

  const credsReady = !!clientId && !!clientSecret;

  const handleVerify = async () => {
    if (!credsReady) {
      setVerifyStatus("error");
      return;
    }
    try {
      await onVerify(clientId, clientSecret);
      setVerifyStatus("success");
    } catch {
      setVerifyStatus("error");
    }
  };

  const handleSave = async () => {
    try {
      await onSave({ clientId, clientSecret, sheets, folderId });
      close();
    } catch {
      // toast handled upstream — keep the panel open so the user can retry
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Flex align="center" justify="space-between">
        <Badge status={connected ? "success" : "default"} text={connected ? "Connected" : "Not connected"} />
        {connected && (
          <Popconfirm
            title="Disconnect from Google Drive?"
            description="You will need to re-authorise to use import/export."
            okText="Disconnect"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={onDisconnect}
          >
            <Button icon={<DisconnectOutlined />} danger size="small" loading={disconnecting}>
              Disconnect
            </Button>
          </Popconfirm>
        )}
      </Flex>

      <Form layout="vertical" size="small" style={{ marginBottom: -8 }}>
        <Form.Item label="Client ID" style={{ marginBottom: 8 }}>
          <Input
            placeholder="xxxx.apps.googleusercontent.com"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Client Secret" style={{ marginBottom: 0 }}>
          <Input.Password value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} />
        </Form.Item>
      </Form>
      <Space wrap>
        <Button size="small" onClick={handleVerify} loading={verifying} disabled={!credsReady}>
          Verify
        </Button>
        {verifyStatus === "success" && <Badge status="success" text="Verified" />}
        {verifyStatus === "error" && <Badge status="error" text="Verification failed" />}
        <Button
          size="small"
          type="primary"
          icon={<LinkOutlined />}
          loading={connecting}
          onClick={onConnect}
          disabled={!credsReady}
        >
          Connect to Google
        </Button>
      </Space>

      <Collapse
        size="small"
        items={[
          {
            key: "guide",
            label: "Setup guide",
            children: (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {SETUP_INSTRUCTIONS.map((step, i) => (
                  <div key={step.title}>
                    <Text strong>
                      {i + 1}. {step.title}
                    </Text>
                    <div>{step.description}</div>
                  </div>
                ))}
              </Space>
            ),
          },
        ]}
      />

      <Divider style={{ margin: "0" }} />

      <div>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Sheet mappings
        </Text>
        <SheetList value={sheets} onChange={setSheets} />
      </div>

      <div>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Drive folder
        </Text>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            placeholder="Folder ID (optional — leave blank to upload to root)"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
          />
          <Button
            icon={<LinkOutlined />}
            href={folderId ? `https://drive.google.com/drive/folders/${folderId}` : undefined}
            target="_blank"
            disabled={!folderId}
          />
        </Space.Compact>
      </div>

      <Flex justify="end" gap={8}>
        <Button onClick={() => close()}>Close</Button>
        <Button type="primary" onClick={handleSave} loading={saving}>
          Save Config
        </Button>
      </Flex>
    </Space>
  );
};

// ── Export log — grows across a session, newest run on top ───────────────

type ExportLogEntry = { id: string; result: ExportResult; at: number };

const relativeTime = (at: number) => {
  const minutes = Math.floor((Date.now() - at) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const buildTreeData = (result: ExportResult): TreeDataNode[] => {
  const fileIcon = (name: string) => (name.endsWith(".pdf") ? <FilePdfOutlined /> : <FileTextOutlined />);
  return result.files.map((file) => ({
    title: (
      <a href={file.link} target="_blank" rel="noreferrer">
        {fileIcon(file.name)} {file.name}
      </a>
    ),
    key: file.link,
    isLeaf: true,
  }));
};

const ExportLog = ({ entries }: { entries: ExportLogEntry[] }) => {
  const [, bumpTick] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (entries.length === 0) return;
    const interval = setInterval(bumpTick, 30_000);
    return () => clearInterval(interval);
  }, [entries.length]);

  if (entries.length === 0) {
    return <Empty description="No exports yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: "16px 0" }} />;
  }

  return (
    <Collapse
      size="small"
      items={entries.map((entry) => ({
        key: entry.id,
        label: (
          <Space size={8}>
            <FolderOpenOutlined />
            <Text strong>{entry.result.folderName}</Text>
            <Text type="secondary">
              — {entry.result.files.length} file{entry.result.files.length === 1 ? "" : "s"} ·{" "}
              {relativeTime(entry.at)}
            </Text>
          </Space>
        ),
        extra: (
          <a
            href={entry.result.folderLink}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <LinkOutlined /> Folder
          </a>
        ),
        children: <Tree defaultExpandAll treeData={buildTreeData(entry.result)} style={{ backgroundColor: "transparent" }} />,
      }))}
    />
  );
};

// ── Main page — two rows for daily use, everything else behind the gear ──

export const GoogleDrive = ({ token }: TokenBase) => {
  const { message } = App.useApp();
  const configQuery = useGetGDriveConfig({ token });
  const saveConfig = useMutateGDriveConfig({ token });
  const getAuthUrl = useGetGDriveAuthUrl({ token });
  const disconnect = useMutateGDriveDisconnect({ token });
  const importData = useMutateGDriveImport({ token });
  const exportCard = useMutateGDriveExport({ token });
  const createTemplate = useMutateGDriveTemplate({ token });
  const verifyCredentials = useMutateGDriveVerify({ token });
  const cardsQuery = useListCards({ token });
  const current = useGetCurrent();

  const cfg = configQuery.data;
  const connected = cfg?.connected ?? false;
  const sheets = cfg?.sheets ?? [];

  const [exportCardIdOverride, setExportCardIdOverride] = useState<string | null>(null);
  const [importSheetIdOverride, setImportSheetIdOverride] = useState<string | null>(null);
  const [exportLog, setExportLog] = useState<ExportLogEntry[]>([]);

  // Default the import sheet when there's only one to choose from, until the
  // user picks a different one explicitly.
  const importSheetId = importSheetIdOverride ?? (sheets.length === 1 ? sheets[0].sheetId : null);

  // Default the export card to whichever card is currently live, until the
  // user picks a different one explicitly.
  const liveCardId = current.data?.card?.id;
  const exportCardId =
    exportCardIdOverride ??
    (liveCardId && (cardsQuery.data ?? []).some((c) => c.id === liveCardId) ? liveCardId : null);

  const handleConnect = async () => {
    try {
      const url = await getAuthUrl.mutateAsync();
      window.open(url, "_blank");
    } catch (err) {
      message.error((err as Error).message || "Failed to start auth flow");
      throw err;
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect.mutateAsync();
      message.success("Disconnected from Google Drive");
    } catch (err) {
      message.error((err as Error).message || "Disconnect failed");
      throw err;
    }
  };

  const handleSaveConfig = async (values: { clientId: string; clientSecret: string; sheets: Sheet[]; folderId: string }) => {
    try {
      await saveConfig.mutateAsync(values);
      message.success("Config saved");
    } catch (err) {
      message.error("Failed to save config");
      throw err;
    }
  };

  const handleVerifyCredentials = async (clientId: string, clientSecret: string) => {
    try {
      await verifyCredentials.mutateAsync({ clientId, clientSecret });
      message.success("Credentials verified");
    } catch (err) {
      message.error((err as Error).message || "Verification failed");
      throw err;
    }
  };

  const handleUploadTemplate = async () => {
    try {
      const link = await createTemplate.mutateAsync();
      window.open(link, "_blank");
    } catch (err) {
      message.error((err as Error).message || "Failed to create template");
    }
  };

  const handleImport = async () => {
    if (!importSheetId) return;
    try {
      const result = await importData.mutateAsync(importSheetId);
      message.success(
        `Imported: ${result.clubs} clubs, ${result.athletes} athletes, ${result.officials} officials, ${result.bouts} bouts`,
      );
    } catch (err) {
      message.error((err as Error).message || "Import failed");
    }
  };

  const handleExport = async () => {
    if (!exportCardId) return;
    try {
      const result = await exportCard.mutateAsync(exportCardId);
      setExportLog((log) => [{ id: `${Date.now()}`, result, at: Date.now() }, ...log]);
      message.success(`Exported ${result.files.length} file(s) to Google Drive`);
    } catch (err) {
      message.error((err as Error).message || "Export failed");
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <Flex align="center" justify="space-between" wrap gap={8}>
        <Flex align="center" gap={8}>
          <Title level={5} style={{ margin: 0 }}>Google Drive</Title>
          {connected ? <Badge status="success" text="Connected" /> : <Badge status="default" text="Not connected" />}
        </Flex>
        <ActionMenu
          trigger={{
            override: (onOpen) => (
              <Tooltip title="Google Drive settings">
                <Button shape="circle" icon={<SettingOutlined />} onClick={onOpen} aria-label="Google Drive settings" />
              </Tooltip>
            ),
          }}
          content={{
            title: "Google Drive settings",
            body: (close) => (
              <SettingsPanel
                cfg={cfg}
                connected={connected}
                onSave={handleSaveConfig}
                onVerify={handleVerifyCredentials}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                saving={saveConfig.isPending}
                verifying={verifyCredentials.isPending}
                connecting={getAuthUrl.isPending}
                disconnecting={disconnect.isPending}
                close={close}
              />
            ),
          }}
          width={560}
        />
      </Flex>

      {!connected && (
        <Paragraph type="secondary" style={{ margin: 0 }}>
          Not connected — open <SettingOutlined /> Settings to connect a Google account and configure sheets.
        </Paragraph>
      )}

      {/* ── Import ──────────────────────────────────────────── */}
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
        <Text strong>Import from Sheet</Text>
        <Flex align="center" gap={8} wrap>
          <Select
            placeholder={sheets.length === 0 ? "No sheets configured" : "Select a sheet"}
            style={{ width: 240 }}
            value={importSheetId}
            onChange={setImportSheetIdOverride}
            disabled={!connected || sheets.length === 0}
            showSearch
            optionFilterProp="label"
            options={sheets.map((s) => ({ value: s.sheetId, label: s.cardName }))}
          />
          <Tooltip title="Upload Template">
            <Button
              icon={<FileAddOutlined />}
              loading={createTemplate.isPending}
              disabled={!connected}
              onClick={handleUploadTemplate}
              aria-label="Upload Template"
            />
          </Tooltip>
          <Button
            type="primary"
            icon={<ImportOutlined />}
            loading={importData.isPending}
            disabled={!connected || !importSheetId}
            onClick={handleImport}
          >
            Import Now
          </Button>
          {importSheetId && (
            <Button
              icon={<LinkOutlined />}
              href={`https://docs.google.com/spreadsheets/d/${importSheetId}/edit`}
              target="_blank"
            >
              Go to Sheet
            </Button>
          )}
        </Flex>
      </Space>

      <Divider style={{ margin: 0 }} />

      {/* ── Export ──────────────────────────────────────────── */}
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
        <Text strong>Export Card Report to Drive</Text>
        <Flex align="center" gap={8} wrap>
          <Select
            placeholder="Select a card"
            style={{ width: 240 }}
            value={exportCardId}
            onChange={setExportCardIdOverride}
            loading={cardsQuery.isLoading}
            disabled={!connected}
            showSearch
            optionFilterProp="label"
            options={(cardsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
          <Button
            type="primary"
            icon={<CloudUploadOutlined />}
            loading={exportCard.isPending}
            disabled={!connected || !exportCardId}
            onClick={handleExport}
          >
            Export
          </Button>
        </Flex>
        <ExportLog entries={exportLog} />
      </Space>
    </Space>
  );
};

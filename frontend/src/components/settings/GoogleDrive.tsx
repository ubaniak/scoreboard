import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  DisconnectOutlined,
  FileAddOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  ImportOutlined,
  LinkOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
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
  Table,
  Tree,
  Typography,
} from "antd";
import type { TreeDataNode } from "antd";
import { useState } from "react";
import { ActionMenu } from "../actionMenu/actionMenu";
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
  type Sheet,
} from "../../api/gdrive";
import { useListCards } from "../../api/cards";
import type { TokenBase } from "../../api/entities";

const { Text, Title, Paragraph, Link } = Typography;

const SheetList = ({ value, onChange }: { value?: Sheet[]; onChange?: (sheets: Sheet[]) => void }) => {
  const [sheets, setSheets] = useState<Sheet[]>(value || []);
  const [modal, setModal] = useState(false);
  const [cardName, setCardName] = useState("");
  const [sheetId, setSheetId] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const handleAdd = () => {
    if (!cardName || !sheetId) return;
    const newSheets = editIdx !== null
      ? sheets.map((s, i) => i === editIdx ? { cardName, sheetId } : s)
      : [...sheets, { cardName, sheetId }];
    setSheets(newSheets);
    onChange?.(newSheets);
    setModal(false);
    setCardName("");
    setSheetId("");
    setEditIdx(null);
  };

  const handleEdit = (idx: number) => {
    const sheet = sheets[idx];
    setCardName(sheet.cardName);
    setSheetId(sheet.sheetId);
    setEditIdx(idx);
    setModal(true);
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
            width: 100,
            render: (_, __, idx) => (
              <Space size="small">
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleEdit(idx)}
                >
                  Edit
                </Button>
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
        locale={{ emptyText: "No sheets configured" }}
      />
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={() => {
          setCardName("");
          setSheetId("");
          setEditIdx(null);
          setModal(true);
        }}
      >
        Add Sheet
      </Button>
      <Modal
        title={editIdx !== null ? "Edit Sheet" : "Add Sheet"}
        open={modal}
        onOk={handleAdd}
        onCancel={() => {
          setModal(false);
          setCardName("");
          setSheetId("");
          setEditIdx(null);
        }}
        okButtonProps={{ disabled: !cardName || !sheetId }}
      >
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
      </Modal>
    </Space>
  );
};

type SetupGuideProps = {
  close: () => void;
  initialValues: { clientId: string; clientSecret: string; sheets: Sheet[]; folderId: string };
  onSave: (values: { clientId: string; clientSecret: string; sheets: Sheet[]; folderId: string }) => Promise<void>;
  onVerify: (clientId: string, clientSecret: string) => Promise<void>;
  onConnect: () => Promise<void>;
  onCreateTemplate: () => Promise<string>;
  saving: boolean;
  verifying: boolean;
  connecting: boolean;
  creatingTemplate: boolean;
  connected: boolean;
};

const SetupGuideContent = ({
  close,
  initialValues,
  onSave,
  onVerify,
  onConnect,
  onCreateTemplate,
  saving,
  verifying,
  connecting,
  creatingTemplate,
  connected,
}: SetupGuideProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleVerify = async () => {
    try {
      const clientId = form.getFieldValue('clientId');
      const clientSecret = form.getFieldValue('clientSecret');
      if (!clientId || !clientSecret) {
        setVerifyStatus('error');
        return;
      }
      await onVerify(clientId, clientSecret);
      setVerifyStatus('success');
    } catch {
      setVerifyStatus('error');
    }
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    await onSave(values);
    close();
  };

  const handleUploadTemplate = async () => {
    try {
      const link = await onCreateTemplate();
      window.open(link, "_blank");
    } catch (err) {
      message.error((err as Error).message || "Failed to create template");
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Form form={form} layout="vertical" initialValues={initialValues}>
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
              title: "Set up the OAuth Consent Screen",
              description: (
                <Space direction="vertical" size={2}>
                  <Text>Go to <Text strong>APIs &amp; Services → OAuth consent screen</Text>.</Text>
                  <Text>Choose <Text strong>External</Text> as user type, fill in your app name and email, then save.</Text>
                  <Text type="secondary">This is a one-time setup required before creating credentials.</Text>
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
                  <Text>Copy the <Text strong>Client ID</Text> and <Text strong>Client Secret</Text>.</Text>
                </Space>
              ),
              status: "process",
            },
            {
              title: "Paste credentials below",
              description: (
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <Space direction="vertical" size={2}>
                    <Text>Paste your Client ID and Client Secret from Google Cloud Console:</Text>
                  </Space>
                  <Form.Item label="Client ID" name="clientId">
                    <Input placeholder="from Google Cloud Console" />
                  </Form.Item>
                  <Form.Item label="Client Secret" name="clientSecret">
                    <Input.Password placeholder="from Google Cloud Console" />
                  </Form.Item>
                  <Form.Item label=" ">
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Space>
                        <Button
                          onClick={handleVerify}
                          loading={verifying}
                        >
                          Verify Connection
                        </Button>
                        {verifyStatus === 'success' && <Badge status="success" text="Verified" />}
                        {verifyStatus === 'error' && <Badge status="error" text="Verification failed" />}
                      </Space>
                      <Button
                        type="primary"
                        icon={<LinkOutlined />}
                        loading={connecting}
                        onClick={onConnect}
                        disabled={!form.getFieldValue('clientId') || !form.getFieldValue('clientSecret')}
                      >
                        Connect to Google
                      </Button>
                    </Space>
                  </Form.Item>
                </Space>
              ),
              status: "process",
            },
            {
              title: "Upload template or prepare your sheet",
              description: (
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Space direction="vertical" size={2}>
                    <Text><Text strong>Option A:</Text> Auto-create a Google Sheet with the correct structure:</Text>
                  </Space>
                  <Button
                    icon={<FileAddOutlined />}
                    loading={creatingTemplate}
                    disabled={!connected}
                    onClick={handleUploadTemplate}
                  >
                    Upload Template
                  </Button>
                  <Space direction="vertical" size={2}>
                    <Text><Text strong>Option B:</Text> Create your own sheet with tabs named exactly: <Text code>Athletes</Text>, <Text code>Officials</Text>, <Text code>Clubs</Text>, <Text code>Cards</Text>.</Text>
                  </Space>
                </Space>
              ),
              status: "process",
            },
            {
              title: "Add Google Sheets for each card",
              description: (
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <Space direction="vertical" size={2}>
                    <Text>Add one Google Sheet per card. Each sheet must have tabs named exactly: <Text code>Athletes</Text>, <Text code>Officials</Text>, <Text code>Clubs</Text>, <Text code>Cards</Text>.</Text>
                    <Text type="secondary">Find your Google Sheet ID in the spreadsheet URL: <Text code>https://docs.google.com/spreadsheets/d/<Text strong>SHEET_ID</Text>/edit</Text></Text>
                  </Space>
                  <Form.Item label="Google Sheets" name="sheets">
                    <SheetList />
                  </Form.Item>
                  <Space direction="vertical" size={2} style={{ width: "100%" }}>
                    <Text>Find your Drive Folder ID in the folder URL (optional):</Text>
                    <Text code>https://drive.google.com/drive/folders/<Text strong>FOLDER_ID</Text></Text>
                    <Text type="secondary">Leave blank to upload to root.</Text>
                  </Space>
                  <Form.Item
                    label="Drive Folder ID (optional)"
                    name="folderId"
                    extra="Leave blank to upload to root. Get the ID from the folder URL."
                  >
                    <Input placeholder="1A2B3C4D5E6F7G8H9I" />
                  </Form.Item>
                </Space>
              ),
              status: "process",
            },
            {
              title: "Save config and connect",
              description: (
                <Text>Click <Text strong>Save Config</Text> below, then <Text strong>Connect to Google</Text>. A browser tab opens — sign in and grant access. You'll be redirected back here.</Text>
              ),
              status: "process",
            },
          ]}
        />
      </Form>
      <Space style={{ marginTop: 16 }}>
        <Button type="primary" onClick={handleSave} loading={saving}>
          Save Config
        </Button>
        <Button onClick={close}>Cancel</Button>
      </Space>
    </Space>
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
  const verifyCredentials = useMutateGDriveVerify({ token });
  const cardsQuery = useListCards({ token });

  const cfg = configQuery.data;
  const connected = cfg?.connected ?? false;

  const [exportCardId, setExportCardId] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [importSheetId, setImportSheetId] = useState<string | null>(null);

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

  const handleSaveConfig = async (values: { clientId: string; clientSecret: string; sheets: Sheet[]; folderId: string }) => {
    try {
      await saveConfig.mutateAsync(values);
      message.success("Config saved");
    } catch {
      message.error("Failed to save config");
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

  const handleImport = async () => {
    try {
      const result = await importData.mutateAsync(importSheetId || undefined);
      message.success(
        `Imported: ${result.clubs} clubs, ${result.athletes} athletes, ${result.officials} officials, ${result.bouts} bouts`
      );
      setImportSheetId(null);
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
      setExportResult(null);
      const result = await exportCard.mutateAsync(exportCardId);
      setExportResult(result);
      message.success(`Exported ${result.files.length} file(s) to Google Drive`);
    } catch (err) {
      message.error((err as Error).message || "Export failed");
    }
  };

  const buildTreeData = (result: ExportResult): TreeDataNode[] => {
    const getFileIcon = (name: string) => {
      return name.endsWith(".pdf") ? <FilePdfOutlined /> : <FileTextOutlined />;
    };

    return [
      {
        title: (
          <a href={result.folderLink} target="_blank" rel="noreferrer">
            <FolderOpenOutlined style={{ marginRight: 6 }} />
            {result.folderName}
          </a>
        ),
        key: "folder",
        children: result.files.map((file) => ({
          title: (
            <a href={file.link} target="_blank" rel="noreferrer">
              {getFileIcon(file.name)} {file.name}
            </a>
          ),
          key: file.link,
          isLeaf: true,
        })),
      },
    ];
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>

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
          <ActionMenu
            trigger={{
              icon: <QuestionCircleOutlined />,
              text: "Setup guide",
            }}
            content={{
              title: "How to set up Google Drive",
              body: (close) => (
                <SetupGuideContent
                  close={close}
                  initialValues={{
                    clientId: cfg?.clientId ?? "",
                    clientSecret: cfg?.clientSecret ?? "",
                    sheets: cfg?.sheets ?? [],
                    folderId: cfg?.folderId ?? "",
                  }}
                  onSave={handleSaveConfig}
                  onVerify={handleVerifyCredentials}
                  onConnect={handleConnect}
                  onCreateTemplate={() => createTemplate.mutateAsync()}
                  saving={saveConfig.isPending}
                  verifying={verifyCredentials.isPending}
                  connecting={getAuthUrl.isPending}
                  creatingTemplate={createTemplate.isPending}
                  connected={connected}
                />
              ),
            }}
            width={640}
          />
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
          {(cfg?.sheets ?? []).length > 0 && (
            <Select
              placeholder={
                (cfg?.sheets ?? []).length === 1
                  ? cfg?.sheets?.[0].cardName
                  : "Select a sheet to import"
              }
              style={{ width: 240 }}
              value={importSheetId}
              onChange={(v) => setImportSheetId(v)}
              disabled={!connected}
              showSearch
              optionFilterProp="label"
              allowClear
              options={(cfg?.sheets ?? []).map((s) => ({
                value: s.sheetId,
                label: s.cardName,
              }))}
            />
          )}
          <Button
            icon={<ImportOutlined />}
            loading={importData.isPending}
            disabled={
              !connected ||
              !cfg?.sheets ||
              cfg.sheets.length === 0 ||
              !importSheetId
            }
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
        {exportResult && (
          <div>
            <Alert
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
              message="Uploaded to Google Drive"
              style={{ marginBottom: 12 }}
            />
            <Tree
              defaultExpandAll
              treeData={buildTreeData(exportResult)}
              style={{ backgroundColor: "transparent" }}
            />
          </div>
        )}
      </Space>
    </Space>
  );
};

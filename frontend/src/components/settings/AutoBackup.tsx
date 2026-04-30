import { CloudUploadOutlined, DownloadOutlined, FolderOpenOutlined, HistoryOutlined, PoweroffOutlined } from "@ant-design/icons";
import { App, Button, Collapse, Input, Popconfirm, Space, Switch, Timeline, Typography } from "antd";
import { useState } from "react";
import {
  useMutateDownloadBackup,
  useGetBackupConfig,
  useListBackups,
  useMutateBackupConfig,
  useMutateDeleteBackup,
  useMutatePickBackupDir,
  useMutateRestoreBackup,
  useMutateTriggerBackup,
  useQuitApp,
} from "../../api/backup";
import type { TokenBase } from "../../api/entities";

const { Text, Title } = Typography;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export const AutoBackup = ({ token }: TokenBase) => {
  const { message } = App.useApp();

  const configQuery = useGetBackupConfig({ token });
  const saveConfig = useMutateBackupConfig({ token });
  const backupsQuery = useListBackups({ token });
  const triggerBackup = useMutateTriggerBackup({ token });
  const restoreBackup = useMutateRestoreBackup({ token });
  const deleteBackup = useMutateDeleteBackup({ token });
  const downloadBackup = useMutateDownloadBackup({ token });
  const pickDir = useMutatePickBackupDir({ token });
  const quitApp = useQuitApp({ token });

  const cfg = configQuery.data;
  const [dirDraft, setDirDraft] = useState<string | undefined>(undefined);
  const [restoreDone, setRestoreDone] = useState(false);
  const displayDir = dirDraft ?? cfg?.backupDir ?? "";

  const handleToggle = async (enabled: boolean) => {
    if (!cfg) return;
    try {
      await saveConfig.mutateAsync({ ...cfg, enabled });
    } catch {
      message.error("Failed to update auto-backup setting");
    }
  };

  const handleSaveDir = async () => {
    if (!cfg || dirDraft === undefined) return;
    try {
      await saveConfig.mutateAsync({ ...cfg, backupDir: dirDraft });
      setDirDraft(undefined);
      message.success("Backup directory saved");
    } catch {
      message.error("Failed to save backup directory");
    }
  };

  const handleBrowse = async () => {
    if (!cfg) return;
    try {
      const path = await pickDir.mutateAsync();
      if (!path) return;
      await saveConfig.mutateAsync({ ...cfg, backupDir: path });
      setDirDraft(undefined);
      message.success("Backup directory saved");
    } catch {
      message.error("Failed to pick directory");
    }
  };

  const handleBackupNow = async () => {
    try {
      await triggerBackup.mutateAsync();
      message.success("Backup created");
    } catch {
      message.error("Backup failed");
    }
  };

  const handleRestore = async (filename: string) => {
    try {
      await restoreBackup.mutateAsync(filename);
      setRestoreDone(true);
    } catch (err) {
      message.error((err as Error).message || "Restore failed");
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      await deleteBackup.mutateAsync(filename);
      message.success("Backup deleted");
    } catch (err) {
      message.error((err as Error).message || "Delete failed");
    }
  };

  const backups = backupsQuery.data ?? [];

  return (
    <>
    {restoreDone && (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 24,
      }}>
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: 600 }}>
          Restore complete
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 16 }}>
          Please restart the application for changes to take effect.
        </Text>
        <Button
          type="primary"
          danger
          size="large"
          icon={<PoweroffOutlined />}
          loading={quitApp.isPending}
          onClick={() => quitApp.mutate()}
        >
          Turn Off
        </Button>
      </div>
    )}
    <Space direction="vertical" style={{ width: "100%", maxWidth: 480 }}>
      <Title level={5} style={{ marginBottom: 4 }}>Auto Backup</Title>

      <Space align="center">
        <Switch
          checked={cfg?.enabled ?? false}
          loading={configQuery.isLoading || saveConfig.isPending}
          onChange={handleToggle}
        />
        <Text>{cfg?.enabled ? "Enabled — backs up when each bout starts" : "Disabled"}</Text>
      </Space>

      <Text type="secondary" style={{ fontSize: 12 }}>
        Only the latest 4 backups are retained; older backups are deleted automatically.
      </Text>

      <div style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ display: "block", marginBottom: 4, fontSize: 12 }}>
          Backup directory
        </Text>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            value={displayDir}
            onChange={(e) => setDirDraft(e.target.value)}
            placeholder="~/.scoreboard/backup"
          />
          <Button
            icon={<FolderOpenOutlined />}
            onClick={handleBrowse}
            loading={pickDir.isPending}
          >
            Browse
          </Button>
          <Button
            onClick={handleSaveDir}
            disabled={dirDraft === undefined}
            loading={saveConfig.isPending}
          >
            Save
          </Button>
        </Space.Compact>
      </div>

      <Button
        icon={<CloudUploadOutlined />}
        loading={triggerBackup.isPending}
        onClick={handleBackupNow}
        style={{ marginTop: 4 }}
      >
        Backup Now
      </Button>

      <Collapse
        style={{ marginTop: 8 }}
        items={[
          {
            key: "history",
            label: (
              <Space>
                <HistoryOutlined />
                {`Backup History (${backups.length})`}
              </Space>
            ),
            children: backups.length === 0 ? (
              <Text type="secondary">No backups yet</Text>
            ) : (
              <div style={{ maxHeight: 560, overflowY: "auto", paddingRight: 4 }}>
              <Timeline
                items={backups.map((b) => ({
                  key: b.filename,
                  children: (
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                      <Text style={{ fontFamily: "monospace", fontSize: 13 }}>
                        {formatDate(b.createdAt)}
                      </Text>
                      <Space>
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          loading={downloadBackup.isPending}
                          onClick={() => downloadBackup.mutate(b.filename)}
                        >
                          Download
                        </Button>
                        <Popconfirm
                          title="Restore from this backup?"
                          description="This will replace all current data. You will need to restart the app."
                          okText="Restore"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                          onConfirm={() => handleRestore(b.filename)}
                        >
                          <Button size="small" danger loading={restoreBackup.isPending}>
                            Restore from here
                          </Button>
                        </Popconfirm>
                        <Popconfirm
                          title="Delete this backup?"
                          okText="Delete"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                          onConfirm={() => handleDelete(b.filename)}
                        >
                          <Button size="small" loading={deleteBackup.isPending}>
                            Delete
                          </Button>
                        </Popconfirm>
                      </Space>
                    </Space>
                  ),
                }))}
              />
              </div>
            ),
          },
        ]}
      />
    </Space>
    </>
  );
};

import { CloudUploadOutlined, HistoryOutlined } from "@ant-design/icons";
import { App, Button, Collapse, Input, Popconfirm, Space, Switch, Timeline, Typography } from "antd";
import { useState } from "react";
import {
  useGetBackupConfig,
  useListBackups,
  useMutateBackupConfig,
  useMutateRestoreBackup,
  useMutateTriggerBackup,
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

  const cfg = configQuery.data;
  const [dirDraft, setDirDraft] = useState<string | undefined>(undefined);
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
      message.success("Restore complete — please restart the app for changes to take effect");
    } catch (err) {
      message.error((err as Error).message || "Restore failed");
    }
  };

  const backups = backupsQuery.data ?? [];

  return (
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
              <Timeline
                items={backups.map((b) => ({
                  key: b.filename,
                  children: (
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                      <Text style={{ fontFamily: "monospace", fontSize: 13 }}>
                        {formatDate(b.createdAt)}
                      </Text>
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
                    </Space>
                  ),
                }))}
              />
            ),
          },
        ]}
      />
    </Space>
  );
};

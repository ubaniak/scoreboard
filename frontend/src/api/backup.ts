import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import type { TokenBase } from "./entities";

export type BackupConfig = {
  enabled: boolean;
  backupDir: string;
};

export type BackupEntry = {
  filename: string;
  createdAt: string;
};

export const useGetBackupConfig = ({ token }: TokenBase) =>
  useQuery({
    queryKey: ["backup", "config", token],
    queryFn: async (): Promise<BackupConfig> => {
      const res = await fetch(`${baseUrl}/api/backup/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load backup config");
      return res.json();
    },
  });

export const useMutateBackupConfig = ({ token }: TokenBase) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: BackupConfig) => {
      const res = await fetch(`${baseUrl}/api/backup/config`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to save config");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backup", "config"] }),
  });
};

export const useListBackups = ({ token }: TokenBase) =>
  useQuery({
    queryKey: ["backup", "list", token],
    queryFn: async (): Promise<BackupEntry[]> => {
      const res = await fetch(`${baseUrl}/api/backup/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to list backups");
      return res.json();
    },
  });

export const useMutateTriggerBackup = ({ token }: TokenBase) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${baseUrl}/api/backup/now`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Backup failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backup", "list"] }),
  });
};

export const useMutateDeleteBackup = ({ token }: TokenBase) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (filename: string) => {
      const res = await fetch(`${baseUrl}/api/backup/delete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Delete failed");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backup", "list"] }),
  });
};

export const useMutateRestoreBackup = ({ token }: TokenBase) =>
  useMutation({
    mutationFn: async (filename: string) => {
      const res = await fetch(`${baseUrl}/api/backup/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Restore failed");
      }
    },
  });

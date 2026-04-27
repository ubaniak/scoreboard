import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import type { TokenBase } from "./entities";

export type GDriveConfig = {
  clientId: string;
  clientSecret: string;
  sheetId: string;
  folderId: string;
  connected: boolean;
};

export type ImportResult = {
  clubs: number;
  athletes: number;
  officials: number;
  bouts: number;
};

export type ExportedFile = {
  name: string;
  link: string;
};

export type ExportResult = {
  folderName: string;
  folderLink: string;
  files: ExportedFile[];
};

export const useGetGDriveConfig = ({ token }: TokenBase) =>
  useQuery({
    queryKey: ["gdrive", "config", token],
    queryFn: async (): Promise<GDriveConfig> => {
      const res = await fetch(`${baseUrl}/api/gdrive/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load Google Drive config");
      return res.json();
    },
  });

export const useMutateGDriveConfig = ({ token }: TokenBase) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: Omit<GDriveConfig, "connected">) => {
      const res = await fetch(`${baseUrl}/api/gdrive/config`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to save config");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gdrive", "config"] }),
  });
};

export const useGetGDriveAuthUrl = ({ token }: TokenBase) =>
  useMutation({
    mutationFn: async (): Promise<string> => {
      const res = await fetch(`${baseUrl}/api/gdrive/auth-url`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to get auth URL");
      }
      const data = await res.json();
      return data.url as string;
    },
  });

export const useMutateGDriveDisconnect = ({ token }: TokenBase) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${baseUrl}/api/gdrive/disconnect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to disconnect");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gdrive", "config"] }),
  });
};

export const useMutateGDriveImport = ({ token }: TokenBase) =>
  useMutation({
    mutationFn: async (): Promise<ImportResult> => {
      const res = await fetch(`${baseUrl}/api/gdrive/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Import failed");
      }
      return res.json();
    },
  });

export const useMutateGDriveTemplate = ({ token }: TokenBase) =>
  useMutation({
    mutationFn: async (): Promise<string> => {
      const res = await fetch(`${baseUrl}/api/gdrive/template`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Create template failed");
      }
      const data = await res.json();
      return data.link as string;
    },
  });

export const useMutateGDriveExport = ({ token }: TokenBase) =>
  useMutation({
    mutationFn: async (cardId: string): Promise<ExportResult> => {
      const res = await fetch(`${baseUrl}/api/gdrive/export/${cardId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Export failed");
      }
      return res.json();
    },
  });

export const useMutateGDriveVerify = ({ token }: TokenBase) =>
  useMutation({
    mutationFn: async (credentials: { clientId: string; clientSecret: string }) => {
      const res = await fetch(`${baseUrl}/api/gdrive/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Verification failed");
      }
    },
  });

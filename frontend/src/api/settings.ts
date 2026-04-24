import { useMutation } from "@tanstack/react-query";
import { baseUrl } from "./constants";
import type { TokenBase } from "./entities";

export const useExportData = (props: TokenBase) => {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${baseUrl}/api/settings/export`, {
        headers: { Authorization: `Bearer ${props.token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : "scoreboard-export.zip";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
};

export const useImportData = (props: TokenBase) => {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${baseUrl}/api/settings/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${props.token}` },
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Import failed");
      }
    },
  });
};

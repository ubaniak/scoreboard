import { useSyncExternalStore } from "react";

// Chrome/Edge/Android fire `beforeinstallprompt` once the PWA install
// criteria are met. It can fire before React mounts, so capture it at module
// load and expose it through a tiny external store.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useInstallPrompt = () => {
  const canInstall = useSyncExternalStore(
    subscribe,
    () => deferredPrompt !== null,
    () => false,
  );

  const install = async () => {
    if (!deferredPrompt) return;
    const evt = deferredPrompt;
    deferredPrompt = null;
    notify();
    await evt.prompt();
    await evt.userChoice;
  };

  return { canInstall, install };
};

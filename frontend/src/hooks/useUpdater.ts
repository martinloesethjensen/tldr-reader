import { useState, useEffect } from 'react';
import { isTauri } from '../lib/tauri';

export interface UpdaterState {
  updateAvailable: boolean;
  version: string | null;
  install: () => Promise<void>;
}

export function useUpdater(): UpdaterState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [update, setUpdate] = useState<{ downloadAndInstall: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (!isTauri()) return;

    let cancelled = false;

    (async () => {
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const result = await check();
        if (!cancelled && result?.available) {
          setUpdateAvailable(true);
          setVersion(result.version);
          setUpdate(result);
        }
      } catch {
        // Update check failing silently is fine (e.g. no network, no pubkey configured yet)
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const install = async () => {
    if (!update) return;
    await update.downloadAndInstall();
  };

  return { updateAvailable, version, install };
}

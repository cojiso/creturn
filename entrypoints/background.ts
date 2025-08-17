/**
 * cReturn - バックグラウンドスクリプト
 * 設定の管理、状態保持、設定ファイルの取得を担当
 */

import { migrateDomainEnabledStates, loadConfig, DEFAULT_CONFIG } from '~/lib/config';
import { IconManager } from '~/lib/icons';

export default defineBackground(() => {
  // 拡張機能のインストール時やアップデート時に実行
  chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === 'install') {
      // 初回インストール時はデフォルトのリモート設定を使用
      const services = await loadConfig(DEFAULT_CONFIG.configUrl);
      const config = {
        configUrl: DEFAULT_CONFIG.configUrl,
        services: services
      };
      const updatedConfig = await migrateDomainEnabledStates(config);
      chrome.storage.sync.set(updatedConfig);
    }
    
    if (reason === 'update') {
      chrome.storage.sync.get(null, async (syncStorage) => {
        try {
          const configUrl = syncStorage.configUrl || DEFAULT_CONFIG.configUrl;
          const services = await loadConfig(configUrl);
          const config = {
            configUrl: configUrl,
            services: services
          };
          const updatedConfig = await migrateDomainEnabledStates(config, syncStorage);
          chrome.storage.sync.set(updatedConfig);
        } catch (error) {
          console.error('設定の更新中にエラーが発生しました:', error);
          // エラー時はデフォルト設定にフォールバック
          const services = await loadConfig(DEFAULT_CONFIG.configUrl);
          const config = {
            configUrl: DEFAULT_CONFIG.configUrl,
            services: services
          };
          const updatedConfig = await migrateDomainEnabledStates(config, syncStorage);
          chrome.storage.sync.set(updatedConfig);
        }
      });
    }
  });

  // webNavigationを使用してより確実なアイコン更新
  chrome.webNavigation.onCommitted.addListener((details) => {
    // メインフレームのみ対象（iframeは除外）
    if (details.frameId !== 0) return;
    
    try {
      const domain = new URL(details.url)?.hostname;
      if (domain) {
        IconManager.updateIcon(domain, details.tabId);
      }
    } catch (error) {
      // URLが不正な場合は無視
    }
  });

  // 履歴変更（SPAでの画面遷移）も監視
  chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId !== 0) return;
    
    try {
      const domain = new URL(details.url)?.hostname;
      if (domain) {
        IconManager.updateIcon(domain, details.tabId);
      }
    } catch (error) {
      // URLが不正な場合は無視
    }
  });

  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url) return;
    const domain = new URL(tab.url)?.hostname;
    await IconManager.updateIcon(domain, activeInfo.tabId);
  });

  // chrome storage の更新をリッスンしてタブをサーチしてアイコンを更新
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'sync') return;
    Object.keys(changes).forEach(async (key) => {
      if (key !== 'services') return;
      const services = changes[key].newValue;
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      tabs.forEach(async (tab) => {
        if (!/^https?:\/\/.+\..+\/.+/.test(tab.url)) return;
        const domain = new URL(tab.url).hostname;
        if (!domain) return;
        await IconManager.updateIcon(domain, tab.id);
      });
    });
  });
});
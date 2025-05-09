/**
 * cReturn - バックグラウンドスクリプト
 * 設定の管理、状態保持、設定ファイルの取得を担当
 * ESモジュールとして実装
 */

// 関連モジュールをインポート
import { migrateDomainEnabledStates, fetchDefaultConfig, fetchCustomConfig } from './lib/config.js';
import { IconManager } from './lib/icons.js';

// 基本設定
const CONFIGS = {
  configUrl: "",
  services: {}
};

// 拡張機能のインストール時やアップデート時に実行
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    CONFIGS.services = await fetchDefaultConfig();
    const updatedConfig = await migrateDomainEnabledStates(CONFIGS);
    chrome.storage.sync.set(updatedConfig);
  }
  
  if (reason === 'update') {
    chrome.storage.sync.get(null, async (syncStorage) => {
      if (syncStorage.configUrl) {
        CONFIGS.services = await fetchCustomConfig(syncStorage.configUrl);
      } else {
        CONFIGS.services = await fetchDefaultConfig();
      }
      const updatedConfig = await migrateDomainEnabledStates(CONFIGS, syncStorage);
      chrome.storage.sync.set(updatedConfig);
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  const domain = new URL(tab.url)?.hostname;
  IconManager.updateIcon(domain, tabId);
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



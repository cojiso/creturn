/**
 * cReturn - バックグラウンドスクリプト
 * 設定の管理、状態保持、設定ファイルの取得を担当
 */

import { browser } from 'wxt/browser';
import { migrateDomainEnabledStates, loadConfig, ensureSitesKey } from '~/lib/config';
import { IconManager } from '~/lib/icons';
import { configUrl as configUrlStorage, sites as sitesStorage, DEFAULT_CONFIG_URL } from '~/lib/storage';

export default defineBackground(() => {
  // 拡張機能のインストール時やアップデート時に実行
  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    await ensureSitesKey();

    if (reason === 'install') {
      // 初回インストール時はデフォルトのリモート設定を使用
      const newSites = await loadConfig(DEFAULT_CONFIG_URL);
      const config = { configUrl: DEFAULT_CONFIG_URL, sites: newSites };
      const updatedConfig = await migrateDomainEnabledStates(config);
      await configUrlStorage.setValue(updatedConfig.configUrl);
      await sitesStorage.setValue(updatedConfig.sites);
    }

    if (reason === 'update') {
      try {
        const currentConfigUrl = await configUrlStorage.getValue();
        const currentSites = await sitesStorage.getValue();
        const newSites = await loadConfig(currentConfigUrl);
        const config = { configUrl: currentConfigUrl, sites: newSites };
        const updatedConfig = await migrateDomainEnabledStates(config, { sites: currentSites });
        await configUrlStorage.setValue(updatedConfig.configUrl);
        await sitesStorage.setValue(updatedConfig.sites);
      } catch (error) {
        console.error('Failed to update configs:', error);
        // Fallback to default configs on error
        try {
          const currentSites = await sitesStorage.getValue();
          const newSites = await loadConfig(DEFAULT_CONFIG_URL);
          const config = { configUrl: DEFAULT_CONFIG_URL, sites: newSites };
          const updatedConfig = await migrateDomainEnabledStates(config, { sites: currentSites });
          await configUrlStorage.setValue(updatedConfig.configUrl);
          await sitesStorage.setValue(updatedConfig.sites);
        } catch (fallbackError) {
          console.error('Failed to apply fallback configs:', fallbackError);
        }
      }
    }
  });

  // webNavigationを使用してより確実なアイコン更新
  browser.webNavigation.onCommitted.addListener((details) => {
    // メインフレームのみ対象（iframeは除外）
    if (details.frameId !== 0) return;
    
    try {
      const domain = new URL(details.url).hostname;
      if (domain) {
        IconManager.updateIcon(domain, details.tabId);
      }
    } catch (error) {
      // URLが不正な場合は無視
    }
  });

  // 履歴変更（SPAでの画面遷移）も監視
  browser.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId !== 0) return;
    
    try {
      const domain = new URL(details.url).hostname;
      if (domain) {
        IconManager.updateIcon(domain, details.tabId);
      }
    } catch (error) {
      // URLが不正な場合は無視
    }
  });

  browser.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await browser.tabs.get(activeInfo.tabId);
    if (!tab.url) return;
    const domain = new URL(tab.url).hostname;
    if (domain) {
      await IconManager.updateIcon(domain, activeInfo.tabId);
    }
  });

  // sites の変更を監視してアイコンを更新
  sitesStorage.watch(async () => {
    await ensureSitesKey();

    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    for (const tab of tabs) {
      if (!tab.url || !/^https?:\/\/.+\..+\/.+/.test(tab.url) || !tab.id) continue;
      const domain = new URL(tab.url).hostname;
      if (!domain) continue;
      await IconManager.updateIcon(domain, tab.id);
    }
  });
});
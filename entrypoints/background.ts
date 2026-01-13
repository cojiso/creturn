/**
 * cReturn - バックグラウンドスクリプト
 * 設定の管理、状態保持、設定ファイルの取得を担当
 */

import { browser } from 'wxt/browser';
import { migrateDomainEnabledStates, loadConfig, DEFAULT_CONFIG, ensureSitesKey } from '~/lib/config';
import { IconManager } from '~/lib/icons';

export default defineBackground(() => {
  // 拡張機能のインストール時やアップデート時に実行
  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    await ensureSitesKey();

    if (reason === 'install') {
      // 初回インストール時はデフォルトのリモート設定を使用
      const sites = await loadConfig(DEFAULT_CONFIG.configUrl);
      const config = {
        configUrl: DEFAULT_CONFIG.configUrl,
        sites: sites
      };
      const updatedConfig = await migrateDomainEnabledStates(config);
      browser.storage.sync.set(updatedConfig);
    }
    
    if (reason === 'update') {
      try {
        const syncStorage = await browser.storage.sync.get(null);
        const configUrl = (syncStorage.configUrl as string) || DEFAULT_CONFIG.configUrl;
        const sites = await loadConfig(configUrl);
        const config = {
          configUrl: configUrl,
          sites: sites
        };
        const updatedConfig = await migrateDomainEnabledStates(config, syncStorage);
        await browser.storage.sync.set(updatedConfig);
      } catch (error) {
        console.error('Failed to update configs:', error);
        // Fallback to default configs on error
        try {
          const syncStorage = await browser.storage.sync.get(null);
          const sites = await loadConfig(DEFAULT_CONFIG.configUrl);
          const config = {
            configUrl: DEFAULT_CONFIG.configUrl,
            sites: sites
          };
          const updatedConfig = await migrateDomainEnabledStates(config, syncStorage);
          await browser.storage.sync.set(updatedConfig);
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

  // chrome storage の更新をリッスンしてタブをサーチしてアイコンを更新
  browser.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace !== 'sync') return;

    await ensureSitesKey();

    Object.keys(changes).forEach(async (key) => {
      if (key !== 'sites') return;
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      tabs.forEach(async (tab) => {
        if (!tab.url || !/^https?:\/\/.+\..+\/.+/.test(tab.url) || !tab.id) return;
        const domain = new URL(tab.url).hostname;
        if (!domain) return;
        await IconManager.updateIcon(domain, tab.id);
      });
    });
  });
});
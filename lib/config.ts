/**
 * cReturn - 設定管理モジュール
 * 設定の取得・適用を担当
 */

import { browser } from 'wxt/browser';
import * as jsonc from 'jsonc-parser';

// 設定ソースの種類を定義
export const CONFIG_SOURCES = {
  LOCAL: 'local',           // ローカルファイル (creturn-config.jsonc)
  REMOTE_DEFAULT: 'remote_default', // デフォルトのGitHubリポジトリ
  REMOTE_CUSTOM: 'remote_custom'    // カスタムURL
} as const;

// デフォルトの設定
export const DEFAULT_CONFIG = {
  source: CONFIG_SOURCES.REMOTE_DEFAULT,
  configUrl: "https://raw.githubusercontent.com/cojiso/creturn/main/public/creturn-config.jsonc",
  sites: {}
};

/**
 * 設定ソースを特定する
 * @param {string} configUrl - 設定URL
 * @returns {string} - 設定ソースタイプ
 */
export function getConfigSource(configUrl: string): string {
  if (!configUrl || configUrl === "") {
    return CONFIG_SOURCES.LOCAL;
  } else if (configUrl === DEFAULT_CONFIG.configUrl) {
    return CONFIG_SOURCES.REMOTE_DEFAULT;
  } else {
    return CONFIG_SOURCES.REMOTE_CUSTOM;
  }
}

/**
 * ストレージのservicesキーをsitesキーに自動マイグレーションする
 * この関数は全てのエントリーポイント（background, popup, options, content）で
 * ストレージ読み込み前に呼び出すことで、ストレージの正規化を保証する
 *
 * NOTE: この関数は後方互換のために一時的に存在します
 * TODO: 2週間後にservices読み込みコードを削除、1ヶ月後にこの関数自体を削除
 */
export async function ensureSitesKey(): Promise<void> {
  const storage = await browser.storage.sync.get(['sites', 'services']);

  // sites が既に存在すれば何もしない（早期リターン）
  if (storage.sites && Object.keys(storage.sites).length > 0) {
    return;
  }

  // services から sites に移行
  if (storage.services && Object.keys(storage.services).length > 0) {
    await browser.storage.sync.set({ sites: storage.services });
    await browser.storage.sync.remove('services');
  }
}

/**
 * サイト設定を適用する
 * @param {Object} config - 現在の設定オブジェクト
 * @param {Object} syncStorage - chrome.storageから取得した設定
 * @returns {Object} - 更新された設定オブジェクト
 */
export async function migrateDomainEnabledStates(config: any, syncStorage: any = {}): Promise<any> {
  const existingSites = syncStorage.sites || {};

  // config.sites に直接 enabled フラグを設定
  if (config.sites) {
    Object.keys(config.sites).forEach(domain => {
      config.sites[domain].enabled = existingSites[domain]?.enabled ?? true;
    });
  }

  return config;
}

/**
 * 統一された設定読み込み関数
 * @param {string} configUrl - 設定URL（空の場合はローカル設定を使用）
 * @returns {Object} - サイト設定オブジェクト
 */
export async function loadConfig(configUrl: string = ""): Promise<any> {
  const source = getConfigSource(configUrl);
  
  switch (source) {
    case CONFIG_SOURCES.LOCAL:
      return await loadLocalConfig();
    case CONFIG_SOURCES.REMOTE_DEFAULT:
      return await loadRemoteDefaultConfig();
    case CONFIG_SOURCES.REMOTE_CUSTOM:
      return await loadRemoteCustomConfig(configUrl);
    default:
      console.warn('Unknown config source, falling back to local');
      return await loadLocalConfig();
  }
}

/**
 * ローカル設定を読み込み
 * @returns {Object} - サイト設定オブジェクト
 */
export async function loadLocalConfig(): Promise<any> {
  const response = await fetch('/creturn-config.jsonc');
  const jsonText = await response.text();
  const configData = jsonc.parse(jsonText);

  // 段階的移行: sites → services の順で取得
  if (configData.sites && Object.keys(configData.sites).length > 0) {
    return configData.sites;
  }

  return configData.services || {}; // JSONキーは "services" のまま維持（後方互換）
}

/**
 * デフォルトリモート設定を読み込み
 * @returns {Object} - サイト設定オブジェクト
 */
export async function loadRemoteDefaultConfig(): Promise<any> {
  return await loadRemoteCustomConfig(DEFAULT_CONFIG.configUrl);
}

/**
 * カスタムリモート設定を読み込み
 * @param {string} url - 設定ファイルのURL
 * @returns {Object} - 取得したサイト設定オブジェクト
 */
export async function loadRemoteCustomConfig(url: string): Promise<any> {
  try {
    if (!url.toLowerCase().endsWith('.jsonc') && !url.toLowerCase().endsWith('.json')) {
      throw new Error('設定ファイルはJSONCファイル (.jsonc) である必要があります');
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonContent = await response.text();
    const parsedConfig = jsonc.parse(jsonContent);

    // 段階的移行: sites → services の順で取得
    if (parsedConfig?.sites && Object.keys(parsedConfig.sites).length > 0) {
      return parsedConfig.sites;
    }

    if (parsedConfig?.services && Object.keys(parsedConfig.services).length > 0) {
      return parsedConfig.services;
    }

    throw new Error('Invalid configuration file format (sites key required; services key deprecated since v0.6.0)');
  } catch (error) {
    console.error('Failed to load configuration file:', error);
    throw error;
  }
}

/**
 * 設定をデフォルト値にリセット
 * @returns {Promise<{success: boolean, message: string}>} - リセット結果
 */
export async function resetToDefaults(): Promise<{success: boolean, message: string}> {
  try {
    // ストレージをクリア
    await browser.storage.sync.clear();

    // デフォルト設定を取得（現在はリモートデフォルトを使用）
    const sites = await loadRemoteDefaultConfig();

    // 設定オブジェクト構築
    const config = {
      configUrl: DEFAULT_CONFIG.configUrl,
      sites: sites
    };

    // 設定を保存
    await browser.storage.sync.set(config);

    return { success: true, message: '設定をリセットしました' };
  } catch (error) {
    console.error('設定のリセット中にエラーが発生しました:', error);
    return { success: false, message: 'リセット中にエラーが発生しました' };
  }
}
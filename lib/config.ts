/**
 * cReturn - 設定管理モジュール
 * 設定の取得・適用を担当
 */

// 設定ソースの種類を定義
export const CONFIG_SOURCES = {
  LOCAL: 'local',           // ローカルファイル (creturn-config.json)
  REMOTE_DEFAULT: 'remote_default', // デフォルトのGitHubリポジトリ
  REMOTE_CUSTOM: 'remote_custom'    // カスタムURL
} as const;

// デフォルトの設定
export const DEFAULT_CONFIG = {
  source: CONFIG_SOURCES.REMOTE_DEFAULT,
  configUrl: "https://raw.githubusercontent.com/cojiso/creturn/main/creturn-config.json",
  services: {}
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
 * ドメイン設定を適用する
 * @param {Object} config - 現在の設定オブジェクト
 * @param {Object} syncStorage - chrome.storageから取得した設定
 * @returns {Object} - 更新された設定オブジェクト
 */
export async function migrateDomainEnabledStates(config: any, syncStorage: any = {}): Promise<any> {
  // 設定オブジェクトに直接enabledフラグを設定
  Object.keys(config.services).forEach(domain => {
    config.services[domain].enabled = syncStorage.services?.[domain]?.enabled ?? true;
  });
  
  return config;
}

/**
 * 統一された設定読み込み関数
 * @param {string} configUrl - 設定URL（空の場合はローカル設定を使用）
 * @returns {Object} - サービス設定オブジェクト
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
 * @returns {Object} - サービス設定オブジェクト
 */
export async function loadLocalConfig(): Promise<any> {
  const response = await fetch(browser.runtime.getURL('creturn-config.json'));
  const configData = await response.json();
  return configData.services;
}

/**
 * デフォルトリモート設定を読み込み
 * @returns {Object} - サービス設定オブジェクト
 */
export async function loadRemoteDefaultConfig(): Promise<any> {
  return await loadRemoteCustomConfig(DEFAULT_CONFIG.configUrl);
}

/**
 * カスタムリモート設定を読み込み
 * @param {string} url - 設定ファイルのURL
 * @returns {Object} - 取得したサービス設定オブジェクト
 */
export async function loadRemoteCustomConfig(url: string): Promise<any> {
  try {
    if (!url.toLowerCase().endsWith('.json')) {
      throw new Error('設定ファイルはJSONファイルである必要があります');
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const jsonContent = await response.text();
    const parsedConfig = JSON.parse(jsonContent);
    
    if (!parsedConfig || !parsedConfig.services) {
      throw new Error('設定ファイルの形式が正しくありません');
    }

    return parsedConfig.services;
  } catch (error) {
    console.error('設定ファイルの取得に失敗しました:', error);
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
    await new Promise<void>((resolve) => {
      chrome.storage.sync.clear(() => resolve());
    });
    
    // デフォルト設定を取得（現在はリモートデフォルトを使用）
    const services = await loadRemoteDefaultConfig();
    
    // 設定オブジェクト構築
    const config = {
      configUrl: DEFAULT_CONFIG.configUrl,
      services: services
    };
    
    // 設定を保存
    await new Promise<void>((resolve) => {
      chrome.storage.sync.set(config, () => resolve());
    });
    
    return { success: true, message: '設定をリセットしました' };
  } catch (error) {
    console.error('設定のリセット中にエラーが発生しました:', error);
    return { success: false, message: 'リセット中にエラーが発生しました' };
  }
}
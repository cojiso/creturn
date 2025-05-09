/**
 * cReturn - 設定管理モジュール
 * 設定の取得・適用を担当
 */

/**
 * ドメイン設定を適用する
 * @param {Object} config - 現在の設定オブジェクト
 * @param {Object} syncStorage - chrome.storageから取得した設定
 * @returns {Object} - 更新された設定オブジェクト
 */
export async function migrateDomainEnabledStates(config, syncStorage={}) {
  // 設定オブジェクトに直接enabledフラグを設定
  Object.keys(config.services).forEach(domain => {
    config.services[domain].enabled = syncStorage.services?.[domain]?.enabled ?? true;
  });
  
  return config;
}

/**
 * デフォルト設定を取得
 * @returns {Object} - サービス設定オブジェクト
 */
export async function fetchDefaultConfig() {
  const response = await fetch(chrome.runtime.getURL('creturn-config.json'));
  const configData = await response.json();
  return configData.services;
}

/**
 * カスタム設定を外部から取得
 * @param {string} url - 設定ファイルのURL
 * @returns {Object} - 取得したサービス設定オブジェクト
 */
export async function fetchCustomConfig(url) {
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
  }
}

/**
 * 設定をデフォルト値にリセット
 * @returns {Promise<{success: boolean, message: string}>} - リセット結果
 */
export async function resetToDefaults() {
  try {
    // ストレージをクリア
    await new Promise((resolve) => {
      chrome.storage.sync.clear(resolve);
    });
    
    // デフォルト設定を取得
    const services = await fetchDefaultConfig();
    
    // 設定オブジェクト構築
    const config = {
      configType: "default",
      configUrl: "",
      services: services
    };
    
    // 設定を保存
    await new Promise((resolve) => {
      chrome.storage.sync.set(config, resolve);
    });
    
    return { success: true, message: '設定をリセットしました' };
  } catch (error) {
    console.error('設定のリセット中にエラーが発生しました:', error);
    return { success: false, message: 'リセット中にエラーが発生しました' };
  }
}

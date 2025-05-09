/**
 * cReturn - Options page script
 */

import { fetchDefaultConfig, fetchCustomConfig, resetToDefaults } from '../lib/config.js';

// DOM element references
const elements = {
  configTypeDefault: document.getElementById('default-config'),
  configTypeGithub: document.getElementById('github-config'),
  configUrl: document.getElementById('config-url'),
  urlPrefix: document.getElementById('url-prefix'),
  loadConfig: document.getElementById('load-config'),
  configStatus: document.getElementById('config-status'),
  servicesList: document.getElementById('services-list'),
  servicesLoading: document.getElementById('services-loading'),
  resetDefaults: document.getElementById('reset-defaults'),
  saveStatus: document.getElementById('save-status')
};

/**
 * Initialize internationalization for elements using data attributes
 */
function initializeI18n() {
  // Localize elements with data-i18n-text attribute
  document.querySelectorAll('[data-i18n-text]').forEach(element => {
    const key = element.getAttribute('data-i18n-text');
    element.textContent = chrome.i18n.getMessage(key);
  });

  // Localize elements with data-i18n-value attribute
  document.querySelectorAll('[data-i18n-value]').forEach(element => {
    const key = element.getAttribute('data-i18n-value');
    element.value = chrome.i18n.getMessage(key);
  });
  
  // Localize elements with data-i18n-title attribute
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.setAttribute('title', chrome.i18n.getMessage(key));
  });
  
  // Localize elements with data-i18n-combined attribute (for title and h1)
  document.querySelectorAll('[data-i18n-combined="extensionName_options"]').forEach(element => {
    const extensionName = chrome.i18n.getMessage('extensionName');
    const options = chrome.i18n.getMessage('options');
    element.textContent = `${extensionName} ${options}`;
  });
}

// ベースURLの設定
const BASE_URL = "https://raw.githubusercontent.com/";

// 現在の設定を保持する変数
let currentSettings = {
  configType: "default", // デフォルト、githubのどちらか
  configUrl: "",
  services: {}
};

/**
 * 設定をロードしてUIに表示
 */
function loadSettings() {
  chrome.storage.sync.get(null, (data) => {
    currentSettings = data || { configType: "default", configUrl: "", services: {} };
    
    // configTypeが未設定の場合はデフォルトに
    if (!currentSettings.configType) {
      currentSettings.configType = currentSettings.configUrl ? "github" : "default";
    }
    
    // 設定タイプに合わせてラジオボタンを設定
    if (currentSettings.configType === "default") {
      elements.configTypeDefault.checked = true;
      elements.configUrl.disabled = true;
      elements.urlPrefix.classList.add('disabled');
      elements.loadConfig.disabled = true;
    } else {
      // githubとして扱う
      elements.configTypeGithub.checked = true;
      elements.urlPrefix.textContent = BASE_URL;
      elements.configUrl.disabled = false;
      elements.urlPrefix.classList.remove('disabled');
      elements.loadConfig.disabled = false;
    }
    
    // 設定URL（ベースURL部分は除外）
    const fullUrl = currentSettings.configUrl || '';
    if (fullUrl.startsWith(BASE_URL)) {
      elements.configUrl.value = fullUrl.substring(BASE_URL.length);
    } else {
      elements.configUrl.value = fullUrl;
    }
    
    // サービスリストを表示
    displayServices(currentSettings.services || {});
  });
}

/**
 * サービスのリストを表示
 */
function displayServices(services) {
  // ローディング表示を非表示にする
  if (elements.servicesLoading) {
    elements.servicesLoading.style.display = 'none';
  }
  
  elements.servicesList.innerHTML = '';
  
  if (!services || Object.keys(services).length === 0) {
    elements.servicesList.innerHTML = `<p>${chrome.i18n.getMessage('noServices')}</p>`;
    return;
  }
  
  // サービスオブジェクトを反復処理
  Object.entries(services).forEach(([domain, service]) => {
    const enabled = service.enabled ?? true;
    
    const serviceItem = document.createElement('div');
    serviceItem.className = 'service-item';
    
    // サービス情報
    const serviceInfo = document.createElement('div');
    serviceInfo.className = 'service-info';
    
    const serviceName = document.createElement('div');
    serviceName.className = 'service-name';
    serviceName.textContent = service.name;
    
    const serviceDomain = document.createElement('div');
    serviceDomain.className = 'service-domain';
    serviceDomain.textContent = domain;
    
    const serviceSelectors = document.createElement('div');
    serviceSelectors.className = 'service-selectors';
    serviceSelectors.textContent = chrome.i18n.getMessage('selector', [service.selectors.join(', ')]);
    
    serviceInfo.appendChild(serviceName);
    serviceInfo.appendChild(serviceDomain);
    serviceInfo.appendChild(serviceSelectors);
    
    // トグルスイッチ
    const serviceToggleLabel = document.createElement('label');
    serviceToggleLabel.className = 'toggle';
    
    const serviceToggle = document.createElement('input');
    serviceToggle.type = 'checkbox';
    serviceToggle.checked = enabled;
    serviceToggle.dataset.domain = domain;
    serviceToggle.addEventListener('change', (e) => {
      updateDomainStatus(domain, e.target.checked);
    });
    
    const serviceSlider = document.createElement('span');
    serviceSlider.className = 'slider';
    
    serviceToggleLabel.appendChild(serviceToggle);
    serviceToggleLabel.appendChild(serviceSlider);
    
    // 要素を組み立て
    serviceItem.appendChild(serviceInfo);
    serviceItem.appendChild(serviceToggleLabel);
    
    elements.servicesList.appendChild(serviceItem);
  });
}

/**
 * ドメインの有効/無効状態を更新し、すぐにChrome Storageに保存
 */
function updateDomainStatus(domain, enabled) {
  if (!currentSettings.services) {
    currentSettings.services = {};
  }
  
  if (!currentSettings.services[domain]) {
    currentSettings.services[domain] = {};
  }
  
  currentSettings.services[domain].enabled = enabled;
  
  // 現在の設定をすべてChrome Storageに即時保存
  chrome.storage.sync.set(currentSettings, () => {
    // Show success message
    elements.saveStatus.textContent = chrome.i18n.getMessage('settingsSaved');
    elements.saveStatus.className = 'status success';
    
    // Clear message after a delay
    setTimeout(() => {
      elements.saveStatus.textContent = '';
      elements.saveStatus.className = 'status';
    }, 1500);
  });
}

/**
 * 設定をストレージに保存
 */
// 関連する設定は個別に保存されるため、一括保存機能は不要になりました

/**
 * 設定をデフォルト値にリセット
 */
async function resetSettings() {
  if (confirm(chrome.i18n.getMessage('confirmReset'))) {
    try {
      const result = await resetToDefaults();
      
      if (result.success) {
        loadSettings();
        elements.saveStatus.textContent = chrome.i18n.getMessage('settingsResetSuccess');
        elements.saveStatus.className = 'status success';
      } else {
        elements.saveStatus.textContent = chrome.i18n.getMessage('settingsResetError');
        elements.saveStatus.className = 'status error';
      }
    } catch (error) {
      console.error('An error occurred during reset process:', error);
      elements.saveStatus.textContent = chrome.i18n.getMessage('settingsResetError');
      elements.saveStatus.className = 'status error';
    }
  }
}

/**
 * カスタム設定を取得するためのヘルパー関数
 * 直接config.jsモジュールを利用
 */
async function getCustomConfig(url) {
  try {
    return await fetchCustomConfig(url);
  } catch (error) {
    throw new Error('Failed to retrieve configuration file: ' + error.message);
  }
}

/**
 * リモート設定ファイルを読み込む
 */
async function loadRemoteConfig() {
  const urlPath = elements.configUrl.value;
  
  if (!urlPath) {
    elements.configStatus.textContent = chrome.i18n.getMessage('enterUrl');
    elements.configStatus.className = 'status error';
    return;
  }
  
  elements.configStatus.textContent = chrome.i18n.getMessage('loadingSettings');
  elements.configStatus.className = 'status';
  
  // GitHub URLを構築
  const fullUrl = currentSettings.configType !== "default" ? BASE_URL + urlPath : "";
  
  try {
    // 直接モジュールから設定ファイルを取得
    let newServices;
    
    // URLが指定されている場合はリモート設定を取得
    if (urlPath) {
      newServices = await getCustomConfig(fullUrl);
    } else {
      // URLが指定されていない場合はデフォルト設定を使用
      newServices = await fetchDefaultConfig();
    }
    
    if (!newServices) {
      throw new Error('Faild to retrive configuration file');
    }
    
    // 既存のサービスからenabledフラグを引き継ぐ
    if (currentSettings.services) {
      Object.entries(newServices).forEach(([domain, service]) => {
        if (currentSettings.services[domain]) {
          service.enabled = currentSettings.services[domain].enabled;
        } else {
          service.enabled = true; // 新しいサービスはデフォルトで有効
        }
      });
    }
    
    currentSettings.services = newServices;
    currentSettings.configUrl = fullUrl;
    
    // Chrome Storageに保存してからUI を更新
    chrome.storage.sync.set(currentSettings, () => {
      displayServices(currentSettings.services);
      
      elements.configStatus.textContent = chrome.i18n.getMessage('settingsLoaded');
      elements.configStatus.className = 'status success';
      
      elements.saveStatus.textContent = '';
      elements.saveStatus.className = 'status';
    });
    
  } catch (error) {
    console.error('Configuration file loading error:', error);
    elements.configStatus.textContent = chrome.i18n.getMessage('loadingError', [error.message]);
    elements.configStatus.className = 'status error';
  }
}

// イベントリスナーを設定
document.addEventListener('DOMContentLoaded', () => {
  initializeI18n();
  loadSettings();
});
elements.loadConfig.addEventListener('click', loadRemoteConfig);
elements.resetDefaults.addEventListener('click', resetSettings);

// 設定タイプ変更時のイベントリスナー
elements.configTypeDefault.addEventListener('change', async () => {
  if (elements.configTypeDefault.checked) {
    currentSettings.configType = "default";
    
    // URLフィールドを無効化
    elements.configUrl.disabled = true;
    elements.urlPrefix.classList.add('disabled');
    elements.loadConfig.disabled = true;
    
    // デフォルト設定を読み込む
    elements.servicesLoading.style.display = 'block';
    try {
      // 直接モジュールから設定ファイルを取得
      fetchDefaultConfig().then(services => {
        // 既存のサービスからenabledフラグを引き継ぐ
        if (currentSettings.services) {
          Object.entries(services).forEach(([domain, service]) => {
            if (currentSettings.services[domain]) {
              service.enabled = currentSettings.services[domain].enabled;
            }
          });
        }
        currentSettings.services = services;
          
        // Chrome Storageに即時保存
        chrome.storage.sync.set(currentSettings, () => {
          displayServices(currentSettings.services);
          elements.saveStatus.textContent = chrome.i18n.getMessage('defaultSettingsApplied');
          elements.saveStatus.className = 'status success';
          
          setTimeout(() => {
            elements.saveStatus.textContent = '';
            elements.saveStatus.className = 'status';
          }, 1500);
        });
      });
    } catch (error) {
      console.error('Default configuration loading error:', error);
    }
  }
});

elements.configTypeGithub.addEventListener('change', () => {
  if (elements.configTypeGithub.checked) {
    currentSettings.configType = "github";
    
    // URLフィールドを有効化
    elements.configUrl.disabled = false;
    elements.urlPrefix.classList.remove('disabled');
    elements.loadConfig.disabled = false;
    
    elements.urlPrefix.textContent = BASE_URL;
    elements.saveStatus.textContent = chrome.i18n.getMessage('clickToLoad');
    elements.saveStatus.className = 'status warning';
  }
});

// 設定変更時のイベントリスナー
elements.configUrl.addEventListener('change', () => {
  elements.saveStatus.textContent = chrome.i18n.getMessage('unsavedChanges');
  elements.saveStatus.className = 'status warning';
});

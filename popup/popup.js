/**
 * cReturn - ポップアップUIのスクリプト
 */

import { findMatchingService } from '../lib/utils.js';

// DOM要素の参照
const elements = {
  siteNotSupported: document.getElementById('site-not-supported'),
  siteToggleContainer: document.getElementById('site-toggle-container'),
  currentDomain: document.getElementById('current-domain'),
  siteToggle: document.getElementById('site-toggle'),
  openOptions: document.getElementById('open-options'),
  unsupportedMessage: document.getElementById('unsupported-message')
};

// 現在のタブ情報
let currentTab = null;
// 現在の設定
let currentSettings = null;
// 現在のサービス設定
let currentService = null;

/**
 * Initialize text using i18n
 */
function initializeI18n() {
  // Set the message for unsupported domains
  elements.unsupportedMessage.textContent = chrome.i18n.getMessage('unsupportedDomain');
  
  // Set the tooltip for the settings button
  elements.openOptions.setAttribute('title', chrome.i18n.getMessage('settings'));
  
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
}

/**
 * 現在のタブの情報を取得
 */
async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs.length > 0 ? tabs[0] : null;
}

/**
 * 設定を読み込む
 */
function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (data) => {
      currentSettings = data;
      resolve(data);
    });
  });
}

/**
 * UIを初期化
 */
async function initializeUI() {
  try {
    // i18nの初期化
    initializeI18n();
    
    // 現在のタブ情報を取得
    currentTab = await getCurrentTab();
    
    if (!currentTab) {
      console.error('Cannot retrieve tab information');
      return;
    }
    
    // タブのURLからドメインを取得
    const url = new URL(currentTab.url);
    const domain = url.hostname;
    
    // ドメインを表示
    elements.currentDomain.textContent = domain;
    
    // 設定を読み込む
    await loadSettings();
    
    // 現在のドメインに対応するサービス設定を検索（ワイルドカード対応）
    currentService = findMatchingService(domain, currentSettings.services);
    
    // サポートされているサイトかどうかで表示を切り替え
    if (currentService) {
      elements.siteToggle.checked = currentService.enabled !== false;
      elements.siteToggleContainer.style.display = 'block';
    } else {
      elements.siteNotSupported.style.display = 'block';
    }
    
  } catch (error) {
    console.error('An error occurred during initialization:', error);
  }
}



// グローバル設定の切替機能は削除

/**
 * サイトごとの有効/無効を切り替え
 */
function toggleSiteEnabled() {
  if (!currentService || !currentTab?.url) return;
  
  const enabled = elements.siteToggle.checked;
  const domain = new URL(currentTab.url).hostname;
  
  // サービスに直接enabledフラグを設定して保存
  if (currentSettings.services) {
    currentSettings.services[domain].enabled = enabled;
    chrome.storage.sync.set({ services: currentSettings.services });
  }
}

/**
 * 詳細設定を開く
 */
function openOptionsPage() {
  chrome.runtime.openOptionsPage();
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
  // DOMContentLoadedイベントで要素を再取得して初期化
  elements.siteToggle = document.getElementById('site-toggle');
  elements.openOptions = document.getElementById('open-options');
  elements.unsupportedMessage = document.getElementById('unsupported-message');
  
  // 初期化
  initializeUI();
  
  // イベントリスナー
  elements.siteToggle?.addEventListener('change', toggleSiteEnabled);
  elements.openOptions?.addEventListener('click', openOptionsPage);
});

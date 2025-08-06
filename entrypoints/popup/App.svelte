<script lang="ts">
  import { onMount } from 'svelte';
  import { findMatchingService } from '~/lib/utils';

  // State variables
  let currentTab: chrome.tabs.Tab | null = null;
  let currentSettings: any = null;
  let currentService: any = null;
  let domain = '';
  let isSupported = false;
  let isEnabled = false;

  // I18n messages
  let extensionName = '';
  let unsupportedMessage = '';
  let settingsTitle = '';

  /**
   * Initialize text using i18n
   */
  function initializeI18n() {
    extensionName = chrome.i18n.getMessage('extensionName');
    unsupportedMessage = chrome.i18n.getMessage('unsupportedDomain');
    settingsTitle = chrome.i18n.getMessage('settings');
  }

  /**
   * 現在のタブの情報を取得
   */
  async function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs.length > 0 ? tabs[0] : null;
  }

  /**
   * 設定を読み込む
   */
  function loadSettings(): Promise<any> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (data) => {
        currentSettings = data;
        resolve(data);
      });
    });
  }

  /**
   * サイトごとの有効/無効を切り替え
   */
  function toggleSiteEnabled() {
    if (!currentService || !currentTab?.url) return;
    
    const domain = new URL(currentTab.url).hostname;
    
    // サービスに直接enabledフラグを設定して保存
    if (currentSettings.services) {
      currentSettings.services[domain].enabled = isEnabled;
      chrome.storage.sync.set({ services: currentSettings.services });
    }
  }

  /**
   * 詳細設定を開く
   */
  function openOptionsPage() {
    chrome.runtime.openOptionsPage();
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
      domain = url.hostname;
      
      // 設定を読み込む
      await loadSettings();
      
      // 現在のドメインに対応するサービス設定を検索（ワイルドカード対応）
      currentService = findMatchingService(domain, currentSettings.services);
      
      // サポートされているサイトかどうかで表示を切り替え
      if (currentService) {
        isEnabled = currentService.enabled !== false;
        isSupported = true;
      } else {
        isSupported = false;
      }
      
    } catch (error) {
      console.error('An error occurred during initialization:', error);
    }
  }

  onMount(() => {
    initializeUI();
  });
</script>

<div class="popup-container">
  <!-- Domain display -->
  <div class="domain-section">
    <div id="site-domain-display">
      <span class="site-domain">{domain}</span>
    </div>
  </div>

  <!-- Toggle button -->
  <div class="toggle-section">
    {#if isSupported}
      <div class="site-toggle-container">
        <label class="toggle large-toggle">
          <input 
            type="checkbox" 
            bind:checked={isEnabled}
            on:change={toggleSiteEnabled}
          >
          <span class="slider"></span>
        </label>
      </div>
    {:else}
      <div class="site-not-supported">
        <div class="not-supported-message">
          <p>{unsupportedMessage}</p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Footer section -->
  <div class="footer-section">
    <div class="brand">{extensionName}</div>
    <div class="controls">
      <button class="btn options-btn" title={settingsTitle} on:click={openOptionsPage}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2" />
            <circle cx="12" cy="12" r="3" />
          </g>
        </svg>
      </button>
    </div>
  </div>
</div>
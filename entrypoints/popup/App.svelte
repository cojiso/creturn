<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import type { Tabs } from 'wxt/browser';

  import { findMatchingSite } from '~/lib/utils';
  import { ensureSitesKey } from '~/lib/config';

  // State variables
  let currentTab: Tabs.Tab | null = null;
  let currentSettings: any = null;
  let currentSite: any = null;
  let domain = 'Loading...';
  let isSupported = false;
  let isEnabled = false;

  // I18n messages - デフォルト値を設定
  let extensionName = 'cReturn';
  let unsupportedMessage = 'This site is not supported';
  let settingsTitle = 'Settings';

  /**
   * Initialize text using i18n
   */
  function initializeI18n() {
    try {
      if (chrome?.i18n) {
        extensionName = browser.i18n.getMessage('metadata_name');
        unsupportedMessage = browser.i18n.getMessage('popup_unsupportedDomain');
        settingsTitle = browser.i18n.getMessage('options');
      }
    } catch (error) {
      console.warn('i18n initialization failed:', error);
    }
  }

  /**
   * 現在のタブの情報を取得
   */
  async function getCurrentTab(): Promise<Tabs.Tab | null> {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      return tabs.length > 0 ? tabs[0] : null;
    } catch (error) {
      console.error('Failed to get current tab:', error);
      return null;
    }
  }

  /**
   * 設定を読み込む
   */
  async function loadSettings(): Promise<any> {
    try {
      const data = await browser.storage.sync.get(null);
      currentSettings = data;
      return data;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {};
    }
  }

  /**
   * サイトごとの有効/無効を切り替え
   */
  function toggleSiteEnabled() {
    if (!currentSite || !currentTab?.url) return;

    const tabDomain = new URL(currentTab.url).hostname;

    // ensureSitesKey()実行済みのため、sitesを直接取得
    const sites = currentSettings.sites || {};
    sites[tabDomain].enabled = isEnabled;

    // sitesキーで保存
    browser.storage.sync.set({ sites: sites });
  }

  /**
   * 詳細設定を開く
   */
  function openOptionsPage() {
    browser.runtime.openOptionsPage();
  }

  /**
   * UIを初期化
   */
  async function initializeUI() {
    try {
      await ensureSitesKey();

      // i18nの初期化
      initializeI18n();

      // 現在のタブ情報を取得
      currentTab = await getCurrentTab();
      
      if (!currentTab || !currentTab.url) {
        domain = 'Unknown domain';
        isSupported = false;
        return;
      }
      
      // タブのURLからドメインを取得
      try {
        const url = new URL(currentTab.url);
        domain = url.hostname;
      } catch (urlError) {
        domain = 'Invalid URL';
        isSupported = false;
        return;
      }
      
      // 設定を読み込む
      await loadSettings();

      // ensureSitesKey()実行済みのため、sitesを直接取得
      const sites = currentSettings.sites || {};

      // 現在のドメインに対応するサイト設定を検索（ワイルドカード対応）
      currentSite = findMatchingSite(domain, sites);

      // サポートされているサイトかどうかで表示を切り替え
      if (currentSite) {
        isEnabled = currentSite.enabled !== false;
        isSupported = true;
      } else {
        isSupported = false;
      }
      
    } catch (error) {
      console.error('An error occurred during initialization:', error);
      domain = 'Error loading';
      isSupported = false;
    }
  }

  // WXT スタイルのコンテキスト管理（ctx風）
  class PopupContext {
    private _isValid = true;
    private _timeouts: number[] = [];
    private _intervals: number[] = [];

    get isValid() { return this._isValid; }
    get isInvalid() { return !this._isValid; }

    // WXT ctx風のsetTimeout
    setTimeout(callback: Function, delay: number) {
      if (this._isValid) {
        const id = setTimeout(() => {
          if (this._isValid) callback();
        }, delay);
        this._timeouts.push(id);
        return id;
      }
    }

    // WXT ctx風のsetInterval  
    setInterval(callback: Function, delay: number) {
      if (this._isValid) {
        const id = setInterval(() => {
          if (this._isValid) callback();
        }, delay);
        this._intervals.push(id);
        return id;
      }
    }

    // クリーンアップ
    invalidate() {
      this._isValid = false;
      this._timeouts.forEach(id => clearTimeout(id));
      this._intervals.forEach(id => clearInterval(id));
      this._timeouts = [];
      this._intervals = [];
    }
  }

  // ポップアップ用のコンテキスト
  const popupCtx = new PopupContext();

  // WXT スタイルの初期化 - ブラウザAPI待機
  async function initializeWXT(): Promise<void> {
    if (popupCtx.isInvalid) return; // コンテキストが無効な場合は終了

    // ブラウザAPIが利用可能になるまで再帰的に待機
    const api = (globalThis as any).browser || chrome;
    if (typeof api === 'undefined' || !api?.tabs) {
      return new Promise<void>(resolve => 
        popupCtx.setTimeout(() => resolve(initializeWXT()), 10)
      );
    }
    
    await initializeUI();
  }
  
  // 即座に初期化開始
  initializeWXT();
  
  // フォールバック用のonMount
  onMount(() => {
    // 既に初期化されている場合はスキップ
    if (domain === 'Loading...' && popupCtx.isValid) {
      initializeWXT();
    }

    // クリーンアップ関数を返す
    return () => {
      popupCtx.invalidate();
    };
  });
</script>

<div class="popup-container">
  <!-- Domain display -->
  <div class="domain-section">
    <div class="site-domain-display">
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
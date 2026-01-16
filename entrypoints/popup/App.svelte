<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import type { Tabs } from 'wxt/browser';
  import { i18n } from '#i18n';

  import { findMatchingSite } from '~/lib/utils';
  import { ensureSitesKey } from '~/lib/config';
  import { sites as sitesStorage } from '~/lib/storage';
  import type { SiteConfig } from '~/lib/types';

  // State variables
  let currentTab: Tabs.Tab | null = null;
  let currentSites: Record<string, SiteConfig> = {};
  let currentSite: SiteConfig | null = null;
  let domain = 'Loading...';
  let isSupported = false;
  let isEnabled = false;

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
   * サイトごとの有効/無効を切り替え
   */
  async function toggleSiteEnabled() {
    if (!currentSite || !currentTab?.url) return;

    const tabDomain = new URL(currentTab.url).hostname;
    currentSites[tabDomain].enabled = isEnabled;
    await sitesStorage.setValue(currentSites);
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
      currentSites = await sitesStorage.getValue();

      // 現在のドメインに対応するサイト設定を検索（ワイルドカード対応）
      currentSite = findMatchingSite(domain, currentSites);

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

  // 初期化
  onMount(() => {
    initializeUI();
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
          <p>{i18n.t('popup_unsupportedDomain')}</p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Footer section -->
  <div class="footer-section">
    <div class="brand">{i18n.t('metadata_name')}</div>
    <div class="controls">
      <button class="btn options-btn" title={i18n.t('options')} on:click={openOptionsPage}>
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

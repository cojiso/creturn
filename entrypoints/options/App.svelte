<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import { i18n } from '#i18n';
  import {
    resetToDefaults,
    loadConfig,
    loadLocalConfig,
    loadRemoteCustomConfig,
    CONFIG_SOURCES,
    ensureSitesKey
  } from '~/lib/config';
  import type { SiteConfig } from '~/lib/types';

  // 型定義
  interface SitesData {
    [domain: string]: SiteConfig;
  }

  const BASE_URL = "https://raw.githubusercontent.com/";
  const DEFAULT_LATEST_PATH = "cojiso/creturn/main/public/creturn-config.jsonc";

  // State variables
  let currentSettings: any = {
    configUrl: BASE_URL + DEFAULT_LATEST_PATH,
    sites: {}
  };

  let configType = 'default-latest';
  let configUrl = '';
  let configStatus = '';
  let configStatusClass = '';
  let saveStatus = '';
  let saveStatusClass = '';
  let sitesLoading = true;
  let sites: SitesData = {};

  /**
   * configUrlの値から設定タイプを判定する
   */
  function getConfigType(configUrl: string): string {
    if (!configUrl || configUrl === "") {
      return "default";
    } else if (configUrl === BASE_URL + DEFAULT_LATEST_PATH) {
      return "default-latest";
    } else {
      return "github";
    }
  }

  /**
   * 設定をロードしてUIに表示
   */
  async function loadSettings() {
    try {
      await ensureSitesKey();

      const api = (globalThis as any).browser || chrome;
      if (!api?.storage) return;

      api.storage.sync.get(null, (data) => {
      currentSettings = data || { configUrl: BASE_URL + DEFAULT_LATEST_PATH, sites: {} };
      
      // configUrlの値で設定タイプを判定
      configType = getConfigType(currentSettings.configUrl);
      
      if (configType === "default") {
        configUrl = "";
      } else if (configType === "default-latest") {
        configUrl = "";
      } else { // github
        const fullUrl = currentSettings.configUrl || '';
        if (fullUrl.startsWith(BASE_URL)) {
          configUrl = fullUrl.substring(BASE_URL.length);
        } else {
          configUrl = fullUrl;
        }
      }
      
      const sitesData = currentSettings.sites || {};
      if (Object.keys(sitesData).length === 0) {
        // サイト設定が空の場合は設定タイプに応じて自動ロード
        sitesLoading = true;
        autoLoadConfigByType();
      } else {
        // サイト設定がある場合は表示
        displaySites(sitesData);
      }
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * サイトのリストを表示
   */
  function displaySites(sitesData: SitesData) {
    sitesLoading = false;
    sites = sitesData;
  }

  /**
   * 設定タイプに応じて自動的に設定をロード
   */
  async function autoLoadConfigByType() {
    try {
      if (configType === 'default') {
        // ローカル設定を読み込む
        const sitesData = await loadLocalConfig() as SitesData;

        // 既存のサイトからenabledフラグを引き継ぐ
        if (currentSettings.sites) {
          Object.entries(sitesData).forEach(([siteDomain, siteConfig]) => {
            if (currentSettings.sites[siteDomain]) {
              siteConfig.enabled = currentSettings.sites[siteDomain].enabled;
            }
          });
        }
        currentSettings.sites = sitesData;
        currentSettings.configUrl = "";

        // Chrome Storageに保存してからUIを更新
        browser.storage.sync.set(currentSettings, () => {
          displaySites(currentSettings.sites);
        });
      } else if (configType === 'default-latest') {
        // リモート最新設定を読み込む
        const newSites = await loadRemoteCustomConfig(BASE_URL + DEFAULT_LATEST_PATH) as SitesData;

        if (newSites) {
          // 既存のサイトからenabledフラグを引き継ぐ
          if (currentSettings.sites) {
            Object.entries(newSites).forEach(([siteDomain, siteConfig]) => {
              if (currentSettings.sites[siteDomain]) {
                siteConfig.enabled = currentSettings.sites[siteDomain].enabled;
              } else {
                siteConfig.enabled = true;
              }
            });
          }

          currentSettings.sites = newSites;

          // Chrome Storageに保存してからUIを更新
          browser.storage.sync.set(currentSettings, () => {
            displaySites(currentSettings.sites);
          });
        } else {
          throw new Error('Failed to retrieve configuration file');
        }
      }
      // github タイプの場合は手動ロードのみ
    } catch (error) {
      console.error('Auto-load configuration error:', error);
      sitesLoading = false;
    }
  }

  /**
   * サイトの有効/無効状態を更新
   */
  function updateSiteStatus(siteDomain: string, enabled: boolean) {
    const sites = currentSettings.sites || {};

    if (!sites[siteDomain]) {
      sites[siteDomain] = {} as SiteConfig;
    }

    sites[siteDomain].enabled = enabled;

    // sitesキーで保存
    currentSettings.sites = sites;

    // 現在の設定をすべてChrome Storageに即時保存
    const api = (globalThis as any).browser || chrome;
    if (!api?.storage) return;

    api.storage.sync.set(currentSettings, () => {
      saveStatus = i18n.t('site_result_saved');
      saveStatusClass = 'status success';

      // Clear message after a delay
      setTimeout(() => {
        saveStatus = '';
        saveStatusClass = 'status';
      }, 1500);
    });
  }

  /**
   * 設定をデフォルト値にリセット
   */
  async function resetSettings() {
    if (confirm(i18n.t('config_reset_dialogue'))) {
      try {
        const resetResult = await resetToDefaults();

        if (resetResult.success) {
          // 設定を再読み込み
          loadSettings();

          saveStatus = i18n.t('config_reset_result_success');
          saveStatusClass = 'status success';

          setTimeout(() => {
            saveStatus = '';
            saveStatusClass = 'status';
          }, 3000);
        } else {
          throw new Error(resetResult.message || 'Reset failed');
        }
      } catch (error) {
        console.error('An error occurred during reset process:', error);
        saveStatus = i18n.t('config_reset_result_error');
        saveStatusClass = 'status error';
      }
    }
  }

  /**
   * リモート設定ファイルを読み込む
   */
  async function loadRemoteConfig() {
    let urlPath = configUrl;

    if (!urlPath) {
      configStatus = i18n.t('config_jsonc_status_enterUrl');
      configStatusClass = 'status error';
      return;
    }

    configStatus = i18n.t('config_load_status');
    configStatusClass = 'status';
    
    // GitHub URLを構築
    const fullUrl = BASE_URL + urlPath;
    
    try {
      const newSites = await loadRemoteCustomConfig(fullUrl) as SitesData;

      if (!newSites) {
        throw new Error('Failed to retrieve configuration file');
      }

      // 既存のサイトからenabledフラグを引き継ぐ
      if (currentSettings.sites) {
        Object.entries(newSites).forEach(([siteDomain, siteConfig]) => {
          if (currentSettings.sites[siteDomain]) {
            siteConfig.enabled = currentSettings.sites[siteDomain].enabled;
          } else {
            siteConfig.enabled = true;
          }
        });
      }

      currentSettings.sites = newSites;
      currentSettings.configUrl = fullUrl;

      // Chrome Storageに保存してからUI を更新

      browser.storage.sync.set(currentSettings, () => {
        displaySites(currentSettings.sites);

        configStatus = i18n.t('config_load_result_success');
        configStatusClass = 'status success';

        saveStatus = '';
        saveStatusClass = 'status';
      });

    } catch (error: any) {
      console.error('Configuration file loading error:', error);
      configStatus = i18n.t('config_load_result_error', [error.message]);
      configStatusClass = 'status error';
    }
  }

  /**
   * 設定タイプ変更時の処理
   */
  async function handleConfigTypeChange() {
    if (configType === 'default') {
      configUrl = "";
      
      // ローカル設定を読み込む
      sitesLoading = true;
      try {
        const sitesData = await loadLocalConfig() as SitesData;

        // 既存のサイトからenabledフラグを引き継ぐ
        if (currentSettings.sites) {
          Object.entries(sitesData).forEach(([siteDomain, siteConfig]) => {
            if (currentSettings.sites[siteDomain]) {
              siteConfig.enabled = currentSettings.sites[siteDomain].enabled;
            }
          });
        }
        currentSettings.sites = sitesData;
        currentSettings.configUrl = "";

        // Chrome Storageに即時保存

        browser.storage.sync.set(currentSettings, () => {
          displaySites(currentSettings.sites);
          saveStatus = i18n.t('config_load_result_success');
          saveStatusClass = 'status success';

          setTimeout(() => {
            saveStatus = '';
            saveStatusClass = 'status';
          }, 1500);
        });
      } catch (error) {
        console.error('Local configuration loading error:', error);
      }
    } else if (configType === 'default-latest') {
      currentSettings.configUrl = BASE_URL + DEFAULT_LATEST_PATH;
      configUrl = "";

      // default-latestの場合も自動でリモート設定をロード
      sitesLoading = true;
      try {
        const newSites = await loadRemoteCustomConfig(BASE_URL + DEFAULT_LATEST_PATH) as SitesData;

        if (newSites) {
          // 既存のサイトからenabledフラグを引き継ぐ
          if (currentSettings.sites) {
            Object.entries(newSites).forEach(([siteDomain, siteConfig]) => {
              if (currentSettings.sites[siteDomain]) {
                siteConfig.enabled = currentSettings.sites[siteDomain].enabled;
              } else {
                siteConfig.enabled = true;
              }
            });
          }

          currentSettings.sites = newSites;

          // Chrome Storageに保存してからUIを更新
          browser.storage.sync.set(currentSettings, () => {
            displaySites(currentSettings.sites);
            saveStatus = i18n.t('config_load_result_success');
            saveStatusClass = 'status success';

            setTimeout(() => {
              saveStatus = '';
              saveStatusClass = 'status';
            }, 1500);
          });
        } else {
          throw new Error('Failed to retrieve configuration file');
        }
      } catch (error) {
        console.error('Default-latest configuration loading error:', error);
        sitesLoading = false;
        saveStatus = i18n.t('config_load_result_error', [(error as any).message]);
        saveStatusClass = 'status error';
      }
    } else if (configType === 'github') {
      // default-latestのURLが設定されている場合はクリア
      if (currentSettings.configUrl === BASE_URL + DEFAULT_LATEST_PATH) {
        configUrl = "";
        currentSettings.configUrl = "";
      }

      saveStatus = i18n.t('config_jsonc_status_enterUrl');
      saveStatusClass = 'status warning';
    }
  }

  /**
   * URL変更時の処理
   */
  function handleUrlChange() {
    if (configType === 'github') {
      const urlPath = configUrl;
      if (urlPath) {
        currentSettings.configUrl = BASE_URL + urlPath;
      } else {
        currentSettings.configUrl = "";
      }
    }

    saveStatus = i18n.t('config_jsonc_status_unsavedChanges');
    saveStatusClass = 'status warning';
  }

  // WXT スタイルのコンテキスト管理（ctx風）
  class OptionsContext {
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

  // オプション用のコンテキスト
  const optionsCtx = new OptionsContext();

  // WXT スタイルの初期化 - ブラウザAPI待機
  async function initializeWXT(): Promise<void> {
    if (optionsCtx.isInvalid) return; // コンテキストが無効な場合は終了

    // ブラウザAPIが利用可能になるまで再帰的に待機
    const api = (globalThis as any).browser || chrome;
    if (typeof api === 'undefined' || !api?.storage) {
      return new Promise<void>(resolve =>
        optionsCtx.setTimeout(() => resolve(initializeWXT()), 10)
      );
    }

    // 初期化実行
    loadSettings();
  }

  // 即座に初期化開始
  initializeWXT();

  // フォールバック用のonMount
  onMount(() => {
    // 既に初期化されている場合はスキップ
    if (optionsCtx.isValid) {
      initializeWXT();
    }

    // クリーンアップ関数を返す
    return () => {
      optionsCtx.invalidate();
    };
  });
</script>

<div class="container">
  <h1>{i18n.t('metadata_name')} {i18n.t('options')}</h1>

  <section class="section">
    <h2>{i18n.t('config_jsonc_title')}</h2>
    <div class="config-type-selection">
      <div class="radio-option">
        <input
          type="radio"
          id="default-config"
          bind:group={configType}
          value="default"
          on:change={handleConfigTypeChange}
        >
        <label for="default-config">{i18n.t('config_jsonc_useDefaultStable')}</label>
      </div>
      <div class="radio-option">
        <input
          type="radio"
          id="default-latest-config"
          bind:group={configType}
          value="default-latest"
          on:change={handleConfigTypeChange}
        >
        <label for="default-latest-config">{i18n.t('config_jsonc_useDefaultLatest')}</label>
      </div>
      <div class="radio-option">
        <input
          type="radio"
          id="github-config"
          bind:group={configType}
          value="github"
          on:change={handleConfigTypeChange}
        >
        <label for="github-config">{i18n.t('config_jsonc_useGithub')}</label>
      </div>
    </div>

    <div class="url-input-group">
      <span class="url-prefix" class:disabled={configType !== 'github'}>{BASE_URL}</span>
      <input
        type="text"
        bind:value={configUrl}
        on:input={handleUrlChange}
        disabled={configType !== 'github'}
        placeholder="user/repo/raw/main/creturn-config.jsonc"
      >
      <button
        class="btn primary"
        disabled={configType === 'default'}
        on:click={loadRemoteConfig}
      >
        {i18n.t('config_load_button')}
      </button>
    </div>
    <div class="status-container">
      <span class={configStatusClass}>{configStatus}</span>
    </div>
  </section>

  <section class="section">
    <h2>{i18n.t('site_title')}</h2>
    {#if sitesLoading}
      <div class="loading-indicator">{i18n.t('config_load_status')}</div>
    {:else if Object.keys(sites).length === 0}
      <p>{i18n.t('site_noSites')}</p>
    {:else}
      <div class="sites-list">
        {#each Object.entries(sites) as [siteDomain, siteConfig]}
          <div class="site-item">
            <div class="site-info">
              <div class="site-name">{siteConfig.name}</div>
              <div class="site-domain">{siteDomain}</div>
              <div class="site-selectors">{i18n.t('site_selector', [siteConfig.selectors.join(', ')])}</div>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                checked={siteConfig.enabled ?? true}
                on:change={(e) => updateSiteStatus(siteDomain, e.currentTarget.checked)}
              >
              <span class="slider"></span>
            </label>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <div class="footer">
    <span class={saveStatusClass}>{saveStatus}</span>
    <button class="btn secondary" on:click={resetSettings}>{i18n.t('config_reset_button')}</button>
  </div>
</div>

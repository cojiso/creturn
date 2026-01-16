<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { i18n } from '#i18n';
  import {
    resetToDefaults,
    loadLocalConfig,
    loadRemoteCustomConfig,
    ensureSitesKey
  } from '~/lib/config';
  import type { SiteConfig } from '~/lib/types';
  import { configUrl as configUrlStorage, sites as sitesStorage, DEFAULT_CONFIG_URL } from '~/lib/storage';

  // 型定義
  type SitesData = Record<string, SiteConfig>;

  const BASE_URL = "https://raw.githubusercontent.com/";
  const DEFAULT_LATEST_PATH = "cojiso/creturn/main/public/creturn-config.jsonc";

  const STATUS_BASE = 'inline-block rounded px-2 py-1 text-xs';
  const STATUS_DEFAULT = `${STATUS_BASE} text-[var(--text-secondary)]`;
  const STATUS_SUCCESS = `${STATUS_BASE} bg-[rgba(15,157,88,0.1)] text-[var(--success-color)]`;
  const STATUS_WARNING = `${STATUS_BASE} bg-[rgba(244,180,0,0.1)] text-[var(--warning-color)]`;
  const STATUS_ERROR = `${STATUS_BASE} bg-[rgba(217,48,37,0.1)] text-[var(--error-color)]`;

  // State variables
  let currentSettings: any = {
    configUrl: BASE_URL + DEFAULT_LATEST_PATH,
    sites: {}
  };

  let configType = 'default-latest';
  let configUrl = '';
  let configStatus = '';
  let configStatusClass = STATUS_DEFAULT;
  let saveStatus = '';
  let saveStatusClass = STATUS_DEFAULT;
  let sitesLoading = true;
  let sites: SitesData = {};
  const timeoutIds: Array<ReturnType<typeof setTimeout>> = [];

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

      const storedConfigUrl = await configUrlStorage.getValue();
      const storedSites = await sitesStorage.getValue();

      currentSettings = {
        configUrl: storedConfigUrl,
        sites: storedSites
      };

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

  function scheduleTimeout(callback: () => void, delay: number) {
    const id = setTimeout(callback, delay);
    timeoutIds.push(id);
    return id;
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

        // ストレージに保存してからUIを更新
        await configUrlStorage.setValue("");
        await sitesStorage.setValue(currentSettings.sites);
        displaySites(currentSettings.sites);
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

          // ストレージに保存してからUIを更新
          await sitesStorage.setValue(currentSettings.sites);
          displaySites(currentSettings.sites);
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
  async function updateSiteStatus(siteDomain: string, enabled: boolean) {
    const sitesData = currentSettings.sites || {};

    if (!sitesData[siteDomain]) {
      sitesData[siteDomain] = {} as SiteConfig;
    }

    sitesData[siteDomain].enabled = enabled;
    currentSettings.sites = sitesData;

    // ストレージに即時保存
    await sitesStorage.setValue(currentSettings.sites);

    saveStatus = i18n.t('site_result_saved');
    saveStatusClass = STATUS_SUCCESS;

    scheduleTimeout(() => {
      saveStatus = '';
      saveStatusClass = STATUS_DEFAULT;
    }, 1500);
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
          saveStatusClass = STATUS_SUCCESS;

          scheduleTimeout(() => {
            saveStatus = '';
            saveStatusClass = STATUS_DEFAULT;
          }, 3000);
        } else {
          throw new Error(resetResult.message || 'Reset failed');
        }
      } catch (error) {
        console.error('An error occurred during reset process:', error);
        saveStatus = i18n.t('config_reset_result_error');
        saveStatusClass = STATUS_ERROR;
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
      configStatusClass = STATUS_ERROR;
      return;
    }

    configStatus = i18n.t('config_load_status');
    configStatusClass = STATUS_DEFAULT;

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

      // ストレージに保存してからUIを更新
      await configUrlStorage.setValue(fullUrl);
      await sitesStorage.setValue(currentSettings.sites);
      displaySites(currentSettings.sites);

      configStatus = i18n.t('config_load_result_success');
      configStatusClass = STATUS_SUCCESS;

      saveStatus = '';
      saveStatusClass = STATUS_DEFAULT;

    } catch (error: any) {
      console.error('Configuration file loading error:', error);
      configStatus = i18n.t('config_load_result_error', [error.message]);
      configStatusClass = STATUS_ERROR;
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

        // ストレージに即時保存
        await configUrlStorage.setValue("");
        await sitesStorage.setValue(currentSettings.sites);
        displaySites(currentSettings.sites);

        saveStatus = i18n.t('config_load_result_success');
        saveStatusClass = STATUS_SUCCESS;

        scheduleTimeout(() => {
          saveStatus = '';
          saveStatusClass = STATUS_DEFAULT;
        }, 1500);
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

          // ストレージに保存してからUIを更新
          await configUrlStorage.setValue(BASE_URL + DEFAULT_LATEST_PATH);
          await sitesStorage.setValue(currentSettings.sites);
          displaySites(currentSettings.sites);

          saveStatus = i18n.t('config_load_result_success');
          saveStatusClass = STATUS_SUCCESS;

          scheduleTimeout(() => {
            saveStatus = '';
            saveStatusClass = STATUS_DEFAULT;
          }, 1500);
        } else {
          throw new Error('Failed to retrieve configuration file');
        }
      } catch (error) {
        console.error('Default-latest configuration loading error:', error);
        sitesLoading = false;
        saveStatus = i18n.t('config_load_result_error', [(error as any).message]);
        saveStatusClass = STATUS_ERROR;
      }
    } else if (configType === 'github') {
      // default-latestのURLが設定されている場合はクリア
      if (currentSettings.configUrl === BASE_URL + DEFAULT_LATEST_PATH) {
        configUrl = "";
        currentSettings.configUrl = "";
      }

      saveStatus = i18n.t('config_jsonc_status_enterUrl');
      saveStatusClass = STATUS_WARNING;
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
    saveStatusClass = STATUS_WARNING;
  }

  // 初期化
  onMount(() => {
    loadSettings();
  });

  onDestroy(() => {
    timeoutIds.forEach(id => clearTimeout(id));
    timeoutIds.length = 0;
  });
</script>

<div class="mx-auto max-w-[800px] p-5 text-sm leading-[21px] text-[var(--text-color)]">
  <h1 class="mb-5 border-b border-[var(--border-color)] pb-2.5 text-2xl font-medium">{i18n.t('metadata_name')} {i18n.t('options')}</h1>

  <section class="mb-5 rounded-lg border border-[var(--border-color)] bg-[var(--section-bg)] px-5 py-4">
    <h2 class="mb-3.5 text-lg font-medium">{i18n.t('config_jsonc_title')}</h2>
    <div class="mb-4 flex flex-col gap-2.5">
      <div class="flex items-center gap-2">
        <input
          type="radio"
          id="default-config"
          bind:group={configType}
          value="default"
          on:change={handleConfigTypeChange}
        >
        <label for="default-config">{i18n.t('config_jsonc_useDefaultStable')}</label>
      </div>
      <div class="flex items-center gap-2">
        <input
          type="radio"
          id="default-latest-config"
          bind:group={configType}
          value="default-latest"
          on:change={handleConfigTypeChange}
        >
        <label for="default-latest-config">{i18n.t('config_jsonc_useDefaultLatest')}</label>
      </div>
      <div class="flex items-center gap-2">
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

    <div class="mb-2.5 mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0">
      <span
        class="flex h-[34px] items-center whitespace-nowrap rounded border border-[var(--border-color)] bg-[var(--secondary-color)] px-2 font-mono text-[13px] leading-none text-[var(--text-secondary)] sm:rounded-l sm:rounded-r-none sm:border-r-0"
        class:opacity-60={configType !== 'github'}
        class:cursor-not-allowed={configType !== 'github'}
      >
        {BASE_URL}
      </span>
      <input
        type="text"
        bind:value={configUrl}
        on:input={handleUrlChange}
        disabled={configType !== 'github'}
        placeholder="user/repo/raw/main/creturn-config.jsonc"
        class="h-[34px] flex-1 rounded border border-[var(--border-color)] bg-transparent px-2 font-mono text-[13px] leading-none outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-none sm:border-x-0"
      >
      <button
        class="h-[34px] w-full rounded border border-[var(--border-color)] bg-[var(--primary-color)] px-3 text-[13px] font-medium leading-none text-white transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:rounded-l-none sm:rounded-r sm:border-l-0"
        disabled={configType === 'default'}
        on:click={loadRemoteConfig}
      >
        {i18n.t('config_load_button')}
      </button>
    </div>
    <div class="mt-2.5">
      <span class={configStatusClass}>{configStatus}</span>
    </div>
  </section>

  <section class="mb-5 rounded-lg border border-[var(--border-color)] bg-[var(--section-bg)] px-5 py-4">
    <h2 class="mb-3.5 text-lg font-medium">{i18n.t('site_title')}</h2>
    {#if sitesLoading}
      <div class="py-2.5 text-center text-[var(--text-secondary)]">{i18n.t('config_load_status')}</div>
    {:else if Object.keys(sites).length === 0}
      <p class="text-[var(--text-secondary)]">{i18n.t('site_noSites')}</p>
    {:else}
      <div class="mt-2.5">
        {#each Object.entries(sites) as [siteDomain, siteConfig]}
          <div class="flex items-center justify-between border-b border-[var(--border-color)] py-2.5 last:border-b-0">
            <div class="flex flex-col">
              <div class="font-medium">{siteConfig.name}</div>
              <div class="text-xs text-[var(--text-secondary)]">{siteDomain}</div>
              <div class="mt-1 text-xs text-[var(--text-secondary)]">{i18n.t('site_selector', [siteConfig.selectors.join(', ')])}</div>
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

  <div class="mt-5 flex items-center justify-between border-t border-[var(--border-color)] pt-4">
    <span class={`flex-1 pr-5 ${saveStatusClass}`}>{saveStatus}</span>
    <button
      class="min-w-[120px] rounded border border-[var(--border-color)] bg-[var(--secondary-color)] px-4 py-2 text-sm text-[var(--text-color)] transition-colors hover:bg-[var(--secondary-hover)]"
      on:click={resetSettings}
    >
      {i18n.t('config_reset_button')}
    </button>
  </div>
</div>

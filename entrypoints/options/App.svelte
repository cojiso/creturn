<script lang="ts">
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

  const STATUS_BASE = 'inline-block rounded-md px-2.5 py-1 text-[11px] leading-4';
  const STATUS_DEFAULT = `${STATUS_BASE} text-(--text-secondary)`;
  const STATUS_SUCCESS = `${STATUS_BASE} bg-(--success-bg) text-(--success-color)`;
  const STATUS_WARNING = `${STATUS_BASE} bg-(--warning-bg) text-(--warning-color)`;
  const STATUS_ERROR = `${STATUS_BASE} bg-(--error-bg) text-(--error-color)`;

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
  let isConfigMenuOpen = false;

  function clearActiveRing(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement | null;
    target?.classList.remove('active');
  }

  function toggleConfigMenu(event: MouseEvent) {
    event.stopPropagation();
    isConfigMenuOpen = !isConfigMenuOpen;
  }

  function closeConfigMenu() {
    isConfigMenuOpen = false;
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isConfigMenuOpen = false;
    }
  }

  function activateRing(event: Event) {
    const input = event.currentTarget as HTMLInputElement | null;
    input?.closest('label')?.classList.add('active');
  }

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

    setTimeout(() => {
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

          setTimeout(() => {
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

        setTimeout(() => {
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

          setTimeout(() => {
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

  }

  // 即座に初期化開始（WXTではonMountが呼ばれない場合があるため）
  loadSettings();
</script>

<svelte:window
  on:click={closeConfigMenu}
  on:keydown={handleWindowKeydown}
/>

<div class="mx-auto max-w-205 px-8 py-10 text-[15px] leading-6 text-(--text-color)">
  <div class="mb-4 flex items-center justify-between gap-3">
    <h1 class="text-[22px] font-semibold leading-7 tracking-[-0.01em]">
      {i18n.t('metadata_name')} {i18n.t('options')}
    </h1>
    <div class="relative">
      <button
        class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-(--text-secondary) transition-colors hover:bg-(--secondary-hover)"
        type="button"
        aria-haspopup="menu"
        aria-label="More options"
        on:click={toggleConfigMenu}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-icon lucide-ellipsis"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      </button>
      {#if isConfigMenuOpen}
        <div
          id="config-menu"
          class="config-menu-popover absolute right-0 top-full w-max overflow-hidden rounded-2xl border border-(--border-color) bg-(--section-bg) shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
          role="menu"
          tabindex="0"
          on:click|stopPropagation
          on:keydown|stopPropagation
        >
          <button
            class="flex w-full items-center gap-2 whitespace-nowrap px-5 py-4 text-left text-[14px] text-(--error-color) transition-colors hover:bg-(--secondary-color)"
            type="button"
            role="menuitem"
            on:click={() => {
              resetSettings();
              isConfigMenuOpen = false;
            }}
          >
            {i18n.t('config_reset_button')}
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- 設定ファイル -->
  <section class="mb-6">
    <h2 class="mb-1 px-5 text-[15px] font-bold text-[#85858A]">{i18n.t('config_jsonc_title')}</h2>
    <div class="rounded-4xl bg-(--section-bg)">
      <div class="relative flex min-h-11 items-center gap-3 px-5 py-4 after:absolute after:bottom-0 after:left-5 after:right-5 after:h-px after:bg-(--border-color) after:content-[''] last:after:hidden">
        <input
          class="h-4 w-4 accent-(--primary-color)"
          type="radio"
          id="default-config"
          bind:group={configType}
          value="default"
          on:change={handleConfigTypeChange}
        >
        <label class="cursor-pointer" for="default-config">{i18n.t('config_jsonc_useDefaultStable')}</label>
      </div>
      <div class="relative flex min-h-11 items-center gap-3 px-5 py-4 after:absolute after:bottom-0 after:left-5 after:right-5 after:h-px after:bg-(--border-color) after:content-[''] last:after:hidden">
        <input
          class="h-4 w-4 accent-(--primary-color)"
          type="radio"
          id="default-latest-config"
          bind:group={configType}
          value="default-latest"
          on:change={handleConfigTypeChange}
        >
        <label class="cursor-pointer" for="default-latest-config">{i18n.t('config_jsonc_useDefaultLatest')}</label>
      </div>
      <div class="relative flex min-h-11 items-center gap-3 px-5 py-4">
        <input
          class="h-4 w-4 accent-(--primary-color)"
          type="radio"
          id="github-config"
          bind:group={configType}
          value="github"
          on:change={handleConfigTypeChange}
        >
        <label class="cursor-pointer" for="github-config">{i18n.t('config_jsonc_useGithub')}</label>
      </div>
    </div>

    <!-- Gihub URL -->
    <div class="mt-4 overflow-hidden rounded-4xl bg-(--section-bg)">
      <fieldset class="contents" disabled={configType !== 'github'}>
        <div class="flex flex-col sm:flex-row sm:items-center sm:pr-3">
          <span
            class={`relative flex min-h-15 items-center whitespace-nowrap rounded-t-4xl border  pl-5 pr-2 py-4 font-mono text-[13px] leading-none ${configType !== 'github' ? 'text-[#b0b0b0] bg-white border-white' : 'text-(--text-secondary) bg-(--secondary-color) border-(--border-color)'} after:absolute after:bottom-0 after:left-5 after:right-5 after:h-px after:bg-(--border-color) after:content-[''] sm:rounded-none sm:rounded-l-4xl sm:border-r sm:after:hidden`}
            class:cursor-not-allowed={configType !== 'github'}
          >
            {BASE_URL}
          </span>
          <input
            class="relative h-11 flex-1 bg-white pl-3 pr-2 font-mono text-[13px] leading-none text-(--text-color) outline-none placeholder:text-[#b0b0b0] after:absolute after:bottom-0 after:left-5 after:right-5 after:h-px after:bg-(--border-color) after:content-[''] disabled:cursor-not-allowed sm:after:hidden"
            type="text"
            bind:value={configUrl}
            on:input={handleUrlChange}
              placeholder="user/repo/raw/main/creturn-config.jsonc"
            >
          <button
            class="inline-flex h-10 w-full items-center justify-center rounded-[20px] bg-(--primary-color) px-5 text-[14px] font-medium leading-none disabled:text-[#b0b0b0] text-white transition-colors hover:bg-(--primary-hover) disabled:cursor-not-allowed disabled:bg-(--secondary-color) sm:w-auto"
            on:click={loadRemoteConfig}
          >
            {i18n.t('config_load_button')}
          </button>
        </div>
      </fieldset>
    </div>
    {#if configStatus}
      <div class="mt-4">
        <span class={configStatusClass}>{configStatus}</span>
      </div>
    {/if}
  </section>

  <!-- 対応サイト -->
  <section class="mb-6">
    <h2 class="mb-1 px-5 text-[15px] font-bold text-[#85858A]">{i18n.t('site_title')}</h2>
    <div class="rounded-4xl bg-(--section-bg)">
      {#if sitesLoading}
        <div class="px-5 py-4 text-[12px] text-(--text-secondary)">{i18n.t('config_load_status')}</div>
      {:else if Object.keys(sites).length === 0}
        <div class="px-5 py-4 text-[12px] text-(--text-secondary)">{i18n.t('site_noSites')}</div>
      {:else}
        {#each Object.entries(sites) as [siteDomain, siteConfig]}
          <div class="relative flex min-h-11 items-center justify-between gap-4 px-5 py-4 after:absolute after:bottom-0 after:left-5 after:right-5 after:h-px after:bg-(--border-color) after:content-[''] last:after:hidden">
            <div class="flex flex-col">
              <div class="font-medium">{siteConfig.name}</div>
              <div class="text-[12px] leading-4 text-(--text-secondary)">{siteDomain}</div>
              <div class="mt-1 text-[12px] leading-4 text-(--text-secondary)">{i18n.t('site_selector', [siteConfig.selectors.join(', ')])}</div>
            </div>
            <label
              class="toggle"
              on:mouseleave={clearActiveRing}
            >
              <input
                type="checkbox"
                checked={siteConfig.enabled ?? true}
                on:change={(e) => {
                  updateSiteStatus(siteDomain, e.currentTarget.checked);
                  activateRing(e);
                }}
              >
              <span class="slider"></span>
            </label>
          </div>
        {/each}
      {/if}
    </div>
  </section>

  <div class="mt-8 flex items-center justify-end pt-4">
    {#if saveStatus}
      <span class={saveStatusClass}>{saveStatus}</span>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    background-color: var(--secondary-color);
  }

  .config-menu-popover {
    z-index: 50;
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import {
    resetToDefaults,
    loadConfig,
    loadLocalConfig,
    loadRemoteCustomConfig,
    CONFIG_SOURCES
  } from '~/lib/config';
  import type { ServiceConfig } from '~/lib/types';

  // 型定義
  interface ServicesData {
    [domain: string]: ServiceConfig;
  }

  const BASE_URL = "https://raw.githubusercontent.com/";
  const DEFAULT_LATEST_PATH = "cojiso/creturn/main/public/creturn-config.jsonc";

  // State variables
  let currentSettings: any = {
    configUrl: BASE_URL + DEFAULT_LATEST_PATH,
    services: {}
  };
  
  let configType = 'default-latest';
  let configUrl = '';
  let configStatus = '';
  let configStatusClass = '';
  let saveStatus = '';
  let saveStatusClass = '';
  let servicesLoading = true;
  let services: ServicesData = {};

  // I18n messages
  let extensionName = '';
  let options = '';
  let messages: any = {};

  /**
   * Initialize internationalization
   */
  function initializeI18n() {
    try {
      extensionName = browser.i18n.getMessage('metadata_name');
      options = browser.i18n.getMessage('options');

      // Initialize all i18n messages
      messages = {
        configFile: browser.i18n.getMessage('config_jsonc_title'),
        useDefaultConfig: browser.i18n.getMessage('config_jsonc_useDefaultStable'),
        useDefaultLatestConfig: browser.i18n.getMessage('config_jsonc_useDefaultLatest'),
        useGithubConfig: browser.i18n.getMessage('config_jsonc_useGithub'),
        load: browser.i18n.getMessage('config_load_button'),
        supportedServices: browser.i18n.getMessage('site_title'),
        loading: browser.i18n.getMessage('config_load_status'),
        resetToDefaults: browser.i18n.getMessage('config_reset_button'),
        noServices: browser.i18n.getMessage('site_noSites'),
        selector: browser.i18n.getMessage('site_selector'),
        settingsSaved: browser.i18n.getMessage('site_result_saved'),
        confirmReset: browser.i18n.getMessage('config_reset_dialogue'),
        settingsResetSuccess: browser.i18n.getMessage('config_reset_result_success'),
        settingsResetError: browser.i18n.getMessage('config_reset_result_error'),
        enterUrl: browser.i18n.getMessage('config_jsonc_status_enterUrl'),
        settingsLoaded: browser.i18n.getMessage('config_load_result_success'),
        loadingError: browser.i18n.getMessage('config_load_result_error'),
        unsavedChanges: browser.i18n.getMessage('config_jsonc_status_unsavedChanges')
      };
    } catch (error) {
      console.warn('i18n initialization failed:', error);
      // Set fallback values
      extensionName = 'cReturn';
      options = 'Options';
      messages = {
        configFile: 'Config File',
        useDefaultConfig: 'Use Default Config',
        useDefaultLatestConfig: 'Use Default Latest Config',
        useGithubConfig: 'Use GitHub Config',
        load: 'Load',
        supportedServices: 'Supported Services',
        loading: 'Loading...',
        resetToDefaults: 'Reset to Defaults',
        noServices: 'No Services',
        selector: 'Selector: $SELECTORS$',
        settingsSaved: 'Settings Saved',
        confirmReset: 'Confirm Reset',
        settingsResetSuccess: 'Settings Reset Successfully',
        settingsResetError: 'Settings Reset Error',
        enterUrl: 'Please enter URL',
        settingsLoaded: 'Settings Loaded',
        loadingError: 'Loading Error: {0}',
        unsavedChanges: 'Unsaved Changes'
      };
    }
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
  function loadSettings() {
    try {
      const api = (globalThis as any).browser || chrome;
      if (!api?.storage) return;
      
      api.storage.sync.get(null, (data) => {
      currentSettings = data || { configUrl: BASE_URL + DEFAULT_LATEST_PATH, services: {} };
      
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
      
      // サービスリストを表示
      const services = currentSettings.services || {};
      if (Object.keys(services).length === 0) {
        // サービス設定が空の場合は設定タイプに応じて自動ロード
        servicesLoading = true;
        autoLoadConfigByType();
      } else {
        // サービス設定がある場合は表示
        displayServices(services);
      }
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * サービスのリストを表示
   */
  function displayServices(servicesData: ServicesData) {
    servicesLoading = false;
    services = servicesData;
  }

  /**
   * 設定タイプに応じて自動的に設定をロード
   */
  async function autoLoadConfigByType() {
    try {
      if (configType === 'default') {
        // ローカル設定を読み込む
        const servicesData = await loadLocalConfig() as ServicesData;
        
        // 既存のサービスからenabledフラグを引き継ぐ
        if (currentSettings.services) {
          Object.entries(servicesData).forEach(([domain, service]) => {
            if (currentSettings.services[domain]) {
              service.enabled = currentSettings.services[domain].enabled;
            }
          });
        }
        currentSettings.services = servicesData;
        currentSettings.configUrl = "";
        
        // Chrome Storageに保存してからUIを更新
        browser.storage.sync.set(currentSettings, () => {
          displayServices(currentSettings.services);
        });
      } else if (configType === 'default-latest') {
        // リモート最新設定を読み込む
        const newServices = await loadRemoteCustomConfig(BASE_URL + DEFAULT_LATEST_PATH) as ServicesData;
        
        if (newServices) {
          // 既存のサービスからenabledフラグを引き継ぐ
          if (currentSettings.services) {
            Object.entries(newServices).forEach(([domain, service]) => {
              if (currentSettings.services[domain]) {
                service.enabled = currentSettings.services[domain].enabled;
              } else {
                service.enabled = true;
              }
            });
          }
          
          currentSettings.services = newServices;
          
          // Chrome Storageに保存してからUIを更新
          browser.storage.sync.set(currentSettings, () => {
            displayServices(currentSettings.services);
          });
        } else {
          throw new Error('Failed to retrieve configuration file');
        }
      }
      // github タイプの場合は手動ロードのみ
    } catch (error) {
      console.error('Auto-load configuration error:', error);
      servicesLoading = false;
    }
  }

  /**
   * ドメインの有効/無効状態を更新
   */
  function updateDomainStatus(domain: string, enabled: boolean) {
    if (!currentSettings.services) {
      currentSettings.services = {};
    }
    
    if (!currentSettings.services[domain]) {
      currentSettings.services[domain] = {};
    }
    
    currentSettings.services[domain].enabled = enabled;
    
    // 現在の設定をすべてChrome Storageに即時保存
    const api = (globalThis as any).browser || chrome;
    if (!api?.storage) return;
    
    api.storage.sync.set(currentSettings, () => {
      saveStatus = messages.settingsSaved;
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
    if (confirm(messages.confirmReset)) {
      try {
        const resetResult = await resetToDefaults();
        
        if (resetResult.success) {
          // 設定を再読み込み
          loadSettings();
          
          saveStatus = messages.settingsResetSuccess;
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
        saveStatus = messages.settingsResetError;
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
      configStatus = messages.enterUrl;
      configStatusClass = 'status error';
      return;
    }
    
    configStatus = messages.loading;
    configStatusClass = 'status';
    
    // GitHub URLを構築
    const fullUrl = BASE_URL + urlPath;
    
    try {
      const newServices = await loadRemoteCustomConfig(fullUrl) as ServicesData;
      
      if (!newServices) {
        throw new Error('Failed to retrieve configuration file');
      }
      
      // 既存のサービスからenabledフラグを引き継ぐ
      if (currentSettings.services) {
        Object.entries(newServices).forEach(([domain, service]) => {
          if (currentSettings.services[domain]) {
            service.enabled = currentSettings.services[domain].enabled;
          } else {
            service.enabled = true;
          }
        });
      }
      
      currentSettings.services = newServices;
      currentSettings.configUrl = fullUrl;
      
      // Chrome Storageに保存してからUI を更新
      
      browser.storage.sync.set(currentSettings, () => {
        displayServices(currentSettings.services);
        
        configStatus = messages.settingsLoaded;
        configStatusClass = 'status success';
        
        saveStatus = '';
        saveStatusClass = 'status';
      });
      
    } catch (error: any) {
      console.error('Configuration file loading error:', error);
      configStatus = browser.i18n.getMessage('config_load_result_error', [error.message]);
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
      servicesLoading = true;
      try {
        const servicesData = await loadLocalConfig() as ServicesData;
        
        // 既存のサービスからenabledフラグを引き継ぐ
        if (currentSettings.services) {
          Object.entries(servicesData).forEach(([domain, service]) => {
            if (currentSettings.services[domain]) {
              service.enabled = currentSettings.services[domain].enabled;
            }
          });
        }
        currentSettings.services = servicesData;
        currentSettings.configUrl = "";
          
        // Chrome Storageに即時保存
            
        browser.storage.sync.set(currentSettings, () => {
          displayServices(currentSettings.services);
          saveStatus = messages.settingsLoaded;
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
      servicesLoading = true;
      try {
        const newServices = await loadRemoteCustomConfig(BASE_URL + DEFAULT_LATEST_PATH) as ServicesData;
        
        if (newServices) {
          // 既存のサービスからenabledフラグを引き継ぐ
          if (currentSettings.services) {
            Object.entries(newServices).forEach(([domain, service]) => {
              if (currentSettings.services[domain]) {
                service.enabled = currentSettings.services[domain].enabled;
              } else {
                service.enabled = true;
              }
            });
          }
          
          currentSettings.services = newServices;
          
          // Chrome Storageに保存してからUIを更新
          browser.storage.sync.set(currentSettings, () => {
            displayServices(currentSettings.services);
            saveStatus = messages.settingsLoaded;
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
        servicesLoading = false;
        saveStatus = browser.i18n.getMessage('config_load_result_error', [(error as any).message]);
        saveStatusClass = 'status error';
      }
    } else if (configType === 'github') {
      // default-latestのURLが設定されている場合はクリア
      if (currentSettings.configUrl === BASE_URL + DEFAULT_LATEST_PATH) {
        configUrl = "";
        currentSettings.configUrl = "";
      }
      
      saveStatus = messages.enterUrl;
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
    
    saveStatus = messages.unsavedChanges;
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
    if (typeof api === 'undefined' || !api?.storage || !api?.i18n) {
      return new Promise<void>(resolve => 
        optionsCtx.setTimeout(() => resolve(initializeWXT()), 10)
      );
    }
    
    // 初期化実行
    initializeI18n();
    loadSettings();
  }
  
  // 即座に初期化開始
  initializeWXT();

  // フォールバック用のonMount
  onMount(() => {
    // 既に初期化されている場合はスキップ
    if (extensionName === '' && optionsCtx.isValid) {
      initializeWXT();
    }

    // クリーンアップ関数を返す
    return () => {
      optionsCtx.invalidate();
    };
  });
</script>

<div class="container">
  <h1>{extensionName} {options}</h1>
  
  <section class="section">
    <h2>{messages.configFile}</h2>
    <div class="config-type-selection">
      <div class="radio-option">
        <input 
          type="radio" 
          id="default-config" 
          bind:group={configType} 
          value="default"
          on:change={handleConfigTypeChange}
        >
        <label for="default-config">{messages.useDefaultConfig}</label>
      </div>
      <div class="radio-option">
        <input 
          type="radio" 
          id="default-latest-config" 
          bind:group={configType} 
          value="default-latest"
          on:change={handleConfigTypeChange}
        >
        <label for="default-latest-config">{messages.useDefaultLatestConfig}</label>
      </div>
      <div class="radio-option">
        <input 
          type="radio" 
          id="github-config" 
          bind:group={configType} 
          value="github"
          on:change={handleConfigTypeChange}
        >
        <label for="github-config">{messages.useGithubConfig}</label>
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
        {messages.load}
      </button>
    </div>
    <div class="status-container">
      <span class={configStatusClass}>{configStatus}</span>
    </div>
  </section>
  
  <section class="section">
    <h2>{messages.supportedServices}</h2>
    {#if servicesLoading}
      <div class="loading-indicator">{messages.loading}</div>
    {:else if Object.keys(services).length === 0}
      <p>{messages.noServices}</p>
    {:else}
      <div class="services-list">
        {#each Object.entries(services) as [domain, service]}
          <div class="service-item">
            <div class="service-info">
              <div class="service-name">{service.name}</div>
              <div class="service-domain">{domain}</div>
              <div class="service-selectors">{messages.selector ? browser.i18n.getMessage('ui_selector', [service.selectors.join(', ')]) : `Selector: ${service.selectors.join(', ')}`}</div>
            </div>
            <label class="toggle">
              <input 
                type="checkbox" 
                checked={service.enabled ?? true}
                on:change={(e) => updateDomainStatus(domain, e.currentTarget.checked)}
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
    <button class="btn secondary" on:click={resetSettings}>{messages.resetToDefaults}</button>
  </div>
</div>
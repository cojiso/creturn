<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    resetToDefaults, 
    loadConfig, 
    loadLocalConfig, 
    loadRemoteCustomConfig,
    CONFIG_SOURCES 
  } from '~/lib/config';

  // State variables
  let currentSettings: any = {
    configUrl: "https://raw.githubusercontent.com/cojiso/creturn/main/creturn-config.json",
    services: {}
  };
  
  let configType = 'default-latest';
  let configUrl = '';
  let configStatus = '';
  let configStatusClass = '';
  let saveStatus = '';
  let saveStatusClass = '';
  let servicesLoading = true;
  let services: any = {};

  // I18n messages
  let extensionName = '';
  let options = '';
  let messages: any = {};

  const BASE_URL = "https://raw.githubusercontent.com/";
  const DEFAULT_LATEST_PATH = "cojiso/creturn/main/creturn-config.json";

  /**
   * Initialize internationalization
   */
  function initializeI18n() {
    extensionName = chrome.i18n.getMessage('extensionName');
    options = chrome.i18n.getMessage('options');
    
    // Initialize all i18n messages
    messages = {
      configFile: chrome.i18n.getMessage('configFile'),
      useDefaultConfig: chrome.i18n.getMessage('useDefaultConfig'),
      useDefaultLatestConfig: chrome.i18n.getMessage('useDefaultLatestConfig'),
      useGithubConfig: chrome.i18n.getMessage('useGithubConfig'),
      load: chrome.i18n.getMessage('load'),
      supportedServices: chrome.i18n.getMessage('supportedServices'),
      loading: chrome.i18n.getMessage('loading'),
      resetToDefaults: chrome.i18n.getMessage('resetToDefaults'),
      noServices: chrome.i18n.getMessage('noServices'),
      selector: chrome.i18n.getMessage('selector'),
      settingsSaved: chrome.i18n.getMessage('settingsSaved'),
      confirmReset: chrome.i18n.getMessage('confirmReset'),
      settingsResetSuccess: chrome.i18n.getMessage('settingsResetSuccess'),
      settingsResetError: chrome.i18n.getMessage('settingsResetError'),
      enterUrl: chrome.i18n.getMessage('enterUrl'),
      loadingSettings: chrome.i18n.getMessage('loadingSettings'),
      settingsLoaded: chrome.i18n.getMessage('settingsLoaded'),
      loadingError: chrome.i18n.getMessage('loadingError'),
      defaultSettingsApplied: chrome.i18n.getMessage('defaultSettingsApplied'),
      clickToLoad: chrome.i18n.getMessage('clickToLoad'),
      unsavedChanges: chrome.i18n.getMessage('unsavedChanges')
    };
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
    chrome.storage.sync.get(null, (data) => {
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
      displayServices(currentSettings.services || {});
    });
  }

  /**
   * サービスのリストを表示
   */
  function displayServices(servicesData: any) {
    servicesLoading = false;
    services = servicesData;
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
    chrome.storage.sync.set(currentSettings, () => {
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
    
    configStatus = messages.loadingSettings;
    configStatusClass = 'status';
    
    // GitHub URLを構築
    const fullUrl = BASE_URL + urlPath;
    
    try {
      const newServices = await loadRemoteCustomConfig(fullUrl);
      
      if (!newServices) {
        throw new Error('Failed to retrieve configuration file');
      }
      
      // 既存のサービスからenabledフラグを引き継ぐ
      if (currentSettings.services) {
        Object.entries(newServices).forEach(([domain, service]) => {
          if (currentSettings.services[domain]) {
            (service as any).enabled = currentSettings.services[domain].enabled;
          } else {
            (service as any).enabled = true;
          }
        });
      }
      
      currentSettings.services = newServices;
      currentSettings.configUrl = fullUrl;
      
      // Chrome Storageに保存してからUI を更新
      chrome.storage.sync.set(currentSettings, () => {
        displayServices(currentSettings.services);
        
        configStatus = messages.settingsLoaded;
        configStatusClass = 'status success';
        
        saveStatus = '';
        saveStatusClass = 'status';
      });
      
    } catch (error: any) {
      console.error('Configuration file loading error:', error);
      configStatus = messages.loadingError.replace('{0}', error.message);
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
        const servicesData = await loadLocalConfig();
        
        // 既存のサービスからenabledフラグを引き継ぐ
        if (currentSettings.services) {
          Object.entries(servicesData).forEach(([domain, service]) => {
            if (currentSettings.services[domain]) {
              (service as any).enabled = currentSettings.services[domain].enabled;
            }
          });
        }
        currentSettings.services = servicesData;
        currentSettings.configUrl = "";
          
        // Chrome Storageに即時保存
        chrome.storage.sync.set(currentSettings, () => {
          displayServices(currentSettings.services);
          saveStatus = messages.defaultSettingsApplied;
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
      
      chrome.storage.sync.set(currentSettings, () => {
        saveStatus = messages.clickToLoad;
        saveStatusClass = 'status warning';
      });
    } else if (configType === 'github') {
      // default-latestのURLが設定されている場合はクリア
      if (currentSettings.configUrl === BASE_URL + DEFAULT_LATEST_PATH) {
        configUrl = "";
        currentSettings.configUrl = "";
      }
      
      saveStatus = messages.clickToLoad;
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

  onMount(() => {
    initializeI18n();
    loadSettings();
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
        placeholder="user/repo/raw/main/creturn-config.json"
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
              <div class="service-selectors">{messages.selector ? messages.selector.replace('{0}', service.selectors.join(', ')) : `Selector: ${service.selectors.join(', ')}`}</div>
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
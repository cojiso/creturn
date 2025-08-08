import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    default_locale: 'en',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['https://raw.githubusercontent.com/*'],
    icons: {
      128: 'assets/icon.png'
    },
    action: {
      default_icon: 'assets/icon_disabled.png'
    },
    web_accessible_resources: [
      {
        resources: ['assets/*'],
        matches: ['<all_urls>']
      }
    ]
  },
  vite: () => ({
    build: {
      sourcemap: true
    }
  })
});
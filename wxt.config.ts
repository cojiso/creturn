import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-svelte', '@wxt-dev/i18n/module'],
  manifest: {
    name: '__MSG_metadata_storeName__',
    description: '__MSG_metadata_description__',
    default_locale: 'en',
    permissions: ['storage', 'activeTab', 'webNavigation'],
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
    plugins: [tailwindcss()],
    build: {
      sourcemap: true
    }
  })
});

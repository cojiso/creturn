/**
 * cReturn - ストレージ管理モジュール
 * wxt/storage を使用した型安全なストレージアクセス
 */

import { storage } from 'wxt/storage';
import type { SiteConfig } from './types';

/** デフォルトの設定URL */
export const DEFAULT_CONFIG_URL = 'https://raw.githubusercontent.com/cojiso/creturn/main/public/creturn-config.jsonc';

/** 設定ファイルのURL */
export const configUrl = storage.defineItem<string>('sync:configUrl', {
  fallback: DEFAULT_CONFIG_URL
});

/** サイト設定 */
export const sites = storage.defineItem<Record<string, SiteConfig>>('sync:sites', {
  fallback: {}
});

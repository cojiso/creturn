/**
 * cReturn - アイコン管理モジュール
 * 拡張機能のアイコン状態を管理するモジュール
 */

import { browser } from 'wxt/browser';
import { findMatchingSite } from './utils';
import { sites as sitesStorage } from './storage';

export const IconManager = {
  /**
   * ドメインのアイコンを更新する
   * @param {string} domain - 対象ドメイン
   * @param {number} tabId - タブID
   */
  async updateIcon(domain: string, tabId: number) {
    if (!domain || !tabId) return;

    const sites = await sitesStorage.getValue();

    // 現在のドメインに対応するサイト設定を見つける（ワイルドカード対応）
    const matchingSite = findMatchingSite(domain, sites);

    // 有効状態を確認（設定がなければデフォルトでdisabled）
    const isEnabled = matchingSite?.enabled === true;
    
    // アイコンを設定（chrome.runtime.getURLを使用して絶対パスを取得）
    const iconPath = isEnabled 
      ? '/assets/icon.png' 
      : '/assets/icon_disabled.png';

    try {
      browser.action.setIcon({ 
        path: iconPath,
        tabId: tabId 
      });
    } catch (error) {
      console.error('Failed to set icon:', error);
    }
  }
};
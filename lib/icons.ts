/**
 * cReturn - アイコン管理モジュール
 * 拡張機能のアイコン状態を管理するモジュール
 */

import { browser } from 'wxt/browser';
import { findMatchingService } from './utils';

export const IconManager = {
  /**
   * ドメインのアイコンを更新する
   * @param {string} domain - 対象ドメイン
   * @param {number} tabId - タブID
   */
  async updateIcon(domain: string, tabId: number) {
    if (!domain || !tabId) return;
    
    // ストレージから設定を取得
    const { services = {} } = await browser.storage.sync.get('services');
    
    // 現在のドメインに対応するサービス設定を見つける（ワイルドカード対応）
    const matchingService = findMatchingService(domain, services);
    
    // 有効状態を確認（設定がなければデフォルトでdisabled）
    const isEnabled = matchingService?.enabled === true;
    
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
      console.error('アイコン更新エラー:', error);
    }
  }
};
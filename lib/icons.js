/**
 * cReturn - アイコン管理モジュール
 * 拡張機能のアイコン状態を管理するモジュール
 */

import { findMatchingService } from './utils.js';

export const IconManager = {
  /**
   * ドメインのアイコンを更新する
   * @param {string} domain - 対象ドメイン
   * @param {number} tabId - タブID
   */
  async updateIcon(domain, tabId) {
    if (!domain || !tabId) return;
    
    // ストレージから設定を取得
    const { services = {} } = await chrome.storage.sync.get('services');
    
    // 現在のドメインに対応するサービス設定を見つける（ワイルドカード対応）
    const matchingService = findMatchingService(domain, services);
    
    // 有効状態を確認（設定がなければデフォルトでdisabled）
    const isEnabled = matchingService?.enabled === true;
    
    // アイコンを設定（chrome.runtime.getURLを使用して絶対パスを取得）
    const iconPath = isEnabled 
      ? chrome.runtime.getURL('assets/icon.png') 
      : chrome.runtime.getURL('assets/icon_disabled.png');

    try {
      console.log(`アイコン更新: ${domain} ${isEnabled}`);
      console.log(`アイコンパス: ${iconPath}`);
      
      chrome.action.setIcon({ 
        path: iconPath,
        tabId: tabId 
      });
    } catch (error) {
      console.error('アイコン更新エラー:', error);
    }
  }
};

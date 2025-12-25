/**
 * cReturn - コンテンツスクリプト
 * テキストエリアの検出、IME状態の監視、キーボードイベント処理を担当
 */

import { browser } from 'wxt/browser';
import type { ServiceConfig } from '~/lib/types';

// ローカル型定義
interface CustomKeyboardEvent extends KeyboardEvent {
  fromCReturn?: boolean;
}

// DocumentとEventTargetの型拡張
declare global {
  interface Document {
    cReturnListenerInitialized?: boolean;
  }
}

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  allFrames: true,
  runAt: 'document_start',
  main() {
    /**
     * ドメインマッチング（ワイルドカード対応）
     * @param {string} currentDomain - 現在のドメイン
     * @param {Object} services - サービス設定オブジェクト
     * @returns {Object|null} - マッチしたサービス設定、またはnull
     */
    function findMatchingService(currentDomain: string, services: Record<string, ServiceConfig>): ServiceConfig | null {
      if (!services || !currentDomain) return null;
      
      // 完全一致を優先
      if (services[currentDomain]) {
        return services[currentDomain];
      }
      
      // ワイルドカードマッチング
      for (const [domain, service] of Object.entries(services)) {
        if (domain.startsWith('*.')) {
          const baseDomain = domain.substring(2); // "*.example.com" -> "example.com"
          if (currentDomain.endsWith('.' + baseDomain) || currentDomain === baseDomain) {
            return service;
          }
        }
      }
      
      return null;
    }

    // 現在の状態を保持するオブジェクト
    const state = {
      enabled: false,
      currentDomain: window.location.hostname,
      currentUrl: window.location.href,
      serviceConfig: null as ServiceConfig | null,      // 現在のドメインに対応する設定
      targetElements: [] as Element[],       // 監視対象の要素のリスト
    };

    /**
     * 設定を読み込む
     */
    async function loadSettings() {
      const data = await browser.storage.sync.get(null);
      // 現在のドメインに対応するサービス設定を見つける（ワイルドカード対応）
      state.serviceConfig = findMatchingService(state.currentDomain, data.services as Record<string, ServiceConfig>);
      if (!state.serviceConfig?.selectors) return;

      state.enabled = state.serviceConfig?.enabled ?? false;
      if (!state.enabled) {
        document.removeEventListener('keydown', handleKeyDown, { capture: true });
        document.cReturnListenerInitialized = false;
        return;
      }

      if (!document.cReturnListenerInitialized) {
        document.addEventListener('keydown', handleKeyDown, { capture: true });
        document.cReturnListenerInitialized = true;
      }
    }

    /**
     * キーダウンイベントを処理
     */
    function handleKeyDown(event: KeyboardEvent) {
      // 0. Enterキーでない場合は即座にリターン
      if (event.key !== 'Enter') return;

      // 1. 自分で発火させたイベントの場合は無視
      if ((event as CustomKeyboardEvent).fromCReturn) return;

      // 2. IME入力中は変換確定のためにEnterを保護する、送信処理を阻止
      if (event.isComposing) {
        event.stopImmediatePropagation();
        return;
      }

      // 3. メタデータフラグのチェック
      if (!state.enabled || !event.isTrusted) return;

      // 4. serviceConfigがない場合は処理しない
      if (!state.serviceConfig) return;

      // 5. event.targetがElementかどうかをチェック
      if (!event.target || !(event.target instanceof Element)) return;
      const target = event.target;

      // 6. 対象elementかどうかをチェック
      if (!state.targetElements.includes(target)) {
        let matched = false;
        for (const selector of state.serviceConfig.selectors) {
          try {
            if (target.matches?.(selector) || target.closest?.(selector)) {
              // 次回のために、見つかった要素をリストに追加
              state.targetElements.push(target);
              matched = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        if (!matched) return;
      }

      // デバッグ用: どのセレクタがマッチしたかを確認（重い処理なのでログが必要な時だけ有効に）
      // if (state.serviceConfig.selectors) {
      //   const matchingSelectors = state.serviceConfig.selectors.filter((selector: string) => {
      //     try {
      //       return Array.from(document.querySelectorAll(selector)).includes(target);
      //     } catch (e) {
      //       return false;
      //     }
      //   });

      //   if (matchingSelectors.length > 0) {
      //     console.log(`cReturn: 要素がマッチしたセレクタ:`, matchingSelectors);
      //   }
      // }

      // 7. 単独のEnterキー押下時の処理
      const isOnlyEnter = (!event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey);
      if (isOnlyEnter) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (target instanceof HTMLTextAreaElement) {
          target.setRangeText('\n', target.selectionStart, target.selectionEnd, 'end');
          target.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (target.hasAttribute?.('data-slate-editor')) {
          // Slate Editor の場合は beforeinput イベントを発火
          const beforeInputEvent = new InputEvent('beforeinput', {
            inputType: 'insertLineBreak',
            bubbles: true,
            cancelable: true,
          });
          target.dispatchEvent(beforeInputEvent);
        } else {
          // div の contenteditable など他の要素の場合は shift+Enter を発火
          const shiftEnterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            keyCode: 13,
            shiftKey: true,
            bubbles: true,
            cancelable: true,
          }) as CustomKeyboardEvent;
          shiftEnterEvent.fromCReturn = true;
          target.dispatchEvent(shiftEnterEvent);
        }
        return;
      }

      // 8. 送信キーの組み合わせが押された場合
      const isModifierEnter = (event.ctrlKey || event.metaKey);
      if (isModifierEnter) {
        event.preventDefault();
        event.stopPropagation();
        const newEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          keyCode: 13,
          bubbles: true,
          cancelable: true,
        }) as CustomKeyboardEvent;
        newEvent.fromCReturn = true;
        target.dispatchEvent(newEvent);
      }
    }

    // chrome storage の変更を監視
    browser.storage.onChanged.addListener((_, namespace) => {
      if (namespace === 'sync') {
        loadSettings();
      }
    });

    // init
    loadSettings();
  }
});

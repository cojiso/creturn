/**
 * cReturn - コンテンツスクリプト
 * テキストエリアの検出、IME状態の監視、キーボードイベント処理を担当
 */

// 現在の状態を保持するオブジェクト
const state = {
  enabled: false,
  currentDomain: window.location.hostname,
  currentUrl: window.location.href,
  serviceConfig: null,      // 現在のドメインに対応するサービス設定
  targetElements: [],       // 監視対象の要素のリスト
};

/**
 * 設定を読み込む
 */
function loadSettings() {
  chrome.storage.sync.get(null, (data) => {
    // 現在のドメインに対応するサービス設定を見つける
    state.serviceConfig = data.services?.[state.currentDomain];
    if (!state.serviceConfig?.selectors) return;
    
    state.enabled = state.serviceConfig?.enabled;
    if (!state.enabled) {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.cReturnListenerInitialized = false;
      return;
    }
    
    if (!document.cReturnListenerInitialized) {
      document.addEventListener('keydown', handleKeyDown, { capture: true });
      document.cReturnListenerInitialized = true;
    }
    // // console.log('cReturn: 設定を読み込みました', state);
  });
}

/**
 * キーダウンイベントを処理
 */
function handleKeyDown(event) {
  // 0. Enterキーでない場合は即座にリターン
  if (event.key !== 'Enter') return;
  // console.log('cReturn: pass 0');

  // 1. 自分で発火させたイベントの場合は無視
  if (event.fromCReturn) return;
  // console.log('cReturn: pass 1');

  // 2. IME入力中はブラウザに任せる
  if (event.isComposing) return;
  // console.log('cReturn: pass 2');

  // 3. メタデータフラグのチェック
  if (!state.enabled || !event.isTrusted) return;
  // console.log('cReturn: pass 3');

  // 4. serviceConfigがない場合は処理しない
  if (!state.serviceConfig) return;
  // console.log('cReturn: pass 4');
  
  // 5. 対象elementかどうかをチェック
  let isTargetElement = state.targetElements.includes(event.target);
  if (!isTargetElement) {
    for (const selector of state.serviceConfig.selectors) {
      try {
        if (event.target.matches(selector) || event.target.closest(selector)) {
          // 次回のために、見つかった要素をリストに追加
          if (!state.targetElements.includes(event.target)) {
            state.targetElements.push(event.target);
          }
          isTargetElement = true;
          break;
        }
      } catch (e) { 
        continue; 
      }
    }
  };
  if (!isTargetElement) return;
  // console.log('cReturn: pass 5');

  // デバッグ用: どのセレクタがマッチしたかを確認（重い処理なのでログが必要な時だけ有効に）
  // if (state.serviceConfig.selectors && console.debug) {
  //   const matchingSelectors = state.serviceConfig.selectors.filter(selector => {
  //     try {
  //       return Array.from(document.querySelectorAll(selector)).includes(event.target);
  //     } catch (e) {
  //       return false;
  //     }
  //   });
    
  //   if (matchingSelectors.length > 0) {
  //     // console.log(`cReturn: 要素がマッチしたセレクタ:`, matchingSelectors);
  //   }
  // }

  // 6. 単独のEnterキー押下時の処理
  const isOnlyEnter = (!event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey);
  if (isOnlyEnter) {
    event.preventDefault();
    // event.stopPropagation();
    event.stopImmediatePropagation();

    if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') {
      // console.log('cReturn: pass 6.1');
      // リアクティブUIのための処理
      const start = event.target.selectionStart;
      const end = event.target.selectionEnd;
      const value = event.target.value;
      const newValue = value.substring(0, start) + '\n' + value.substring(end);
      event.target.value = newValue;
      event.target.selectionStart = event.target.selectionEnd = start + 1;
      event.target.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // console.log('cReturn: pass 6.2');
      // contentEditableなど他の要素の場合はshift+Enterを発火
      const shiftEnterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        // code: "Enter",
        keyCode: 13,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
        // composed: true
      });
      shiftEnterEvent.fromCReturn = true;
      event.target.dispatchEvent(shiftEnterEvent);
    }
    // console.log('cReturn: pass 6.3');
    return;
  } 
  // console.log('cReturn: pass 6.0');
  
  // 7. 送信キーの組み合わせが押された場合
  const isModifierEnter = (event.ctrlKey || event.metaKey);
  if (isModifierEnter) {
    event.preventDefault();
    event.stopPropagation();
    
    const newEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      // code: "Enter",
      keyCode: 13,
      bubbles: true,
      cancelable: true,
      // composed: true
    });
    newEvent.fromCReturn = true;
    event.target.dispatchEvent(newEvent);
  }
  // console.log('cReturn: pass 7');
}

// chrome storage の変更を監視
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    loadSettings();
  }
});

// init
loadSettings();
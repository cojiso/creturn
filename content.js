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
    // console.log('cReturn: 設定を読み込みました', state);
  });
}

/**
 * キーダウンイベントを処理
 */
function handleKeyDown(event) {
  // 1. Enterキーでない場合は即座にリターン
  if (event.key !== 'Enter') return;

  // 2. IME入力中はブラウザに任せる
  if (event.isComposing) return;

  // 3. メタデータフラグのチェック
  if (!state.enabled || !event.isTrusted || event.fromCReturn) return;

  // 4. serviceConfigがない場合は処理しない
  if (!state.serviceConfig) return;
  
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
  //     console.log(`cReturn: 要素がマッチしたセレクタ:`, matchingSelectors);
  //   }
  // }

  // 6. 単独のEnterキー押下時の処理
  const isOnlyEnter = (!event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey);
  if (isOnlyEnter) {
    event.stopPropagation();
    event.preventDefault();
    
    // テキストエリアやcontentEditableな要素に改行を挿入する
    const element = event.target;
    
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      // テキストエリアやインプットの場合
      const start = element.selectionStart;
      const end = element.selectionEnd;
      const value = element.value;
      const newValue = value.substring(0, start) + '\n' + value.substring(end);
      // 値を更新
      element.value = newValue;
      // カーソルを適切な位置に設定
      element.selectionStart = element.selectionEnd = start + 1;
      // 変更イベント発火（リアクティブUIのため）
      element.dispatchEvent(new Event('input', { bubbles: true }));

    } else if (element.contentEditable === 'true' || element.contentEditable === 'plaintext-only') {
      // contentEditableな要素の場合
      try {
        // ドキュメント編集コマンドを使用
        document.execCommand('insertText', false, '\n');
      } catch (error) {
        console.error('cReturn: Failed to insert line break', error);
        
        // フォールバック: 選択範囲にテキストノードを挿入
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const textNode = document.createTextNode('\n');
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
    
    return;
  }
  
  // 7. 送信キーの組み合わせが押された場合
  const isModifierEnter = (event.ctrlKey || event.metaKey);
  if (isModifierEnter) {
    event.preventDefault();
    event.stopPropagation();
    
    const eventConfig = {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
      composed: true,
    };
    
    const newEvent = new KeyboardEvent('keydown', eventConfig);
    newEvent.fromCReturn = true; // 自分自身で発火させたイベントであることをマーク
    
    event.target.dispatchEvent(newEvent);
  }
}

// chrome storage の変更を監視
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    loadSettings();
  }
});

// init
loadSettings();
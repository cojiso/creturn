# wxt/storage 移行計画

## 現状のストレージ使用箇所

| ファイル | 操作 | 用途 |
|---------|------|------|
| `lib/config.ts` | `get`, `set`, `remove`, `clear` | マイグレーション、リセット |
| `lib/icons.ts` | `get` | sites 取得 |
| `entrypoints/background.ts` | `get`, `set`, `onChanged` | 初期化、変更監視 |
| `entrypoints/content.ts` | `get`, `onChanged` | sites 取得、変更監視 |
| `entrypoints/popup/App.svelte` | `get`, `set` | 設定読み書き |
| `entrypoints/options/App.svelte` | `get`, `set` | 設定読み書き |

## ストレージ構造

```typescript
// sync storage
{
  configUrl: string,  // 設定ファイルのURL
  sites: {            // サイト設定
    [domain: string]: SiteConfig
  }
}
```

## 移行計画

### Step 1: storage items 定義ファイル作成

`lib/storage.ts` を新規作成し、ストレージアイテムを定義：

```typescript
import { storage } from 'wxt/storage';
import type { SiteConfig } from './types';

export const configUrl = storage.defineItem<string>('sync:configUrl', {
  fallback: 'https://raw.githubusercontent.com/cojiso/creturn/main/public/creturn-config.jsonc'
});

export const sites = storage.defineItem<Record<string, SiteConfig>>('sync:sites', {
  fallback: {}
});
```

### Step 2: lib/config.ts の移行

- `browser.storage.sync.get/set/clear/remove` → `configUrl.getValue()`, `sites.setValue()` 等に置換
- `ensureSitesKey()` は一時的に維持（マイグレーション用）

### Step 3: lib/icons.ts の移行

- `browser.storage.sync.get('sites')` → `sites.getValue()`

### Step 4: entrypoints/background.ts の移行

- `browser.storage.sync.get/set` → storage items 使用
- `browser.storage.onChanged` → `sites.watch()` に置換

### Step 5: entrypoints/content.ts の移行

- `browser.storage.sync.get('sites')` → `sites.getValue()`
- `browser.storage.onChanged` → `sites.watch()` に置換

### Step 6: entrypoints/popup/App.svelte の移行

- `browser.storage.sync.get/set` → storage items 使用
- Svelte リアクティブ連携の検討

### Step 7: entrypoints/options/App.svelte の移行

- `browser.storage.sync.get/set` → storage items 使用
- コールバック形式の整理

## 移行のポイント

1. **段階的移行**: 一度に全部変えず、ファイルごとに移行してテスト
2. **型安全性**: `defineItem<T>` で型を明示
3. **fallback**: デフォルト値を定義して `null` チェック削減
4. **watch()**: `onChanged` リスナーを簡潔に

## 期待される改善

- 型安全なストレージアクセス
- `onChanged` リスナーの簡略化
- コールバック/async 混在の解消
- 将来の拡張性向上

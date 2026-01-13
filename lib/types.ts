/**
 * cReturn - 共通型定義
 */

/**
 * サイトごとの設定（ドメイン単位で管理）
 */
export interface SiteConfig {
  name: string;
  enabled?: boolean;
  selectors: string[];
}

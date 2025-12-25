/**
 * cReturn - 共通型定義
 */

/**
 * サービスごとの設定（ドメイン単位で管理）
 */
export interface ServiceConfig {
  name: string;
  enabled?: boolean;
  selectors: string[];
}

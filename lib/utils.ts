/**
 * cReturn - ユーティリティ関数
 * 共通的に使用される関数を提供
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * ドメインマッチング（ワイルドカード対応）
 * @param {string} currentDomain - 現在のドメイン
 * @param {Object} sites - サイト設定オブジェクト
 * @returns {Object|null} - マッチしたサイト設定、またはnull
 */
export function findMatchingSite(currentDomain: string, sites: any): any {
  if (!sites || !currentDomain) return null;

  // 完全一致を優先
  if (sites[currentDomain]) {
    return sites[currentDomain];
  }

  // ワイルドカードマッチング
  for (const [domain, site] of Object.entries(sites)) {
    if (domain.startsWith('*.')) {
      const baseDomain = domain.substring(2); // "*.example.com" -> "example.com"
      if (currentDomain.endsWith('.' + baseDomain) || currentDomain === baseDomain) {
        return site;
      }
    }
  }

  return null;
}
/**
 * cReturn - ユーティリティ関数
 * 共通的に使用される関数を提供
 */

/**
 * ドメインマッチング（ワイルドカード対応）
 * @param {string} currentDomain - 現在のドメイン
 * @param {Object} services - サービス設定オブジェクト
 * @returns {Object|null} - マッチしたサービス設定、またはnull
 */
export function findMatchingService(currentDomain: string, services: any): any {
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
const searchCrawlerPattern = /\b(?:googlebot|google-inspectiontool|bingbot|duckduckbot|yandexbot|baiduspider|applebot|facebookexternalhit|twitterbot|linkedinbot|pagespeed|lighthouse)\b/i

export function isSearchCrawler() {
  return typeof navigator !== 'undefined' && searchCrawlerPattern.test(String(navigator.userAgent || ''))
}

export function isAutomatedAnalyticsClient() {
  return typeof navigator !== 'undefined' && (navigator.webdriver || isSearchCrawler())
}

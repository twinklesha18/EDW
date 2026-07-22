import { getResolvedSiteSettings } from '../services/siteSettingsService.js'

export async function getBankTransferConfig() {
  const { bank } = await getResolvedSiteSettings()
  const available = Boolean(bank.bankName && bank.accountName && bank.accountNumber && bank.branch)
  return Object.freeze({ available, ...bank })
}

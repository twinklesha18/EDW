export const SRI_LANKA_PROVINCES = Object.freeze({
  Western: Object.freeze(['Colombo', 'Gampaha', 'Kalutara']),
  Central: Object.freeze(['Kandy', 'Matale', 'Nuwara Eliya']),
  Southern: Object.freeze(['Galle', 'Matara', 'Hambantota']),
  Northern: Object.freeze(['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya']),
  Eastern: Object.freeze(['Trincomalee', 'Batticaloa', 'Ampara']),
  'North Western': Object.freeze(['Kurunegala', 'Puttalam']),
  'North Central': Object.freeze(['Anuradhapura', 'Polonnaruwa']),
  Uva: Object.freeze(['Badulla', 'Monaragala']),
  Sabaragamuwa: Object.freeze(['Ratnapura', 'Kegalle']),
})

export const SRI_LANKA_PROVINCE_NAMES = Object.freeze(Object.keys(SRI_LANKA_PROVINCES))

export const normalizeSriLankaProvince = (value) => {
  const candidate = String(value || '').trim().replace(/\s+province$/i, '')
  return SRI_LANKA_PROVINCE_NAMES.find((province) => province.toLowerCase() === candidate.toLowerCase()) || ''
}

export const normalizeSriLankaDistrict = (value) => {
  const candidate = String(value || '').trim().replace(/\s+district$/i, '')
  return Object.values(SRI_LANKA_PROVINCES).flat().find((district) => district.toLowerCase() === candidate.toLowerCase()) || ''
}

export const districtsForProvince = (province) => SRI_LANKA_PROVINCES[province] || []

export const isSriLankanProvinceDistrict = (province, district) => districtsForProvince(province).includes(district)

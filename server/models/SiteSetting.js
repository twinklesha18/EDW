import mongoose from 'mongoose'
import { EMAIL_VALIDATION_MESSAGE, PHONE_VALIDATION_MESSAGE, isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '../utils/inputValidation.js'

const imageSchema = new mongoose.Schema({
  url: { type: String, trim: true, maxlength: 800, default: '' },
  publicId: { type: String, trim: true, maxlength: 300, default: '' },
  width: { type: Number, min: 0, default: 0 },
  height: { type: Number, min: 0, default: 0 },
  bytes: { type: Number, min: 0, default: 0 },
  storage: { type: String, enum: ['local', 'cloudinary', ''], default: '' },
}, { _id: false })

const siteSettingSchema = new mongoose.Schema({
  key: { type: String, unique: true, immutable: true, default: 'store', enum: ['store'] },
  business: {
    name: { type: String, trim: true, minlength: 2, maxlength: 120, required: true },
    tagline: { type: String, trim: true, maxlength: 180, default: '' },
    logo: { type: imageSchema, default: () => ({}) },
  },
  contact: {
    phone: { type: String, trim: true, maxlength: 10, required: true, set: normalizePhone, validate: [isValidPhone, PHONE_VALIDATION_MESSAGE] },
    whatsapp: { type: String, trim: true, maxlength: 10, required: true, set: normalizePhone, validate: [isValidPhone, PHONE_VALIDATION_MESSAGE] },
    email: { type: String, trim: true, lowercase: true, maxlength: 160, required: true, set: normalizeEmail, validate: [isValidEmail, EMAIL_VALIDATION_MESSAGE] },
    location: { type: String, trim: true, maxlength: 180, default: '' },
    mapsHref: { type: String, trim: true, maxlength: 1200, default: '' },
    mapEmbedUrl: { type: String, trim: true, maxlength: 2500, default: '' },
    instagram: { type: String, trim: true, maxlength: 1200, default: 'https://www.instagram.com/eshazdreamworld?igsh=MXJ4Znd4N2dmNXBreg==' },
    facebook: { type: String, trim: true, maxlength: 1200, default: 'https://www.facebook.com/share/1GtwA5K8LB/' },
    tiktok: { type: String, trim: true, maxlength: 1200, default: 'https://www.tiktok.com/@eshazdreamworld?_r=1&_t=ZS-98EqzO3FHWC' },
  },
  bank: {
    bankName: { type: String, trim: true, maxlength: 160, default: '' },
    accountName: { type: String, trim: true, maxlength: 160, default: '' },
    accountNumber: { type: String, trim: true, maxlength: 80, default: '' },
    branch: { type: String, trim: true, maxlength: 160, default: '' },
    branchCode: { type: String, trim: true, maxlength: 40, default: '' },
    instructions: { type: String, trim: true, maxlength: 600, default: '' },
  },
  shipping: {
    standardFee: { type: Number, min: 0, required: true },
    expressFee: { type: Number, min: 0, required: true },
    pickupFee: { type: Number, min: 0, required: true },
    standardDays: { type: Number, min: 1, max: 30, required: true },
    expressDays: { type: Number, min: 1, max: 30, required: true },
    pickupDays: { type: Number, min: 1, max: 30, required: true },
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

export default mongoose.model('SiteSetting', siteSettingSchema)

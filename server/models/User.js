import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 40 },
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    addressLine1: { type: String, required: true, trim: true, maxlength: 150 },
    addressLine2: { type: String, trim: true, maxlength: 150, default: '' },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    district: { type: String, required: true, trim: true, maxlength: 80 },
    province: { type: String, required: true, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 20, default: '' },
    country: { type: String, required: true, trim: true, maxlength: 80, default: 'Sri Lanka' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
)

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    password: { type: String, required: true, minlength: 8, maxlength: 72, select: false },
    avatar: { type: String, trim: true, maxlength: 500, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    addresses: { type: [addressSchema], default: [] },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_document, result) => { delete result.password; delete result.resetPasswordToken; delete result.resetPasswordExpire; return result } },
    toObject: { virtuals: true },
  },
)

userSchema.virtual('fullName').get(function getFullName() {
  return `${this.firstName} ${this.lastName}`.trim()
})

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model('User', userSchema)
export default User

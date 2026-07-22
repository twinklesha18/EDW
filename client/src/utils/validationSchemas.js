import * as yup from 'yup'
import { EMAIL_ERROR, PHONE_ERROR, isValidEmailAddress, normalizeEmailInput, normalizePhoneInput } from './inputValidation.js'

const password = yup.string().required('Password is required.').min(8, 'Use at least 8 characters.').max(72, 'Password is too long.').matches(/[a-z]/, 'Add a lowercase letter.').matches(/[A-Z]/, 'Add an uppercase letter.').matches(/\d/, 'Add a number.')
const email = yup.string().transform(normalizeEmailInput).required('Email is required.').test('valid-email', EMAIL_ERROR, (value) => !value || isValidEmailAddress(value))
const phone = yup.string().transform(normalizePhoneInput).required('Phone number is required.').matches(/^0\d{9}$/, PHONE_ERROR)

export const loginSchema = yup.object({
  email,
  password: yup.string().required('Password is required.'),
  rememberMe: yup.boolean(),
})

export const registerSchema = yup.object({
  firstName: yup.string().trim().min(2, 'Enter at least 2 characters.').max(60).required('First name is required.'),
  lastName: yup.string().trim().min(2, 'Enter at least 2 characters.').max(60).required('Last name is required.'),
  email,
  phone,
  password,
  confirmPassword: yup.string().required('Confirm your password.').oneOf([yup.ref('password')], 'Passwords do not match.'),
  terms: yup.boolean().oneOf([true], 'You must accept the terms.'),
})

export const forgotPasswordSchema = yup.object({ email })
export const resetPasswordSchema = yup.object({ password, confirmPassword: yup.string().required('Confirm your password.').oneOf([yup.ref('password')], 'Passwords do not match.') })

export const profileSchema = yup.object({
  firstName: yup.string().trim().min(2).max(60).required('First name is required.'),
  lastName: yup.string().trim().min(2).max(60).required('Last name is required.'),
  phone,
})

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required.'),
  newPassword: password.notOneOf([yup.ref('currentPassword')], 'New password must be different.'),
  confirmNewPassword: yup.string().required('Confirm your new password.').oneOf([yup.ref('newPassword')], 'Passwords do not match.'),
})

export const addressSchema = yup.object({
  label: yup.string().trim().min(2).max(40).required('Label is required.'),
  fullName: yup.string().trim().min(2).max(120).required('Full name is required.'),
  phone,
  addressLine1: yup.string().trim().min(3).max(150).required('Address line 1 is required.'),
  addressLine2: yup.string().trim().max(150),
  city: yup.string().trim().min(2).max(80).required('City is required.'),
  district: yup.string().trim().min(2).max(80).required('District is required.'),
  province: yup.string().trim().min(2).max(80).required('Province is required.'),
  postalCode: yup.string().trim().max(20),
  country: yup.string().trim().max(80).required('Country is required.'),
  isDefault: yup.boolean(),
})

const adminUserBase = {
  firstName: yup.string().trim().min(2, 'Enter at least 2 characters.').max(60, 'First name is too long.').required('First name is required.'),
  lastName: yup.string().trim().min(2, 'Enter at least 2 characters.').max(60, 'Last name is too long.').required('Last name is required.'),
  email,
  phone,
  role: yup.string().oneOf(['user', 'admin'], 'Select User or Admin.').required('Role is required.'),
  isActive: yup.boolean().required(),
}

export const adminUserCreateSchema = yup.object({
  ...adminUserBase,
  password,
  confirmPassword: yup.string().required('Confirm the password.').oneOf([yup.ref('password')], 'Passwords do not match.'),
})

export const adminUserUpdateSchema = yup.object(adminUserBase)

export const adminUserPasswordSchema = yup.object({
  password,
  confirmPassword: yup.string().required('Confirm the password.').oneOf([yup.ref('password')], 'Passwords do not match.'),
})

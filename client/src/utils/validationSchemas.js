import * as yup from 'yup'

const password = yup.string().required('Password is required.').min(8, 'Use at least 8 characters.').max(72, 'Password is too long.').matches(/[a-z]/, 'Add a lowercase letter.').matches(/[A-Z]/, 'Add an uppercase letter.').matches(/\d/, 'Add a number.')
const phone = yup.string().trim().required('Phone number is required.').matches(/^(?:\+94|0)7\d{8}$/, 'Enter a valid Sri Lankan mobile number.')

export const loginSchema = yup.object({
  email: yup.string().trim().email('Enter a valid email address.').required('Email is required.'),
  password: yup.string().required('Password is required.'),
  rememberMe: yup.boolean(),
})

export const registerSchema = yup.object({
  firstName: yup.string().trim().min(2, 'Enter at least 2 characters.').max(60).required('First name is required.'),
  lastName: yup.string().trim().min(2, 'Enter at least 2 characters.').max(60).required('Last name is required.'),
  email: yup.string().trim().email('Enter a valid email address.').required('Email is required.'),
  phone,
  password,
  confirmPassword: yup.string().required('Confirm your password.').oneOf([yup.ref('password')], 'Passwords do not match.'),
  terms: yup.boolean().oneOf([true], 'You must accept the terms.'),
})

export const forgotPasswordSchema = yup.object({ email: yup.string().trim().email('Enter a valid email address.').required('Email is required.') })
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

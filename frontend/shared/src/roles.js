// Mirrors MedCareAxis.Core.Enums.UserRole. Program.cs registers a global
// JsonStringEnumConverter, so the API always serializes `role` as one of these
// strings (never the numeric enum value) — string comparison is authoritative.
export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  HOSPITAL_ADMIN: 'HospitalAdmin',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  RECEPTIONIST: 'Receptionist',
  BILLING: 'Billing',
  PHARMACY: 'Pharmacy',
  LAB: 'Lab',
  RADIOLOGY: 'Radiology',
  PATIENT: 'Patient',
  MANAGER: 'Manager',
}

export const isSuperAdmin = (role) => role === ROLES.SUPER_ADMIN

export const isAdminRole = (role) =>
  role === ROLES.SUPER_ADMIN || role === ROLES.HOSPITAL_ADMIN || role === ROLES.MANAGER

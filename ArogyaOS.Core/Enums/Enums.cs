namespace ArogyaOS.Core.Enums;

// ─── Patient ───────────────────────────────────────────
public enum Gender               { Male, Female, Other, PreferNotToSay }
public enum BloodGroup           { APositive, ANegative, BPositive, BNegative,
                                   ABPositive, ABNegative, OPositive, ONegative, Unknown }
public enum MaritalStatus        { Single, Married, Divorced, Widowed, Other }
public enum PatientType          { OPD, IPD, Emergency, Daycare }
public enum InsuranceType        { None, Ayushman, CGHS, ESIC, PrivateInsurance, CorporateTPA }

// ─── Appointments & OPD ────────────────────────────────
public enum AppointmentStatus    { Scheduled, Confirmed, InProgress, Completed, Cancelled, NoShow }
public enum ConsultationType     { General, Specialist, Emergency, Telemedicine, FollowUp }
public enum PriorityLevel        { Low, Normal, High, Critical, Emergency }

// ─── IPD & Beds ────────────────────────────────────────
public enum BedStatus            { Available, Occupied, UnderMaintenance, Reserved }
public enum WardType             { General, ICU, NICU, PICU, CCU, Maternity,
                                   Surgery, Emergency, Isolation, Orthopedic,
                                   Cardiology, Neurology, Psychiatry, Oncology }
public enum DischargeType        { Regular, LAMA, Death, Transfer, Absconded }
public enum AdmissionStatus      { Active, Discharged, Transferred }

// ─── Billing & Payments ────────────────────────────────
public enum BillStatus           { Draft, Generated, PartiallyPaid, Paid, Cancelled, Refunded }
public enum PaymentMode          { Cash, Card, UPI, NEFT, RTGS, Cheque,
                                   Insurance, Ayushman, CGHS, ESIC }
public enum ServiceCategory      { Consultation, Procedure, Lab, Radiology,
                                   Pharmacy, Bed, Surgery, OT, Blood,
                                   Physiotherapy, Ambulance, Other }

// ─── Lab ───────────────────────────────────────────────
public enum LabOrderStatus       { Ordered, SampleCollected, InProcess,
                                   ResultAvailable, Reported, Cancelled }
public enum SampleType           { Blood, Urine, Stool, Sputum, Swab,
                                   CSF, Biopsy, Other }

// ─── Radiology ─────────────────────────────────────────
public enum RadiologyStatus      { Ordered, Scheduled, InProgress, Reported, Cancelled }
public enum RadiologyModality    { XRay, CT, MRI, Ultrasound, Mammography,
                                   PET, Nuclear, Fluoroscopy, Angiography }

// ─── Pharmacy ──────────────────────────────────────────
public enum PharmacyOrderStatus  { Pending, Dispensed, PartiallyDispensed,
                                   Cancelled, Returned }
public enum MedicineCategory     { Tablet, Capsule, Syrup, Injection, Drops,
                                   Ointment, Cream, Powder, Inhaler,
                                   Suppository, IV_Fluid, Vaccine, Other }
public enum StockTransactionType { Purchase, Dispensed, Returned, Expired,
                                   Damaged, Adjusted }

// ─── Staff & HR ────────────────────────────────────────
public enum EmployeeType         { Doctor, Nurse, Paramedic, Administrative,
                                   Support, Security, Lab, Pharmacy,
                                   Radiology, Housekeeping }
public enum ShiftType            { Morning, Afternoon, Night, Rotating }
public enum LeaveType            { CasualLeave, SickLeave, EarnedLeave,
                                   MaternityLeave, PaternityLeave, UnpaidLeave }
public enum LeaveStatus          { Pending, Approved, Rejected, Cancelled }
public enum EmploymentType       { Permanent, Contract, Visiting, Consultant }

// ─── OT / Operations ───────────────────────────────────
public enum OperationStatus      { Scheduled, InProgress, Completed, Postponed, Cancelled }
public enum AnesthesiaType       { General, Spinal, Epidural, Local, Regional, None }

// ─── Subscription & Tenant ─────────────────────────────
public enum SubscriptionPlan     { Trial, Starter, Growth, Enterprise, Custom }
public enum SubscriptionStatus   { Active, Expired, Suspended, Cancelled, Trial }
public enum HospitalStatus       { Pending, Active, Suspended, Deactivated }

// ─── Hospital Specialty ────────────────────────────────
public enum HospitalCategory     { General, MultiSpeciality, Dental, Eye,
                                   Maternity, Orthopedic, Pediatric, Cardiac,
                                   Oncology, ENT, Dermatology, Psychiatric,
                                   Dialysis, Trauma, Rehabilitation }

// ─── System ────────────────────────────────────────────
public enum NotificationType     { Appointment, Lab, Billing, Discharge,
                                   Emergency, Pharmacy, System, LowStock }
public enum ReferralType         { Internal, External }
public enum ReferralStatus       { Sent, Viewed, Accepted, Declined, Completed, Cancelled }
public enum ReferralUrgency      { Routine, Urgent, Emergency }
public enum AuditAction          { Create, Update, Delete, Login, Logout, Print, Export }
public enum DocumentType         { Consent, Discharge, Lab, Radiology,
                                   Prescription, Invoice, Other }
public enum UserRole             { SuperAdmin, HospitalAdmin, Doctor, Nurse,
                                   Receptionist, Billing, Pharmacy, Lab,
                                   Radiology, Patient }
                                   
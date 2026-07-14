// ============================================
// TFG HRMS - Centralized Validation Utilities
// ============================================

// ─── Regex Patterns ───────────────────────────────────────────────────────────
const PATTERNS = {
  phone: /^\d{10}$/,
  employeeId: /^[a-zA-Z0-9_-]+$/,
  dateYMD: /^\d{4}-\d{2}-\d{2}$/,
  pincode: /^\d{6}$/,
  accountNumber: /^\d{9,18}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/i,
  pan: /^[A-Z]{5}\d{4}[A-Z]$/i,
  aadhaar: /^\d{12}$/,
  uan: /^\d{12}$/,
  esic: /^\d{17}$/,
  domain: /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

const VALID_GENDERS = ["male", "female", "other"];
const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const VALID_MARITAL_STATUS = ["single", "married", "divorced", "widowed"];

// ─── Employee Creation Validation ─────────────────────────────────────────────
export function validateEmployeeCreation(form) {
  const errors = {};

  if (!form.employee_id?.trim()) errors.employee_id = "Employee ID is required";
  else if (!PATTERNS.employeeId.test(form.employee_id)) errors.employee_id = "Employee ID must be alphanumeric (underscores/hyphens allowed)";

  if (!form.first_name?.trim()) errors.first_name = "First name is required";
  if (!form.last_name?.trim()) errors.last_name = "Last name is required";

  if (!form.official_email?.trim()) errors.official_email = "Email is required";
  else if (!PATTERNS.email.test(form.official_email)) errors.official_email = "Invalid email format";

  if (!form.phone?.trim()) errors.phone = "Phone is required";
  else if (!PATTERNS.phone.test(form.phone)) errors.phone = "Phone must be exactly 10 digits";

  if (!form.gender) errors.gender = "Gender is required";
  else if (!VALID_GENDERS.includes(form.gender)) errors.gender = "Gender must be male, female, or other";

  if (!form.department?.trim()) errors.department = "Department is required";
  if (!form.designation?.trim()) errors.designation = "Designation is required";

  if (!form.joining_date) errors.joining_date = "Joining date is required";
  else if (!PATTERNS.dateYMD.test(form.joining_date)) errors.joining_date = "Joining date must be in YYYY-MM-DD format";

  const ctc = parseInt(form.ctc) || 0;
  if (!form.ctc || ctc <= 0) errors.ctc = "CTC must be greater than 0";
  else if (ctc > 99999999) errors.ctc = "CTC cannot exceed ₹9,99,99,999";

  if (form.pf_applicable && form.uan_number) {
    if (!PATTERNS.uan.test(form.uan_number)) errors.uan_number = "UAN must be exactly 12 digits";
  }

  if (form.esi_applicable && form.esic_number) {
    if (!PATTERNS.esic.test(form.esic_number)) errors.esic_number = "ESIC number must be exactly 17 digits";
  }

  return errors;
}

// ─── Onboarding Section Validations ───────────────────────────────────────────
export function validatePersonalDetails(data) {
  const errors = {};
  if (!data.date_of_birth) errors.date_of_birth = "Date of birth is required";
  else if (!PATTERNS.dateYMD.test(data.date_of_birth)) errors.date_of_birth = "Date of birth must be in YYYY-MM-DD format";

  if (!data.gender) errors.gender = "Gender is required";

  if (data.blood_group && !VALID_BLOOD_GROUPS.includes(data.blood_group)) {
    errors.blood_group = "Invalid blood group. Must be A+, A-, B+, B-, AB+, AB-, O+, or O-";
  }

  if (data.marital_status && !VALID_MARITAL_STATUS.includes(data.marital_status)) {
    errors.marital_status = "Invalid marital status. Must be single, married, divorced, or widowed";
  }

  if (!data.resume_url) errors.resume_url = "Resume URL is required";

  return errors;
}

export function validateAddress(data) {
  const errors = {};
  if (!data.current?.line1) errors["current.line1"] = "Current address street is required";
  if (!data.current?.city) errors["current.city"] = "Current city is required";
  if (!data.current?.state) errors["current.state"] = "Current state is required";
  if (!data.current?.pincode) errors["current.pincode"] = "Current pincode is required";
  else if (!PATTERNS.pincode.test(data.current.pincode)) errors["current.pincode"] = "Pincode must be exactly 6 digits";

  if (!data.permanent?.line1) errors["permanent.line1"] = "Permanent address street is required";
  if (!data.permanent?.city) errors["permanent.city"] = "Permanent city is required";
  if (!data.permanent?.state) errors["permanent.state"] = "Permanent state is required";
  if (!data.permanent?.pincode) errors["permanent.pincode"] = "Permanent pincode is required";
  else if (!PATTERNS.pincode.test(data.permanent.pincode)) errors["permanent.pincode"] = "Pincode must be exactly 6 digits";

  return errors;
}

export function validateEmergencyContact(data) {
  const errors = {};
  if (!data.name?.trim()) errors.name = "Emergency contact name is required";
  if (!data.relation?.trim()) errors.relation = "Relation is required";
  if (!data.phone?.trim()) errors.phone = "Emergency contact phone is required";
  else if (!PATTERNS.phone.test(data.phone)) errors.phone = "Emergency contact phone must be exactly 10 digits";
  return errors;
}

export function validateBankDetails(data) {
  const errors = {};
  if (!data.account_number?.trim()) errors.account_number = "Account number is required";
  else if (!PATTERNS.accountNumber.test(data.account_number)) errors.account_number = "Account number must be 9-18 digits";

  if (!data.ifsc?.trim()) errors.ifsc = "IFSC code is required";
  else if (!PATTERNS.ifsc.test(data.ifsc)) errors.ifsc = "Invalid IFSC code (format: 4 letters + 0 + 6 alphanumeric)";

  if (!data.bank_name?.trim()) errors.bank_name = "Bank name is required";
  return errors;
}

export function validateGovernmentIds(data) {
  const errors = {};
  if (!data.pan?.number?.trim()) errors["pan.number"] = "PAN number is required";
  else if (!PATTERNS.pan.test(data.pan.number)) errors["pan.number"] = "Invalid PAN (format: 5 letters + 4 digits + 1 letter)";

  if (!data.aadhaar?.number?.trim()) errors["aadhaar.number"] = "Aadhaar number is required";
  else if (!PATTERNS.aadhaar.test(data.aadhaar.number)) errors["aadhaar.number"] = "Aadhaar must be exactly 12 digits";

  return errors;
}

export function validatePolicyAcceptance(data) {
  const errors = {};
  if (!data.accepted) errors.accepted = "You must accept company policies";
  return errors;
}

// ─── Organization Creation Validation ─────────────────────────────────────────
export function validateOrganization(form) {
  const errors = {};
  if (!form.org_name?.trim()) errors.org_name = "Organization name is required";
  if (!form.email?.trim()) errors.email = "Organization email is required";
  else if (!PATTERNS.email.test(form.email)) errors.email = "Invalid email format";

  if (!form.domain?.trim()) errors.domain = "Domain is required";
  else if (!PATTERNS.domain.test(form.domain)) errors.domain = "Invalid domain format. Example: technova.com";

  if (!form.admin_name?.trim()) errors.admin_name = "Admin name is required";
  if (!form.admin_email?.trim()) errors.admin_email = "Admin email is required";
  else if (!PATTERNS.email.test(form.admin_email)) errors.admin_email = "Invalid admin email format";

  if (!form.admin_phone?.trim()) errors.admin_phone = "Admin phone is required";
  else if (!PATTERNS.phone.test(form.admin_phone.replace(/[+\s-]/g, "").slice(-10))) errors.admin_phone = "Phone must be exactly 10 digits";

  return errors;
}

// ─── Utility: Parse API Error Response ────────────────────────────────────────
// Converts FastAPI validation error response into field-level error map
export function parseApiErrors(responseData) {
  const errors = {};
  if (!responseData) return errors;

  const detail = responseData.detail;

  // FastAPI validation error (array of {loc, msg, type})
  if (Array.isArray(detail)) {
    detail.forEach(err => {
      // loc is like ["body", "phone"] or ["body", "salary_structure", "ctc"]
      const fieldPath = err.loc?.filter(l => l !== "body").join(".") || "general";
      errors[fieldPath] = err.msg;
    });
    return errors;
  }

  // String error
  if (typeof detail === "string") {
    errors._general = detail;
    return errors;
  }

  // Object with message
  if (responseData.message) errors._general = responseData.message;
  if (responseData.error) errors._general = responseData.error;

  return errors;
}

// ─── Utility: Check if errors object has any entries ──────────────────────────
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

// ─── Utility: Get first error message ─────────────────────────────────────────
export function getFirstError(errors) {
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : null;
}

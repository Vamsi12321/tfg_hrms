// ============================================
// TFG HRMS — Client-side Excel/CSV Export
// No external dependencies — uses CSV format
// that Excel opens natively
// ============================================

/**
 * Convert an array of objects to CSV string
 */
function toCSV(rows, columns) {
  if (!rows || rows.length === 0) return "";
  const headers = columns.map(c => `"${c.label}"`).join(",");
  const lines = rows.map(row =>
    columns.map(c => {
      const val = c.key.split(".").reduce((o, k) => (o ? o[k] : ""), row);
      const str = val == null ? "" : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [headers, ...lines].join("\n");
}

/**
 * Download a CSV file that Excel opens natively
 * @param {Array} rows - data rows
 * @param {Array} columns - [{ label, key }] where key supports dot notation
 * @param {string} filename - e.g. "employees_2026.csv"
 */
export function downloadCSV(rows, columns, filename = "export.csv") {
  const csv = "\uFEFF" + toCSV(rows, columns); // BOM for Excel UTF-8
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Pre-built export configs ──────────────────────────────────────────────

export const EXPORT_CONFIGS = {
  employees: [
    { label: "Employee ID",      key: "employee_id"     },
    { label: "First Name",       key: "first_name"      },
    { label: "Last Name",        key: "last_name"       },
    { label: "Email",            key: "official_email"  },
    { label: "Phone",            key: "phone"           },
    { label: "Department",       key: "department"      },
    { label: "Designation",      key: "designation"     },
    { label: "Employment Type",  key: "employment_type" },
    { label: "Joining Date",     key: "joining_date"    },
    { label: "Gender",           key: "gender"          },
    { label: "Status",           key: "status"          },
    { label: "Is Fresher",       key: "is_fresher"      },
    { label: "Work Location",    key: "work_location"   },
  ],

  leaves: [
    { label: "Employee",         key: "employee_name"   },
    { label: "Department",       key: "department"      },
    { label: "Leave Type",       key: "leave_type_name" },
    { label: "Code",             key: "leave_type_code" },
    { label: "From",             key: "start_date"      },
    { label: "To",               key: "end_date"        },
    { label: "Days",             key: "days"            },
    { label: "Half Day",         key: "is_half_day"     },
    { label: "Reason",           key: "reason"          },
    { label: "Status",           key: "status"          },
    { label: "Applied On",       key: "applied_at"      },
    { label: "Approved By",      key: "approved_by_name"},
  ],

  payslips: [
    { label: "Employee",         key: "employee_name"   },
    { label: "Employee Code",    key: "employee_code"   },
    { label: "Department",       key: "department"      },
    { label: "Month",            key: "month"           },
    { label: "Year",             key: "year"            },
    { label: "Working Days",     key: "working_days"    },
    { label: "Days Worked",      key: "days_worked"     },
    { label: "LOP Days",         key: "lop_days"        },
    { label: "Gross Pay",        key: "gross_pay"       },
    { label: "PF (Employee)",    key: "deductions.pf_employee" },
    { label: "ESI (Employee)",   key: "deductions.esi_employee"},
    { label: "Professional Tax", key: "deductions.professional_tax"},
    { label: "Total Deductions", key: "total_deductions"},
    { label: "Net Pay",          key: "net_pay"         },
    { label: "Status",           key: "status"          },
  ],

  attendance: [
    { label: "Employee",         key: "employee_name"   },
    { label: "Department",       key: "department"      },
    { label: "Date",             key: "date"            },
    { label: "Check In",         key: "check_in"        },
    { label: "Check Out",        key: "check_out"       },
    { label: "Hours",            key: "total_hours"     },
    { label: "Status",           key: "status"          },
    { label: "Is Late",          key: "is_late"         },
    { label: "Location",         key: "check_in_location.matched_office" },
  ],

  attendance_summary: [
    { label: "Employee",         key: "employee_name"   },
    { label: "Department",       key: "department"      },
    { label: "Present",          key: "present"         },
    { label: "Absent",           key: "absent"          },
    { label: "Half Days",        key: "half_days"       },
    { label: "Late",             key: "late_arrivals"   },
    { label: "Leaves",           key: "leaves"          },
    { label: "Avg Hours",        key: "avg_hours"       },
  ],

  leave_requests: [
    { label: "Employee",         key: "employee_name"   },
    { label: "Department",       key: "department"      },
    { label: "Leave Type",       key: "leave_type_name" },
    { label: "From",             key: "start_date"      },
    { label: "To",               key: "end_date"        },
    { label: "Days",             key: "days"            },
    { label: "Status",           key: "status"          },
    { label: "Applied On",       key: "applied_at"      },
  ],

  announcements: [
    { label: "Title",            key: "title"           },
    { label: "Type",             key: "type"            },
    { label: "Priority",         key: "priority"        },
    { label: "Content",          key: "content"         },
    { label: "Created By",       key: "created_by_name" },
    { label: "Created At",       key: "created_at"      },
    { label: "Target Depts",     key: "target_departments" },
    { label: "Views",            key: "read_count"      },
  ],

  documents: [
    { label: "Title",            key: "title"           },
    { label: "Category",         key: "category"        },
    { label: "Description",      key: "description"     },
    { label: "Mandatory",        key: "is_mandatory"    },
    { label: "Uploaded By",      key: "uploaded_by_name"},
    { label: "Created At",       key: "created_at"      },
  ],

  doc_requests: [
    { label: "Employee",         key: "employee_name"   },
    { label: "Document Title",   key: "title"           },
    { label: "Category",         key: "category"        },
    { label: "Due Date",         key: "due_date"        },
    { label: "Status",           key: "status"          },
  ],

  my_leaves: [
    { label: "Leave Type",       key: "leave_type_name" },
    { label: "Code",             key: "leave_type_code" },
    { label: "From",             key: "start_date"      },
    { label: "To",               key: "end_date"        },
    { label: "Days",             key: "days"            },
    { label: "Half Day",         key: "is_half_day"     },
    { label: "Status",           key: "status"          },
    { label: "Reason",           key: "reason"          },
  ],

  my_payslips: [
    { label: "Month",            key: "month"           },
    { label: "Year",             key: "year"            },
    { label: "Working Days",     key: "working_days"    },
    { label: "Days Worked",      key: "days_worked"     },
    { label: "LOP Days",         key: "lop_days"        },
    { label: "Gross Pay",        key: "gross_pay"       },
    { label: "Total Deductions", key: "total_deductions"},
    { label: "Net Pay",          key: "net_pay"         },
    { label: "Status",           key: "status"          },
  ],
};

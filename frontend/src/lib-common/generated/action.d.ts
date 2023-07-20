// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications
/* eslint-disable import/order, prettier/prettier, @typescript-eslint/no-namespace */

export namespace Action {

export type Global =
  | 'APPLICATIONS_PAGE'
  | 'CREATE_DOCUMENT_TEMPLATE'
  | 'CREATE_DRAFT_INVOICES'
  | 'CREATE_DRAFT_PAYMENTS'
  | 'CREATE_EMPLOYEE'
  | 'CREATE_FEE_THRESHOLDS'
  | 'CREATE_HOLIDAY_PERIOD'
  | 'CREATE_HOLIDAY_QUESTIONNAIRE'
  | 'CREATE_PAPER_APPLICATION'
  | 'CREATE_PERSON'
  | 'CREATE_PERSONAL_MOBILE_DEVICE_PAIRING'
  | 'CREATE_PERSON_FROM_VTJ'
  | 'CREATE_UNIT'
  | 'CREATE_VASU_TEMPLATE'
  | 'DELETE_HOLIDAY_PERIOD'
  | 'DELETE_HOLIDAY_QUESTIONNAIRE'
  | 'DOCUMENT_TEMPLATES_PAGE'
  | 'EMPLOYEES_PAGE'
  | 'FETCH_INCOME_STATEMENTS_AWAITING_HANDLER'
  | 'FINANCE_BASICS_PAGE'
  | 'FINANCE_PAGE'
  | 'GENERATE_FEE_DECISIONS'
  | 'HOLIDAY_PERIODS_PAGE'
  | 'MESSAGES_PAGE'
  | 'PERSONAL_MOBILE_DEVICE_PAGE'
  | 'PERSON_SEARCH_PAGE'
  | 'PIN_CODE_PAGE'
  | 'READ_ACTIVE_HOLIDAY_QUESTIONNAIRES'
  | 'READ_ASSISTANCE_ACTION_OPTIONS'
  | 'READ_ASSISTANCE_BASIS_OPTIONS'
  | 'READ_DECISIONS_REPORT'
  | 'READ_DECISION_UNITS'
  | 'READ_DOCUMENT_TEMPLATE'
  | 'READ_DUPLICATE_PEOPLE_REPORT'
  | 'READ_EMPLOYEES'
  | 'READ_ENDED_PLACEMENTS_REPORT'
  | 'READ_FEE_THRESHOLDS'
  | 'READ_FINANCE_DECISION_HANDLERS'
  | 'READ_HOLIDAY_PERIOD'
  | 'READ_HOLIDAY_PERIODS'
  | 'READ_HOLIDAY_QUESTIONNAIRE'
  | 'READ_HOLIDAY_QUESTIONNAIRES'
  | 'READ_INCOME_TYPES'
  | 'READ_INVOICE_CODES'
  | 'READ_INVOICE_REPORT'
  | 'READ_MANUAL_DUPLICATION_REPORT'
  | 'READ_PERSONAL_MOBILE_DEVICES'
  | 'READ_PLACEMENT_COUNT_REPORT'
  | 'READ_PLACEMENT_SKETCHING_REPORT'
  | 'READ_PRESENCE_REPORT'
  | 'READ_RAW_REPORT'
  | 'READ_SELECTABLE_FINANCE_DECISION_HANDLERS'
  | 'READ_SERVICE_NEED_OPTIONS'
  | 'READ_SERVICE_WORKER_APPLICATION_NOTES'
  | 'READ_SEXTET_REPORT'
  | 'READ_STARTING_PLACEMENTS_REPORT'
  | 'READ_UNITS'
  | 'READ_UNIT_FEATURES'
  | 'READ_VARDA_REPORT'
  | 'READ_VASU_TEMPLATE'
  | 'REPORTS_PAGE'
  | 'SEARCH_EMPLOYEES'
  | 'SEARCH_FEE_DECISIONS'
  | 'SEARCH_INVOICES'
  | 'SEARCH_PEOPLE'
  | 'SEARCH_PEOPLE_UNRESTRICTED'
  | 'SEARCH_VOUCHER_VALUE_DECISIONS'
  | 'SEND_PATU_REPORT'
  | 'SETTINGS_PAGE'
  | 'SUBMIT_PATU_REPORT'
  | 'UNITS_PAGE'
  | 'UNIT_FEATURES_PAGE'
  | 'UPDATE_HOLIDAY_PERIOD'
  | 'UPDATE_HOLIDAY_QUESTIONNAIRE'
  | 'UPDATE_SETTINGS'
  | 'VASU_TEMPLATES_PAGE'
  | 'WRITE_SERVICE_WORKER_APPLICATION_NOTES'

export type Application =
  | 'ACCEPT_DECISION'
  | 'CANCEL'
  | 'CANCEL_PLACEMENT_PLAN'
  | 'CONFIRM_DECISIONS_MAILED'
  | 'CREATE_NOTE'
  | 'CREATE_PLACEMENT_PLAN'
  | 'MOVE_TO_WAITING_PLACEMENT'
  | 'READ'
  | 'READ_ATTACHMENTS'
  | 'READ_DECISIONS'
  | 'READ_DECISION_DRAFT'
  | 'READ_IF_HAS_ASSISTANCE_NEED'
  | 'READ_NOTES'
  | 'READ_PLACEMENT_PLAN_DRAFT'
  | 'READ_SPECIAL_EDUCATION_TEACHER_NOTES'
  | 'REJECT_DECISION'
  | 'RESPOND_TO_PLACEMENT_PROPOSAL'
  | 'RETURN_TO_SENT'
  | 'SEND'
  | 'SEND_DECISIONS_WITHOUT_PROPOSAL'
  | 'SEND_PLACEMENT_PROPOSAL'
  | 'UPDATE'
  | 'UPDATE_DECISION_DRAFT'
  | 'UPLOAD_ATTACHMENT'
  | 'VERIFY'
  | 'WITHDRAW_PLACEMENT_PROPOSAL'

export type ApplicationNote =
  | 'DELETE'
  | 'UPDATE'

export type AssistanceAction =
  | 'DELETE'
  | 'READ_PRE_PRESCHOOL_ASSISTANCE_ACTION'
  | 'UPDATE'

export type AssistanceFactor =
  | 'DELETE'
  | 'READ_PRE_PRESCHOOL'
  | 'UPDATE'

export type AssistanceNeed =
  | 'DELETE'
  | 'READ_PRE_PRESCHOOL_ASSISTANCE_NEED'
  | 'UPDATE'

export type AssistanceNeedDecision =
  | 'ANNUL'
  | 'DECIDE'
  | 'DELETE'
  | 'MARK_AS_OPENED'
  | 'READ'
  | 'READ_DECISION_MAKER_OPTIONS'
  | 'READ_IN_REPORT'
  | 'REVERT_TO_UNSENT'
  | 'SEND'
  | 'UPDATE'
  | 'UPDATE_DECISION_MAKER'

export type AssistanceNeedPreschoolDecision =
  | 'ANNUL'
  | 'DECIDE'
  | 'DELETE'
  | 'MARK_AS_OPENED'
  | 'READ'
  | 'READ_DECISION_MAKER_OPTIONS'
  | 'READ_IN_REPORT'
  | 'REVERT_TO_UNSENT'
  | 'SEND'
  | 'UPDATE'
  | 'UPDATE_DECISION_MAKER'

export type AssistanceNeedVoucherCoefficient =
  | 'DELETE'
  | 'UPDATE'

export type BackupCare =
  | 'DELETE'
  | 'UPDATE'

export type BackupPickup =
  | 'DELETE'
  | 'UPDATE'

export type Child =
  | 'CREATE_ABSENCE'
  | 'CREATE_ASSISTANCE_ACTION'
  | 'CREATE_ASSISTANCE_FACTOR'
  | 'CREATE_ASSISTANCE_NEED'
  | 'CREATE_ASSISTANCE_NEED_DECISION'
  | 'CREATE_ASSISTANCE_NEED_PRESCHOOL_DECISION'
  | 'CREATE_ASSISTANCE_NEED_VOUCHER_COEFFICIENT'
  | 'CREATE_ATTENDANCE_RESERVATION'
  | 'CREATE_BACKUP_CARE'
  | 'CREATE_BACKUP_PICKUP'
  | 'CREATE_CHILD_DOCUMENT'
  | 'CREATE_DAILY_NOTE'
  | 'CREATE_DAILY_SERVICE_TIME'
  | 'CREATE_DAYCARE_ASSISTANCE'
  | 'CREATE_FEE_ALTERATION'
  | 'CREATE_OTHER_ASSISTANCE_MEASURE'
  | 'CREATE_PEDAGOGICAL_DOCUMENT'
  | 'CREATE_PRESCHOOL_ASSISTANCE'
  | 'CREATE_STICKY_NOTE'
  | 'CREATE_VASU_DOCUMENT'
  | 'DELETE_ABSENCE'
  | 'DELETE_ABSENCE_RANGE'
  | 'DELETE_HOLIDAY_RESERVATIONS'
  | 'DELETE_IMAGE'
  | 'READ'
  | 'READ_ABSENCES'
  | 'READ_ADDITIONAL_INFO'
  | 'READ_APPLICATION'
  | 'READ_ASSISTANCE'
  | 'READ_ASSISTANCE_ACTION'
  | 'READ_ASSISTANCE_FACTORS'
  | 'READ_ASSISTANCE_NEED'
  | 'READ_ASSISTANCE_NEED_DECISIONS'
  | 'READ_ASSISTANCE_NEED_PRESCHOOL_DECISIONS'
  | 'READ_ASSISTANCE_NEED_VOUCHER_COEFFICIENTS'
  | 'READ_BACKUP_CARE'
  | 'READ_BACKUP_PICKUP'
  | 'READ_BLOCKED_GUARDIANS'
  | 'READ_CHILD_CONSENTS'
  | 'READ_CHILD_DOCUMENT'
  | 'READ_CHILD_RECIPIENTS'
  | 'READ_DAILY_SERVICE_TIMES'
  | 'READ_DAYCARE_ASSISTANCES'
  | 'READ_DECISIONS'
  | 'READ_FAMILY_CONTACTS'
  | 'READ_FEE_ALTERATIONS'
  | 'READ_FUTURE_ABSENCES'
  | 'READ_GUARDIANS'
  | 'READ_OTHER_ASSISTANCE_MEASURES'
  | 'READ_PEDAGOGICAL_DOCUMENTS'
  | 'READ_PLACEMENT'
  | 'READ_PRESCHOOL_ASSISTANCES'
  | 'READ_SENSITIVE_INFO'
  | 'READ_VASU_DOCUMENT'
  | 'UPDATE_ADDITIONAL_INFO'
  | 'UPDATE_CHILD_RECIPIENT'
  | 'UPDATE_FAMILY_CONTACT_DETAILS'
  | 'UPDATE_FAMILY_CONTACT_PRIORITY'
  | 'UPLOAD_IMAGE'
  | 'UPSERT_CHILD_CONSENT'

export type ChildDailyNote =
  | 'DELETE'
  | 'UPDATE'

export type ChildDocument =
  | 'DELETE'
  | 'PUBLISH'
  | 'READ'
  | 'UNPUBLISH'
  | 'UPDATE'

export type DailyServiceTime =
  | 'DELETE'
  | 'UPDATE'

export type DaycareAssistance =
  | 'DELETE'
  | 'READ_PRE_PRESCHOOL'
  | 'UPDATE'

export type Decision =
  | 'DOWNLOAD_PDF'
  | 'READ'

export type FeeAlteration =
  | 'DELETE'
  | 'UPDATE'

export type Group =
  | 'CREATE_ABSENCES'
  | 'CREATE_CALENDAR_EVENT'
  | 'CREATE_CARETAKERS'
  | 'CREATE_NOTE'
  | 'DELETE'
  | 'DELETE_ABSENCES'
  | 'DELETE_CARETAKERS'
  | 'MARK_ARRIVAL'
  | 'MARK_DEPARTURE'
  | 'MARK_EXTERNAL_ARRIVAL'
  | 'MARK_EXTERNAL_DEPARTURE'
  | 'READ_ABSENCES'
  | 'READ_CARETAKERS'
  | 'READ_NOTES'
  | 'READ_STAFF_ATTENDANCES'
  | 'UPDATE'
  | 'UPDATE_CARETAKERS'
  | 'UPDATE_STAFF_ATTENDANCES'

export type GroupPlacement =
  | 'DELETE'
  | 'UPDATE'

export type Income =
  | 'DELETE'
  | 'UPDATE'
  | 'UPLOAD_ATTACHMENT'

export type Invoice =
  | 'DELETE'
  | 'READ'
  | 'SEND'
  | 'UPDATE'

export type InvoiceCorrection =
  | 'DELETE'
  | 'UPDATE_NOTE'

export type MobileDevice =
  | 'DELETE'
  | 'UPDATE_NAME'

export type OtherAssistanceMeasure =
  | 'DELETE'
  | 'READ_PRE_PRESCHOOL'
  | 'UPDATE'

export type Pairing = 'POST_RESPONSE'

export type Parentship =
  | 'DELETE'
  | 'DELETE_CONFLICTED_PARENTSHIP'
  | 'READ'
  | 'RETRY'
  | 'UPDATE'

export type Payment = 'SEND'

export type Person =
  | 'ADD_SSN'
  | 'CREATE_FOSTER_PARENT_RELATIONSHIP'
  | 'CREATE_INCOME'
  | 'CREATE_INVOICE_CORRECTION'
  | 'CREATE_PARENTSHIP'
  | 'CREATE_PARTNERSHIP'
  | 'DELETE'
  | 'DISABLE_SSN_ADDING'
  | 'DUPLICATE'
  | 'ENABLE_SSN_ADDING'
  | 'GENERATE_RETROACTIVE_FEE_DECISIONS'
  | 'GENERATE_RETROACTIVE_VOUCHER_VALUE_DECISIONS'
  | 'MERGE'
  | 'READ'
  | 'READ_APPLICATIONS'
  | 'READ_CHILD_PLACEMENT_PERIODS'
  | 'READ_DECISIONS'
  | 'READ_DEPENDANTS'
  | 'READ_FAMILY_OVERVIEW'
  | 'READ_FEE_DECISIONS'
  | 'READ_FOSTER_CHILDREN'
  | 'READ_FOSTER_PARENTS'
  | 'READ_INCOME'
  | 'READ_INCOME_NOTIFICATIONS'
  | 'READ_INCOME_STATEMENTS'
  | 'READ_INVOICES'
  | 'READ_INVOICE_ADDRESS'
  | 'READ_INVOICE_CORRECTIONS'
  | 'READ_OPH_OID'
  | 'READ_PARENTSHIPS'
  | 'READ_PARTNERSHIPS'
  | 'READ_VOUCHER_VALUE_DECISIONS'
  | 'UPDATE'
  | 'UPDATE_EVAKA_RIGHTS'
  | 'UPDATE_FROM_VTJ'
  | 'UPDATE_INVOICE_ADDRESS'
  | 'UPDATE_OPH_OID'
  | 'UPDATE_PERSONAL_DETAILS'

export type Placement =
  | 'CREATE_GROUP_PLACEMENT'
  | 'CREATE_SERVICE_NEED'
  | 'DELETE'
  | 'UPDATE'

export type PreschoolAssistance =
  | 'DELETE'
  | 'UPDATE'

export type ServiceNeed =
  | 'DELETE'
  | 'UPDATE'

export type Unit =
  | 'ACCEPT_PLACEMENT_PROPOSAL'
  | 'CREATE_CALENDAR_EVENT'
  | 'CREATE_GROUP'
  | 'CREATE_MOBILE_DEVICE_PAIRING'
  | 'CREATE_PLACEMENT'
  | 'CREATE_TEMPORARY_EMPLOYEE'
  | 'DELETE_ACL_EARLY_CHILDHOOD_EDUCATION_SECRETARY'
  | 'DELETE_ACL_SPECIAL_EDUCATION_TEACHER'
  | 'DELETE_ACL_STAFF'
  | 'DELETE_ACL_UNIT_SUPERVISOR'
  | 'DELETE_STAFF_ATTENDANCES'
  | 'DELETE_TEMPORARY_EMPLOYEE'
  | 'INSERT_ACL_EARLY_CHILDHOOD_EDUCATION_SECRETARY'
  | 'INSERT_ACL_SPECIAL_EDUCATION_TEACHER'
  | 'INSERT_ACL_STAFF'
  | 'INSERT_ACL_UNIT_SUPERVISOR'
  | 'READ'
  | 'READ_ACL'
  | 'READ_APPLICATIONS_AND_PLACEMENT_PLANS'
  | 'READ_APPLICATIONS_REPORT'
  | 'READ_ASSISTANCE_NEEDS_AND_ACTIONS_REPORT'
  | 'READ_ATTENDANCES'
  | 'READ_ATTENDANCE_RESERVATIONS'
  | 'READ_ATTENDANCE_RESERVATION_REPORT'
  | 'READ_BACKUP_CARE'
  | 'READ_CALENDAR_EVENTS'
  | 'READ_CHILD_AGE_AND_LANGUAGE_REPORT'
  | 'READ_CHILD_ATTENDANCES'
  | 'READ_CHILD_CAPACITY_FACTORS'
  | 'READ_CHILD_IN_DIFFERENT_ADDRESS_REPORT'
  | 'READ_FAMILY_CONFLICT_REPORT'
  | 'READ_FAMILY_CONTACT_REPORT'
  | 'READ_GROUPS'
  | 'READ_GROUP_DETAILS'
  | 'READ_MISSING_GROUP_PLACEMENTS'
  | 'READ_MISSING_HEAD_OF_FAMILY_REPORT'
  | 'READ_MISSING_SERVICE_NEED_REPORT'
  | 'READ_MOBILE_DEVICES'
  | 'READ_MOBILE_INFO'
  | 'READ_MOBILE_STATS'
  | 'READ_OCCUPANCIES'
  | 'READ_OCCUPANCY_REPORT'
  | 'READ_PARTNERS_IN_DIFFERENT_ADDRESS_REPORT'
  | 'READ_PLACEMENT'
  | 'READ_PLACEMENT_PLAN'
  | 'READ_REALTIME_STAFF_ATTENDANCES'
  | 'READ_SERVICE_NEED_REPORT'
  | 'READ_SERVICE_VOUCHER_REPORT'
  | 'READ_SERVICE_VOUCHER_VALUES_REPORT'
  | 'READ_STAFF_ATTENDANCES'
  | 'READ_STAFF_OCCUPANCY_COEFFICIENTS'
  | 'READ_TEMPORARY_EMPLOYEE'
  | 'READ_TERMINATED_PLACEMENTS'
  | 'READ_UNREAD_MESSAGES'
  | 'UPDATE'
  | 'UPDATE_CHILD_ATTENDANCES'
  | 'UPDATE_FEATURES'
  | 'UPDATE_STAFF_ATTENDANCES'
  | 'UPDATE_STAFF_GROUP_ACL'
  | 'UPDATE_TEMPORARY_EMPLOYEE'
  | 'UPSERT_STAFF_OCCUPANCY_COEFFICIENTS'

export type VasuDocument =
  | 'DELETE'
  | 'EVENT_MOVED_TO_CLOSED'
  | 'EVENT_MOVED_TO_READY'
  | 'EVENT_MOVED_TO_REVIEWED'
  | 'EVENT_PUBLISHED'
  | 'EVENT_RETURNED_TO_READY'
  | 'EVENT_RETURNED_TO_REVIEWED'
  | 'READ'
  | 'UPDATE'

export type VasuTemplate =
  | 'COPY'
  | 'DELETE'
  | 'READ'
  | 'UPDATE'

export namespace Citizen {

export type Application =
  | 'DELETE'
  | 'READ'
  | 'READ_DECISIONS'
  | 'UPDATE'
  | 'UPLOAD_ATTACHMENT'

}

}

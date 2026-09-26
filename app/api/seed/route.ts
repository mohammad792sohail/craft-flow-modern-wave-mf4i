import { authMiddleware, getDb } from 'lyzr-architect-pg'
import {
  auditEvents,
  automationRuns,
  automationSettings,
  complianceResults,
  employees,
  exceptionReports,
  holidays,
  reminderDeliveries,
  rosterSnapshotEntries,
  rosterSnapshots,
  scheduleSlots,
  submissionRecords,
  submissionSnapshots,
} from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const BUSINESS_DATE = '2026-09-26'
const employeesSeed = [
  { id: 'emp-101', employee_code: 'E101', full_name: 'Anita Verma', email: 'anita.verma@company.com', department: 'Product Operations', job_title: 'Operations Analyst', manager_id: 'mgr-arun', role: 'employee', access_state: 'active', hire_date: '2022-04-18', location: 'Bengaluru' },
  { id: 'emp-102', employee_code: 'E102', full_name: 'Rahul Mehta', email: 'rahul.mehta@company.com', department: 'Product Operations', job_title: 'Operations Specialist', manager_id: 'mgr-arun', role: 'employee', access_state: 'active', hire_date: '2021-11-08', location: 'Pune' },
  { id: 'emp-103', employee_code: 'E103', full_name: 'Meera Iyer', email: 'meera.iyer@company.com', department: 'Design Systems', job_title: 'Product Designer', manager_id: 'mgr-megha', role: 'employee', access_state: 'active', hire_date: '2023-01-23', location: 'Hyderabad' },
  { id: 'emp-104', employee_code: 'E104', full_name: 'John Mathew', email: 'john.mathew@company.com', department: 'Customer Success', job_title: 'Client Partner', manager_id: 'mgr-sarah', role: 'employee', access_state: 'active', hire_date: '2020-09-14', location: 'Chennai' },
  { id: 'emp-105', employee_code: 'E105', full_name: 'Priya Nair', email: 'priya.nair@company.com', department: 'Product Operations', job_title: 'Program Manager', manager_id: 'mgr-arun', role: 'employee', access_state: 'active', hire_date: '2022-07-11', location: 'Bengaluru' },
]

export const POST = authMiddleware(async () => {
  try {
    const db = getDb()
    const existing = await db.select({ id: employees.id }).from(employees).limit(1)
    if (existing.length > 0) return NextResponse.json({ success: true, seeded: false })

    await db.insert(employees).values(employeesSeed)
    await db.insert(scheduleSlots).values(employeesSeed.map((employee, index) => ({ id: `slot-${index + 101}`, employee_id: employee.id, day_of_week: 1, required: employee.id !== 'emp-103', location: employee.location, effective_from: '2026-01-01', effective_to: '2026-12-31' })))
    await db.insert(holidays).values([{ id: 'holiday-2026-10-02', holiday_date: '2026-10-02', name: 'Gandhi Jayanti', description: 'Company holiday; scheduled automation is skipped.' }])
    await db.insert(rosterSnapshots).values([{ id: 'roster-20260926', snapshot_date: BUSINESS_DATE, source: 'SharePoint Employee Roster', employee_count: employeesSeed.length, is_complete: true, raw_data: { source_reference: 'sharepoint://lists/rto-roster/20260926' } }])
    await db.insert(rosterSnapshotEntries).values(employeesSeed.map((employee, index) => ({ id: `entry-${index + 101}`, roster_snapshot_id: 'roster-20260926', employee_id: employee.id, employee_code: employee.employee_code, department: employee.department, status: employee.access_state })))
    await db.insert(submissionSnapshots).values([{ id: 'submission-20260926', snapshot_date: BUSINESS_DATE, source: 'Microsoft Forms', is_complete: false, raw_data: { custom_tool_status: 'not_connected' } }])
    await db.insert(submissionRecords).values([
      { id: 'response-101', submission_snapshot_id: 'submission-20260926', employee_id: 'emp-101', submission_date: BUSINESS_DATE, status: 'WFO_YES', wfh_reason: '', wfh_reason_hr_approved: false, location: 'Bengaluru' },
      { id: 'response-103', submission_snapshot_id: 'submission-20260926', employee_id: 'emp-103', submission_date: BUSINESS_DATE, status: 'WFO_NO', wfh_reason: 'Manager approval', wfh_reason_hr_approved: true, location: 'Hyderabad' },
      { id: 'response-104', submission_snapshot_id: 'submission-20260926', employee_id: 'emp-104', submission_date: BUSINESS_DATE, status: 'WFO_NO', wfh_reason: 'Sick', wfh_reason_hr_approved: false, location: 'Chennai' },
    ])
    await db.insert(automationRuns).values({ id: 'run-1000', run_type: '10:00', status: 'completed', started_at: new Date('2026-09-26T10:00:00+05:30'), completed_at: new Date('2026-09-26T10:00:42+05:30'), error_message: '', triggered_by: 'LYZR_SCHEDULER', roster_snapshot_id: 'roster-20260926', submission_snapshot_id: 'submission-20260926' })
    await db.insert(automationRuns).values({ id: 'run-1045', run_type: '10:45', status: 'completed', started_at: new Date('2026-09-26T10:45:00+05:30'), completed_at: new Date('2026-09-26T10:45:42+05:30'), error_message: '', triggered_by: 'LYZR_SCHEDULER', roster_snapshot_id: 'roster-20260926', submission_snapshot_id: 'submission-20260926' })
    await db.insert(automationRuns).values({ id: 'run-1130', run_type: '11:30', status: 'scheduled', started_at: new Date('2026-09-26T11:30:00+05:30'), completed_at: new Date('2026-09-26T11:30:00+05:30'), error_message: '', triggered_by: 'LYZR_SCHEDULER', roster_snapshot_id: 'roster-20260926', submission_snapshot_id: 'submission-20260926' })
    await db.insert(automationRuns).values({ id: 'run-1300', run_type: '13:00', status: 'scheduled', started_at: new Date('2026-09-26T13:00:00+05:30'), completed_at: new Date('2026-09-26T13:00:00+05:30'), error_message: '', triggered_by: 'LYZR_SCHEDULER', roster_snapshot_id: 'roster-20260926', submission_snapshot_id: 'submission-20260926' })
    await db.insert(complianceResults).values([
      { id: 'result-101', automation_run_id: 'run-1045', employee_id: 'emp-101', period_start: BUSINESS_DATE, period_end: BUSINESS_DATE, required_days: 1, actual_days: 1, compliance_status: 'compliant', details: { lead_name: 'Arun K.', location: 'Bengaluru', scheduled_for_office: true, response_found: true, wfo_answer: 'Yes', submitted_at: '2026-09-26T09:42:00+05:30' } },
      { id: 'result-102', automation_run_id: 'run-1045', employee_id: 'emp-102', period_start: BUSINESS_DATE, period_end: BUSINESS_DATE, required_days: 1, actual_days: 0, compliance_status: 'defaulter', details: { lead_name: 'Arun K.', location: 'Pune', scheduled_for_office: true, response_found: false, wfo_answer: '', submitted_at: '' } },
      { id: 'result-103', automation_run_id: 'run-1045', employee_id: 'emp-103', period_start: BUSINESS_DATE, period_end: BUSINESS_DATE, required_days: 0, actual_days: 1, compliance_status: 'not_expected', details: { lead_name: 'Megha S.', location: 'Hyderabad', scheduled_for_office: false, response_found: true, wfo_answer: 'No', submitted_at: '2026-09-26T09:48:00+05:30' } },
      { id: 'result-104', automation_run_id: 'run-1045', employee_id: 'emp-104', period_start: BUSINESS_DATE, period_end: BUSINESS_DATE, required_days: 1, actual_days: 1, compliance_status: 'exception', details: { lead_name: 'Sarah J.', location: 'Chennai', scheduled_for_office: true, response_found: true, wfo_answer: 'No', submitted_at: '2026-09-26T10:18:00+05:30', wfh_reason: 'Sick' } },
      { id: 'result-105', automation_run_id: 'run-1045', employee_id: 'emp-105', period_start: BUSINESS_DATE, period_end: BUSINESS_DATE, required_days: 1, actual_days: 0, compliance_status: 'defaulter', details: { lead_name: 'Arun K.', location: 'Bengaluru', scheduled_for_office: true, response_found: false, wfo_answer: '', submitted_at: '' } },
    ])
    await db.insert(reminderDeliveries).values({ id: 'delivery-1000', automation_run_id: 'run-1000', employee_id: '', channel: 'common_teams', delivery_key: '2026-09-26-10:00-common', status: 'sent', sent_at: new Date('2026-09-26T10:00:45+05:30'), error_message: '' })
    await db.insert(reminderDeliveries).values({ id: 'delivery-1045', automation_run_id: 'run-1045', employee_id: '', channel: 'common_teams', delivery_key: '2026-09-26-10:45-common', status: 'sent', sent_at: new Date('2026-09-26T10:45:45+05:30'), error_message: '' })
    await db.insert(exceptionReports).values({ id: 'exception-104', employee_id: 'emp-104', automation_run_id: 'run-1045', compliance_result_id: 'result-104', reason: 'Sick', hr_approved: false, status: 'pending_review', resolved_at: new Date('2026-09-26T13:00:00+05:30'), notes: 'WFH reason is restricted to HR review.' })
    await db.insert(auditEvents).values([
      { id: 'audit-1', actor_employee_id: '', event_type: 'source_check', entity_type: 'roster_snapshot', entity_id: 'roster-20260926', details: { source: 'SharePoint', status: 'complete', employee_count: 5 } },
      { id: 'audit-2', actor_employee_id: '', event_type: 'reminder_delivery', entity_type: 'automation_run', entity_id: 'run-1045', details: { destination: 'Project RTO Updates', outstanding: 2, status: 'sent' } },
      { id: 'audit-3', actor_employee_id: '', event_type: 'response_anomaly', entity_type: 'submission_snapshot', entity_id: 'submission-20260926', details: { code: 'FORMS_TOOL_UNAVAILABLE', severity: 'error' } },
    ])
    await db.insert(automationSettings).values([
      { id: 'setting-timezone', setting_key: 'business_timezone', setting_value: 'Asia/Kolkata', description: 'Configured business timezone.' },
      { id: 'setting-teams', setting_key: 'common_teams_destination', setting_value: 'Project RTO Updates', description: 'Common Teams destination for aggregate messages.' },
      { id: 'setting-hr', setting_key: 'hr_destination', setting_value: 'HR Operations', description: 'Restricted HR destination.' },
      { id: 'setting-form', setting_key: 'rto_form_url', setting_value: 'https://forms.office.com/r/rto-daily', description: 'Link included in reminder messages.' },
    ])
    return NextResponse.json({ success: true, seeded: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not seed the operations workspace.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})

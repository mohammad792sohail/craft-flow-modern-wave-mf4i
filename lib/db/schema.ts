export { users } from 'lyzr-architect-pg/schema'

import { boolean, date, generateId, integer, jsonb, pgTable, text, timestamp } from 'lyzr-architect-pg/schema'

export const employees = pgTable('employees', {
  id: text('id').primaryKey().$defaultFn(generateId),
  employee_code: text('employee_code').notNull(),
  full_name: text('full_name').notNull(),
  email: text('email').notNull(),
  department: text('department').notNull(),
  job_title: text('job_title').notNull(),
  manager_id: text('manager_id').notNull(),
  role: text('role').notNull(),
  access_state: text('access_state').notNull(),
  hire_date: date('hire_date').notNull(),
  location: text('location').notNull(),
})

export const scheduleSlots = pgTable('schedule_slots', {
  id: text('id').primaryKey().$defaultFn(generateId),
  employee_id: text('employee_id').notNull(),
  day_of_week: integer('day_of_week').notNull(),
  required: boolean('required').notNull(),
  location: text('location').notNull(),
  effective_from: date('effective_from').notNull(),
  effective_to: date('effective_to').notNull(),
})

export const holidays = pgTable('holidays', {
  id: text('id').primaryKey().$defaultFn(generateId),
  holiday_date: date('holiday_date').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
})

export const rosterSnapshots = pgTable('roster_snapshots', {
  id: text('id').primaryKey().$defaultFn(generateId),
  snapshot_date: date('snapshot_date').notNull(),
  source: text('source').notNull(),
  employee_count: integer('employee_count').notNull(),
  is_complete: boolean('is_complete').notNull(),
  raw_data: jsonb('raw_data').notNull(),
})

export const rosterSnapshotEntries = pgTable('roster_snapshot_entries', {
  id: text('id').primaryKey().$defaultFn(generateId),
  roster_snapshot_id: text('roster_snapshot_id').notNull(),
  employee_id: text('employee_id').notNull(),
  employee_code: text('employee_code').notNull(),
  department: text('department').notNull(),
  status: text('status').notNull(),
})

export const submissionSnapshots = pgTable('submission_snapshots', {
  id: text('id').primaryKey().$defaultFn(generateId),
  snapshot_date: date('snapshot_date').notNull(),
  source: text('source').notNull(),
  is_complete: boolean('is_complete').notNull(),
  raw_data: jsonb('raw_data').notNull(),
})

export const submissionRecords = pgTable('submission_records', {
  id: text('id').primaryKey().$defaultFn(generateId),
  submission_snapshot_id: text('submission_snapshot_id').notNull(),
  employee_id: text('employee_id').notNull(),
  submission_date: date('submission_date').notNull(),
  status: text('status').notNull(),
  wfh_reason: text('wfh_reason').notNull(),
  wfh_reason_hr_approved: boolean('wfh_reason_hr_approved').notNull(),
  location: text('location').notNull(),
})

export const automationRuns = pgTable('automation_runs', {
  id: text('id').primaryKey().$defaultFn(generateId),
  run_type: text('run_type').notNull(),
  status: text('status').notNull(),
  started_at: timestamp('started_at', { withTimezone: true }).notNull(),
  completed_at: timestamp('completed_at', { withTimezone: true }).notNull(),
  error_message: text('error_message').notNull(),
  triggered_by: text('triggered_by').notNull(),
  roster_snapshot_id: text('roster_snapshot_id').notNull(),
  submission_snapshot_id: text('submission_snapshot_id').notNull(),
})

export const complianceResults = pgTable('compliance_results', {
  id: text('id').primaryKey().$defaultFn(generateId),
  automation_run_id: text('automation_run_id').notNull(),
  employee_id: text('employee_id').notNull(),
  period_start: date('period_start').notNull(),
  period_end: date('period_end').notNull(),
  required_days: integer('required_days').notNull(),
  actual_days: integer('actual_days').notNull(),
  compliance_status: text('compliance_status').notNull(),
  details: jsonb('details').notNull(),
})

export const reminderDeliveries = pgTable('reminder_deliveries', {
  id: text('id').primaryKey().$defaultFn(generateId),
  automation_run_id: text('automation_run_id').notNull(),
  employee_id: text('employee_id').notNull(),
  channel: text('channel').notNull(),
  delivery_key: text('delivery_key').notNull(),
  status: text('status').notNull(),
  sent_at: timestamp('sent_at', { withTimezone: true }).notNull(),
  error_message: text('error_message').notNull(),
})

export const exceptionReports = pgTable('exception_reports', {
  id: text('id').primaryKey().$defaultFn(generateId),
  employee_id: text('employee_id').notNull(),
  automation_run_id: text('automation_run_id').notNull(),
  compliance_result_id: text('compliance_result_id').notNull(),
  reason: text('reason').notNull(),
  hr_approved: boolean('hr_approved').notNull(),
  status: text('status').notNull(),
  resolved_at: timestamp('resolved_at', { withTimezone: true }).notNull(),
  notes: text('notes').notNull(),
})

export const auditEvents = pgTable('audit_events', {
  id: text('id').primaryKey().$defaultFn(generateId),
  actor_employee_id: text('actor_employee_id').notNull(),
  event_type: text('event_type').notNull(),
  entity_type: text('entity_type').notNull(),
  entity_id: text('entity_id').notNull(),
  details: jsonb('details').notNull(),
})

export const automationSettings = pgTable('automation_settings', {
  id: text('id').primaryKey().$defaultFn(generateId),
  setting_key: text('setting_key').notNull(),
  setting_value: jsonb('setting_value').notNull(),
  description: text('description').notNull(),
})

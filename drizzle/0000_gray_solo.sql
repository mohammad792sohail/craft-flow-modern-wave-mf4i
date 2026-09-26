CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_employee_id" text NOT NULL,
	"event_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"details" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"run_type" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"error_message" text NOT NULL,
	"triggered_by" text NOT NULL,
	"roster_snapshot_id" text NOT NULL,
	"submission_snapshot_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" jsonb NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_results" (
	"id" text PRIMARY KEY NOT NULL,
	"automation_run_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"required_days" integer NOT NULL,
	"actual_days" integer NOT NULL,
	"compliance_status" text NOT NULL,
	"details" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_code" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"department" text NOT NULL,
	"job_title" text NOT NULL,
	"manager_id" text NOT NULL,
	"role" text NOT NULL,
	"access_state" text NOT NULL,
	"hire_date" date NOT NULL,
	"location" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exception_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"automation_run_id" text NOT NULL,
	"compliance_result_id" text NOT NULL,
	"reason" text NOT NULL,
	"hr_approved" boolean NOT NULL,
	"status" text NOT NULL,
	"resolved_at" timestamp with time zone NOT NULL,
	"notes" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" text PRIMARY KEY NOT NULL,
	"holiday_date" date NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"automation_run_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"channel" text NOT NULL,
	"delivery_key" text NOT NULL,
	"status" text NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"error_message" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roster_snapshot_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"roster_snapshot_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"employee_code" text NOT NULL,
	"department" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roster_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"snapshot_date" date NOT NULL,
	"source" text NOT NULL,
	"employee_count" integer NOT NULL,
	"is_complete" boolean NOT NULL,
	"raw_data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"required" boolean NOT NULL,
	"location" text NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_records" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_snapshot_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"submission_date" date NOT NULL,
	"status" text NOT NULL,
	"wfh_reason" text NOT NULL,
	"wfh_reason_hr_approved" boolean NOT NULL,
	"location" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"snapshot_date" date NOT NULL,
	"source" text NOT NULL,
	"is_complete" boolean NOT NULL,
	"raw_data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "_users_email_unique" ON "_users" USING btree ("email");
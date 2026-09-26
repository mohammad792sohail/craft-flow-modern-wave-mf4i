I’ll turn the confirmed workflow into the full automation plan and a four-screen operational mockup, with the Microsoft Forms API dependency called out explicitly.

# RTO Compliance Automator

## 1. Overview

RTO Compliance Automator is an authenticated HR operations application that automatically compares daily Microsoft Forms submissions with the active employee roster in Microsoft Lists/SharePoint.

On Monday through Friday, the system:

1. Reads the active employee roster and each employee’s rotation schedule.
2. Retrieves that day’s Microsoft Forms responses.
3. Matches responses to employees by normalized employee ID.
4. Posts updated defaulter lists to the common Microsoft Teams group at 10:00 AM, 10:45 AM, and 11:30 AM.
5. At 1:00 PM, produces a final WFO/WFH summary.
6. Identifies employees who selected `WFO = No` on a scheduled office day.
7. Creates a restricted exception file containing their employee, lead, location, and WFH reason details.
8. sends the exception file only to HR.
9. Retains run history, response snapshots, reminders, exceptions, and audit events.

### Practical real-time example

Assume the roster contains these employees for Monday:

| Employee ID | Employee | Scheduled today? | Form submitted by 10:00? | WFO answer |
|---|---|---:|---:|---|
| E101 | Anita | Yes | Yes | Yes |
| E102 | Rahul | Yes | No | — |
| E103 | Meera | No | Yes | No |
| E104 | John | Yes | Yes | No |
| E105 | Priya | Yes | No | — |

At 10:00 AM:

- Expected submissions: all five active employees, if company policy requires every employee to respond.
- Received submissions: E101, E103, and E104.
- Defaulters: E102 and E105.
- Teams message: “2 employees have not submitted today’s RTO form: Rahul (E102), Priya (E105).”

If E102 submits at 10:22 AM, the 10:45 AM reconciliation reads the responses again:

- Remaining defaulter: E105.
- Teams message: “Update: 1 employee has not submitted today’s RTO form: Priya (E105).”

At 1:00 PM:

- E104 selected `WFO = No` and was scheduled to work from the office.
- E103 selected `WFO = No` but was not scheduled to work from the office, so E103 is not an RTO exception.
- The restricted HR file includes E104 and the selected reason.
- The common Teams group receives only final aggregate counts, not WFH reasons.

### Required form change

The current form description does not include a WFH reason field, although the final report requires one. Add a required conditional question:

- If `WFO = No`, show `Reason for not working from office`.
- Prefer a controlled dropdown such as `Leave`, `Sick`, `Client requirement`, `Manager approval`, `Travel issue`, or `Other`.
- If `Other` is selected, show an optional explanation field.

### Matching and compliance rules

- Employee ID is the authoritative matching key.
- Trim spaces and normalize employee ID casing before matching.
- Employee name is display information, not a matching key.
- Only employees marked active in the master roster are evaluated.
- Duplicate submissions use the latest valid submission received before the run.
- Unknown employee IDs are excluded from compliance totals and flagged for HR review.
- A defaulter is an active employee expected to submit but without a valid response for the current business date.
- An RTO exception is an employee scheduled in the office today who submitted `WFO = No`.
- WFH reasons are restricted to HR-facing views and files.
- The application uses the configured business timezone; it does not infer time from the server timezone.
- Weekends and configured company holidays are skipped.

## 2. User Stories

- As an HR operator, I want the roster and form responses reconciled automatically so I do not compare hundreds of rows manually.
- As an HR operator, I want defaulter reminders posted at fixed times so employees receive consistent follow-ups.
- As an HR operator, I want to inspect a run before or after publication and understand why an employee was classified as a defaulter.
- As an HR operator, I want a restricted daily file of scheduled employees who selected `WFO = No`.
- As management, I want a 1:00 PM summary of submission, WFO, WFH, and exception totals.
- As an auditor, I want to see when each reconciliation ran, which data was used, what was sent, and whether delivery succeeded.
- As an administrator, I want to configure the roster list, Teams destination, HR recipients, timezone, holidays, and schedules without changing agent instructions.
- As an HR operator, I want failed reads or deliveries clearly flagged rather than receiving a misleading partial report.
- As an employee, I want later reminders to exclude me after I submit the form.
- As a privacy stakeholder, I want employee WFH reasons visible only to authorized HR users.

## 3.a. Agent Architecture

The workflow uses a manager with one sub-agent per external data source. Scheduling, storage, dashboards, and audit logging are application services, not separate agents.

| Agent Type | Agent Name | Description | Tools/Data Sources | Trigger | Provider | Model | Temperature | Top_p |
|---|---|---|---|---|---|---|---:|---:|
| Manager | RTO Compliance Manager | Coordinates roster and response retrieval, validates run completeness, applies compliance rules, creates reminder/summary content, and initiates approved deliveries. | Outputs from Roster Reader and Forms Response Reader; `microsoft_teams`; `SHARE_POINT` | Weekday schedules at 10:00, 10:45, 11:30, and 13:00; authorized manual rerun | Anthropic | `anthropic/claude-sonnet-4-6` | 0.1 | 0.9 |
| Sub-Agent | Roster Reader | Retrieves active employees, reporting lines, locations, rotation days, and status from the authoritative Microsoft List. | `SHARE_POINT` (`aci`) | Delegated by RTO Compliance Manager for each run | Anthropic | `anthropic/claude-haiku-4-5` | 0.0 | 0.9 |
| Sub-Agent | Forms Response Reader | Retrieves current-day Microsoft Forms responses through the required custom Microsoft Graph/Forms tool and returns normalized records. | Custom Microsoft Forms/Graph tool | Delegated by RTO Compliance Manager for each run | Anthropic | `anthropic/claude-haiku-4-5` | 0.0 | 0.9 |

The manager must not publish a defaulter list if either required source is unavailable or incomplete. It records a failed run and alerts HR instead.

## 3.c. Scheduling and Reconciliation

The `LYZR_SCHEDULER` integration initiates four weekday workflows:

| Time | Workflow |
|---|---|
| 10:00 AM | First reconciliation and Teams defaulter message |
| 10:45 AM | Fresh reconciliation and updated Teams defaulter message |
| 11:30 AM | Final defaulter reconciliation and Teams message |
| 1:00 PM | Final response snapshot, WFO/WFH summary, exception file, and HR delivery |

Schedules use one explicitly configured business timezone.

Each run retrieves fresh source data. It does not subtract submissions from an old defaulter list. This prevents employees who submitted between reminders from remaining incorrectly listed.

A manual rerun is available to authorized HR users. Manual runs are clearly labeled and do not silently replace historical scheduled runs.

## 3.d. Teams Message Policy

Reminder messages contain:

- Business date and run time.
- Number of expected responses.
- Number received.
- Number still outstanding.
- Employee ID and employee name for each current defaulter.
- A link to the RTO Form.
- A notice that the list is refreshed at the next scheduled run.

If there are no defaulters, the app posts a concise completion message.

The 1:00 PM common-group summary contains aggregate figures only:

- Active employees expected to submit.
- Total valid submissions.
- Outstanding submissions.
- `WFO = Yes`.
- `WFO = No`.
- Scheduled-office-day exceptions.
- Unknown or invalid response count.

WFH reasons are never posted to the common Teams group.

## 3.e. Exception Report

The 1:00 PM exception report includes only employees who:

1. Are active.
2. Are scheduled to work from the office on the business date.
3. Submitted a valid response for that date.
4. Selected `WFO = No`.

The report contains:

- Business date.
- Employee ID and employee name.
- Lead name.
- Location.
- Scheduled rotation.
- WFO answer.
- WFH reason and optional explanation.
- Submission timestamp.
- Exception classification.

The report is generated as an Excel-compatible file, stored in a restricted SharePoint HR folder, and sent to the configured HR recipient or HR-only Teams destination.

## 3.f. Reliability, Privacy, and Audit Controls

- Source retrieval and message delivery use idempotency keys based on date, schedule slot, and destination.
- Retried runs update the corresponding run record without creating duplicate scheduled messages.
- HR can see names, WFH reasons, source anomalies, and delivery details.
- Non-HR viewers cannot access the application.
- Sensitive reason fields are omitted from common-channel messages and non-HR logs.
- Every outbound message and report records its destination, timestamp, status, and external reference.
- A failed or partial source read blocks publication and creates an HR alert.
- Unexpected roster changes, duplicate IDs, unknown submitters, and malformed responses appear in a review queue.
- Data retention duration is configurable to company policy.

## 3.g. Database Configuration

Use the built-in PostgreSQL database for structured cross-session records.

Authentication uses email/password sign-up and login. Every application screen and API route is gated. Production access should be restricted to approved company email domains and HR/admin roles.

Core tables:

- `users`: account identity, role, active status, and last login.
- `automation_settings`: timezone, Teams destination, HR destination, form link, source identifiers, and retention settings.
- `schedule_slots`: weekday schedule definitions and enabled status.
- `roster_snapshots`: per-run snapshots of relevant roster fields.
- `submission_snapshots`: normalized form responses used in each reconciliation.
- `automation_runs`: trigger, scheduled slot, status, source counts, start/end times, and error information.
- `compliance_results`: per-employee classification for each run.
- `reminder_deliveries`: message content hash, destination, sent time, status, and external reference.
- `exception_reports`: report metadata, SharePoint file reference, recipient, and delivery status.
- `audit_events`: actor, operation, entity, timestamp, and sanitized change details.
- `holidays`: dates on which scheduled automation must not execute.

All business records are scoped to the owning organization. WFH reasons are stored only where necessary for the HR exception workflow and are protected by role-based access.

## 4. User Flow

1. An administrator signs up or an approved HR user logs in.
2. The administrator configures:
   - Business timezone.
   - SharePoint roster list.
   - Microsoft Form identifier.
   - Common Teams destination.
   - Restricted HR destination.
   - RTO Form URL.
   - Holiday calendar.
3. The application validates access to every source and destination.
4. On a weekday schedule, `LYZR_SCHEDULER` triggers the RTO Compliance Manager.
5. The manager delegates roster retrieval and Forms response retrieval.
6. The system stores immutable source snapshots for the run.
7. The manager checks source completeness and applies deterministic reconciliation rules.
8. At 10:00, 10:45, and 11:30, the current defaulter message is posted to Teams.
9. The dashboard updates with counts, delivery status, anomalies, and the next scheduled run.
10. At 1:00 PM, the system performs a fresh final reconciliation.
11. It posts aggregate WFO/WFH figures to the common Teams group.
12. It generates the HR-only exception file and stores it in restricted SharePoint.
13. It sends the file reference to the configured HR destination.
14. HR can open a run, review employee-level classifications, download the report, inspect failures, and manually rerun an unsuccessful step.
15. Audit users can filter historical runs by date, status, location, lead, and schedule slot.

## 5. Integrations Required

| Integration | Source | Required operations |
|---|---|---|
| Microsoft SharePoint | `SHARE_POINT` / `aci` | Retrieve Microsoft List roster items; create the daily exception file in a restricted HR folder; retrieve the stored file reference |
| Microsoft Teams | `microsoft_teams` / `composio` | Post defaulter reminders and aggregate summaries to the configured common group; send the restricted exception-file reference to HR |
| Lyzr Scheduler | `LYZR_SCHEDULER` / `aci` | Create and execute weekday schedules at 10:00, 10:45, 11:30, and 13:00 in the configured timezone |
| Microsoft Forms/Graph | Custom tool required | Retrieve form metadata and current-day responses, including employee ID, WFO selection, reason, and submission timestamp |

Direct Microsoft Forms response access is not currently available among the connected tools. Before implementation, add it from the message composer using `+` → `Add custom tool`.

Because Microsoft Forms is a managed Microsoft OAuth integration, configure an ACI custom app with the permitted Microsoft Graph or Forms operations required to read the organization’s form responses. If the organization exposes its own wrapper API instead, add it as a custom tool using its OpenAPI schema.

The custom tool should provide, at minimum:

- Read one form by configured identifier.
- Retrieve responses for a specified date or time range.
- Return response ID and submission timestamp.
- Return answers mapped to stable question identifiers.
- Support pagination for at least 500 employees.
- Use read-only permissions.

## 6. UI/UX Specification

Use a calm, enterprise dashboard with compact information density, crisp borders, restrained indigo accents, and clear success, warning, and failure states. Include an app-owned light/dark toggle.

### Login + Sign Up

The first screen presents company email/password login and sign-up. It explains that access is restricted to authorized HR and administrators. Sign-up includes name, company email, password, and confirmation. Unapproved accounts remain pending.

### Operations Dashboard

The default authenticated screen shows today’s date, automation health, next run, source connection status, and four primary metrics: expected, submitted, defaulters, and scheduled-day exceptions. A timeline displays the four schedule slots and delivery results. The current defaulter preview excludes reasons. Prominent actions include `Run now`, `Review defaulters`, and `Open latest report`.

### Run Detail

The run screen exposes the exact reconciliation state with filters for classification, lead, location, and anomalies. A table shows employee ID, name, scheduled status, submission state, WFO answer, classification, and source timestamp. WFH reasons appear only for authorized HR users. A side panel explains the selected employee’s classification and source evidence.

### Reports & Audit

The reports screen lists final summaries, restricted exception files, delivery status, and historical runs. Users can filter by date and status, open the SharePoint file, inspect Teams delivery references, and review audit events. Failed runs provide a clear error, affected source, retry control, and confirmation before republishing.

## Artifacts & references

- `RTO Reconciliation Rules` skill: reusable deterministic classification and privacy rules.
- App mockup: four core screens covering authentication, daily operations, run inspection, and reports/audit.
- Microsoft Lists/SharePoint roster is the authoritative employee source.
- Microsoft Forms is the authoritative daily response source.
- Built-in PostgreSQL retains operational history and audit evidence.
- A custom Microsoft Forms/Graph tool is a prerequisite for implementation.
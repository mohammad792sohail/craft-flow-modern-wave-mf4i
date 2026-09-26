'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthProvider, LoginForm, ProtectedRoute, RegisterForm, UserMenu, useAuth } from 'lyzr-architect-pg/client'
import { Toaster, toast } from 'sonner'
import { callAIAgent } from '@/lib/aiAgent'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarClock,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  CloudOff,
  Database,
  FileCheck2,
  FileText,
  Filter,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Menu,
  Moon,
  Network,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import DashboardView from '@/app/sections/dashboard'
import RunDetailView from '@/app/sections/run-detail'
import ReportsAuditView from '@/app/sections/reports-audit'
import AdminSettingsView from '@/app/sections/admin-settings'

type View = 'today' | 'runs' | 'reports' | 'connections' | 'schedules' | 'settings'
type Row = Record<string, unknown>
type WorkspaceData = Record<string, Row[]>

type AgentKind = 'manager' | 'roster' | 'forms'

const MANAGER_AGENT_ID = '6ab78d45f594622472bb9b1c'
const ROSTER_AGENT_ID = '6ab78d10a5077621bd7b62a7'
const FORMS_AGENT_ID = '6ab78d29ba7f1107eae19d86'
const BUSINESS_DATE = '2026-09-26'
const BUSINESS_DATE_LABEL = 'Monday, 26 September 2026'

const EMPTY_DATA: WorkspaceData = {
  employees: [],
  scheduleSlots: [],
  holidays: [],
  rosterSnapshots: [],
  rosterSnapshotEntries: [],
  submissionSnapshots: [],
  submissionRecords: [],
  automationRuns: [],
  complianceResults: [],
  reminderDeliveries: [],
  exceptionReports: [],
  auditEvents: [],
  automationSettings: [],
}

const SAMPLE_DATA: WorkspaceData = {
  employees: [
    { id: 'emp-101', employee_code: 'E101', full_name: 'Anita Verma', email: 'anita.verma@company.com', department: 'Product Operations', job_title: 'Operations Analyst', manager_id: 'mgr-arun', role: 'employee', access_state: 'active', hire_date: '2022-04-18', location: 'Bengaluru' },
    { id: 'emp-102', employee_code: 'E102', full_name: 'Rahul Mehta', email: 'rahul.mehta@company.com', department: 'Product Operations', job_title: 'Operations Specialist', manager_id: 'mgr-arun', role: 'employee', access_state: 'active', hire_date: '2021-11-08', location: 'Pune' },
    { id: 'emp-103', employee_code: 'E103', full_name: 'Meera Iyer', email: 'meera.iyer@company.com', department: 'Design Systems', job_title: 'Product Designer', manager_id: 'mgr-megha', role: 'employee', access_state: 'active', hire_date: '2023-01-23', location: 'Hyderabad' },
    { id: 'emp-104', employee_code: 'E104', full_name: 'John Mathew', email: 'john.mathew@company.com', department: 'Customer Success', job_title: 'Client Partner', manager_id: 'mgr-sarah', role: 'employee', access_state: 'active', hire_date: '2020-09-14', location: 'Chennai' },
    { id: 'emp-105', employee_code: 'E105', full_name: 'Priya Nair', email: 'priya.nair@company.com', department: 'Product Operations', job_title: 'Program Manager', manager_id: 'mgr-arun', role: 'employee', access_state: 'active', hire_date: '2022-07-11', location: 'Bengaluru' },
  ],
  scheduleSlots: [
    { id: 'slot-101', employee_id: 'emp-101', day_of_week: 1, required: true, location: 'Bengaluru', effective_from: '2026-01-01', effective_to: '2026-12-31' },
    { id: 'slot-102', employee_id: 'emp-102', day_of_week: 1, required: true, location: 'Pune', effective_from: '2026-01-01', effective_to: '2026-12-31' },
    { id: 'slot-103', employee_id: 'emp-103', day_of_week: 1, required: false, location: 'Hyderabad', effective_from: '2026-01-01', effective_to: '2026-12-31' },
    { id: 'slot-104', employee_id: 'emp-104', day_of_week: 1, required: true, location: 'Chennai', effective_from: '2026-01-01', effective_to: '2026-12-31' },
    { id: 'slot-105', employee_id: 'emp-105', day_of_week: 1, required: true, location: 'Bengaluru', effective_from: '2026-01-01', effective_to: '2026-12-31' },
  ],
  holidays: [],
  rosterSnapshots: [{ id: 'roster-20260926', snapshot_date: BUSINESS_DATE, source: 'SharePoint Employee Roster', employee_count: 5, is_complete: true, raw_data: { source_reference: 'sharepoint://lists/rto-roster/20260926' } }],
  rosterSnapshotEntries: [
    { id: 'entry-101', roster_snapshot_id: 'roster-20260926', employee_id: 'emp-101', employee_code: 'E101', department: 'Product Operations', status: 'active' },
    { id: 'entry-102', roster_snapshot_id: 'roster-20260926', employee_id: 'emp-102', employee_code: 'E102', department: 'Product Operations', status: 'active' },
    { id: 'entry-103', roster_snapshot_id: 'roster-20260926', employee_id: 'emp-103', employee_code: 'E103', department: 'Design Systems', status: 'active' },
    { id: 'entry-104', roster_snapshot_id: 'roster-20260926', employee_id: 'emp-104', employee_code: 'E104', department: 'Customer Success', status: 'active' },
    { id: 'entry-105', roster_snapshot_id: 'roster-20260926', employee_id: 'emp-105', employee_code: 'E105', department: 'Product Operations', status: 'active' },
  ],
  submissionSnapshots: [{ id: 'submission-20260926', snapshot_date: BUSINESS_DATE, source: 'Illustrative response snapshot', is_complete: false, raw_data: { custom_tool_status: 'not_connected' } }],
  submissionRecords: [
    { id: 'response-101', submission_snapshot_id: 'submission-20260926', employee_id: 'emp-101', submission_date: BUSINESS_DATE, status: 'WFO_YES', wfh_reason: '', wfh_reason_hr_approved: false, location: 'Bengaluru', submitted_at: '2026-09-26T09:42:00+05:30', wfo_answer: 'Yes' },
    { id: 'response-103', submission_snapshot_id: 'submission-20260926', employee_id: 'emp-103', submission_date: BUSINESS_DATE, status: 'WFO_NO', wfh_reason: 'Manager approval', wfh_reason_hr_approved: true, location: 'Hyderabad', submitted_at: '2026-09-26T09:48:00+05:30', wfo_answer: 'No' },
    { id: 'response-104', submission_snapshot_id: 'submission-20260926', employee_id: 'emp-104', submission_date: BUSINESS_DATE, status: 'WFO_NO', wfh_reason: 'Sick', wfh_reason_hr_approved: false, location: 'Chennai', submitted_at: '2026-09-26T10:18:00+05:30', wfo_answer: 'No' },
  ],
  automationRuns: [
    { id: 'run-1000', run_type: '10:00', status: 'completed', started_at: '2026-09-26T10:00:00+05:30', completed_at: '2026-09-26T10:00:42+05:30', error_message: '', triggered_by: 'LYZR_SCHEDULER' },
    { id: 'run-1045', run_type: '10:45', status: 'completed', started_at: '2026-09-26T10:45:00+05:30', completed_at: '2026-09-26T10:45:42+05:30', error_message: '', triggered_by: 'LYZR_SCHEDULER' },
    { id: 'run-1130', run_type: '11:30', status: 'scheduled', started_at: '', completed_at: '', error_message: '', triggered_by: 'LYZR_SCHEDULER' },
    { id: 'run-1300', run_type: '13:00', status: 'scheduled', started_at: '', completed_at: '', error_message: '', triggered_by: 'LYZR_SCHEDULER' },
  ],
  complianceResults: [
    { id: 'result-101', automation_run_id: 'run-1045', employee_id: 'emp-101', period_start: BUSINESS_DATE, period_end: BUSINESS_DATE, required_days: 1, actual_days: 1, compliance_status: 'compliant', details: { lead_name: 'Arun K.', location: 'Bengaluru', scheduled_for_office: true, response_found: true, wfo_answer: 'Yes', submitted_at: '2026-09-26T09:42:00+05:30' } },
    { id: 'result-102', automation_run_id: 'run-1045', employee_id: 'emp-102', period_start: BUSINESS_DATE, period_end: BUSINESS_DATE, required_days: 1, actual_days: 0, compliance_status: 'defaulter', details: { lead_name: 'Arun K.', location: 'Pune', scheduled_for_office: true, response_found: false, wfo_answer: '', submitted_at: '' } },
    { id: 'result-103', automation_run_id: 'run-1045', employee_id: 'emp-103', period_start: BUSINESS_DATE, period_end: BUSINESS_DATE, required_days: 0, actual_days: 1, compliance_status: 'not_expected', details: { lead_name: 'Megha S.', location: 'Hyderabad', scheduled_for_office: false, response_found: true, wfo_answer: 'No', submitted_at: '2026-09-26T09:48:00+05:30' } },
    { id: 'result-104', automation_run_id: 'run-1045', employee_id: 'emp-104', period_start: BUSINESS_DATE, period_end: BUSINESS_DATE, required_days: 1, actual_days: 1, compliance_status: 'exception', details: { lead_name: 'Sarah J.', location: 'Chennai', scheduled_for_office: true, response_found: true, wfo_answer: 'No', submitted_at: '2026-09-26T10:18:00+05:30', wfh_reason: 'Sick' } },
    { id: 'result-105', automation_run_id: 'run-1045', employee_id: 'emp-105', period_start: BUSINESS_DATE, period_end: BUSINESS_DATE, required_days: 1, actual_days: 0, compliance_status: 'defaulter', details: { lead_name: 'Arun K.', location: 'Bengaluru', scheduled_for_office: true, response_found: false, wfo_answer: '', submitted_at: '' } },
  ],
  reminderDeliveries: [
    { id: 'delivery-1000', automation_run_id: 'run-1000', employee_id: '', channel: 'common_teams', delivery_key: '2026-09-26-10:00-common', status: 'sent', sent_at: '2026-09-26T10:00:45+05:30', error_message: '' },
    { id: 'delivery-1045', automation_run_id: 'run-1045', employee_id: '', channel: 'common_teams', delivery_key: '2026-09-26-10:45-common', status: 'sent', sent_at: '2026-09-26T10:45:45+05:30', error_message: '' },
  ],
  exceptionReports: [{ id: 'exception-104', employee_id: 'emp-104', automation_run_id: 'run-1045', compliance_result_id: 'result-104', reason: 'Sick', hr_approved: false, status: 'pending_review', resolved_at: '', notes: 'WFH reason is restricted to HR review.' }],
  auditEvents: [
    { id: 'audit-1', actor_employee_id: '', event_type: 'source_check', entity_type: 'roster_snapshot', entity_id: 'roster-20260926', details: { source: 'SharePoint', status: 'complete', employee_count: 5 } },
    { id: 'audit-2', actor_employee_id: '', event_type: 'reminder_delivery', entity_type: 'automation_run', entity_id: 'run-1045', details: { destination: 'Project RTO Updates', outstanding: 2, status: 'sent' } },
    { id: 'audit-3', actor_employee_id: '', event_type: 'response_anomaly', entity_type: 'submission_snapshot', entity_id: 'submission-20260926', details: { code: 'FORMS_TOOL_UNAVAILABLE', severity: 'error' } },
  ],
  automationSettings: [
    { id: 'setting-timezone', setting_key: 'business_timezone', setting_value: 'Asia/Kolkata', description: 'Configured business timezone.' },
    { id: 'setting-teams', setting_key: 'common_teams_destination', setting_value: 'Project RTO Updates', description: 'Common Teams destination for aggregate messages.' },
    { id: 'setting-hr', setting_key: 'hr_destination', setting_value: 'HR Operations', description: 'Restricted HR destination.' },
    { id: 'setting-form', setting_key: 'rto_form_url', setting_value: 'https://forms.office.com/r/rto-daily', description: 'Link included in reminder messages.' },
  ],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRows(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function stringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function booleanValue(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="mt-3 text-sm font-semibold">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="mt-3 text-base font-semibold">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="mt-4 text-lg font-bold">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

function authUserName(user: unknown) {
  if (!isRecord(user)) return 'HR operator'
  return stringValue(user.name, stringValue(user.email, 'HR operator').split('@')[0])
}

function authUserEmail(user: unknown) {
  if (!isRecord(user)) return ''
  return stringValue(user.email)
}

function statusTone(status: string) {
  const normalized = status.toLowerCase()
  if (normalized.includes('fail') || normalized.includes('block') || normalized.includes('error') || normalized.includes('exception')) return 'bad'
  if (normalized.includes('pending') || normalized.includes('warn') || normalized.includes('review') || normalized.includes('scheduled')) return 'warning'
  if (normalized.includes('sent') || normalized.includes('complete') || normalized.includes('deliver') || normalized.includes('healthy') || normalized.includes('active')) return 'good'
  return 'neutral'
}

function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: string }) {
  const classes = tone === 'good'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
    : tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
      : tone === 'bad'
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
        : 'border-border bg-muted text-muted-foreground'
  return <Badge variant="outline" className={`gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</Badge>
}

function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null
    const next = stored === 'dark' || (stored !== 'light' && document.documentElement.classList.contains('dark'))
    setDark(next)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    document.documentElement.style.colorScheme = next ? 'dark' : 'light'
    try {
      window.localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // Theme persistence is optional when storage is unavailable.
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} className="h-10 w-10 rounded-lg border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.98]">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

function AuthScreen() {
  const [loginMode, setLoginMode] = useState(true)

  return (
    <main className="min-h-screen bg-muted/30 p-4 text-foreground antialiased sm:p-6 lg:p-10">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/5 sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-14">
          <div className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full border border-primary-foreground/10" />
          <div className="absolute -bottom-24 right-8 h-72 w-72 rounded-full border border-primary-foreground/10" />
          <div className="relative flex items-center gap-3 font-semibold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-foreground text-primary"><ShieldCheck className="h-5 w-5" /></span>RTO Compliance</div>
          <div className="relative max-w-xl">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground/70">HR operations control room</p>
            <h1 className="text-balance text-5xl font-semibold tracking-[-0.045em]">Office attendance, reconciled <span className="italic text-primary-foreground/75">automatically.</span></h1>
            <p className="mt-6 max-w-lg text-pretty text-base leading-7 text-primary-foreground/75">Turn daily form responses and roster schedules into timely reminders, clear exceptions, and audit-ready reports.</p>
          </div>
          <div className="relative flex flex-wrap gap-x-5 gap-y-2 text-xs text-primary-foreground/75"><span className="flex items-center gap-2"><Check className="h-4 w-4" />HR-only access</span><span className="flex items-center gap-2"><Check className="h-4 w-4" />Traceable decisions</span><span className="flex items-center gap-2"><Check className="h-4 w-4" />Microsoft connected</span></div>
        </section>
        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden"><div className="flex items-center gap-3 font-semibold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="h-5 w-5" /></span>RTO Compliance</div></div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Secure entry</p>
            <h2 className="text-3xl font-semibold tracking-tight">{loginMode ? 'Welcome back' : 'Create an account'}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{loginMode ? 'Sign in with your approved company account.' : 'Request access with your company email. New accounts require approval.'}</p>
            <div className="mt-7 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              <Button type="button" variant={loginMode ? 'default' : 'ghost'} onClick={() => setLoginMode(true)} className="h-10 rounded-lg text-sm font-semibold active:scale-[0.98]">Log in</Button>
              <Button type="button" variant={!loginMode ? 'default' : 'ghost'} onClick={() => setLoginMode(false)} className="h-10 rounded-lg text-sm font-semibold active:scale-[0.98]">Create account</Button>
            </div>
            <div className="mt-7">{loginMode ? <LoginForm onSwitchToRegister={() => setLoginMode(false)} /> : <RegisterForm onSwitchToLogin={() => setLoginMode(true)} />}</div>
            <div className="mt-6 flex gap-3 rounded-xl border border-border bg-muted/50 p-4 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>WFH reasons and exception reports are available only to authorized HR users. Email and password authentication is required.</p></div>
          </div>
        </section>
      </div>
    </main>
  )
}

function AgentMiniStatus({ activeAgentId }: { activeAgentId: string | null }) {
  const agents: { id: string; name: string; purpose: string; blocked?: boolean }[] = [
    { id: MANAGER_AGENT_ID, name: 'RTO Compliance Manager', purpose: 'Coordinates reconciliations and publication.' },
    { id: ROSTER_AGENT_ID, name: 'Roster Reader', purpose: 'Reads active roster and rotation schedules.' },
    { id: FORMS_AGENT_ID, name: 'Forms Response Reader', purpose: 'Reads normalized daily Forms responses.', blocked: true },
  ]
  return (
    <div className="space-y-2">
      {agents.map((agent) => {
        const running = activeAgentId === agent.id
        const label = running ? 'Running' : agent.blocked ? 'Blocked' : 'Ready'
        return <div key={agent.id} className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/70"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${running ? 'animate-pulse bg-primary' : agent.blocked ? 'bg-amber-500' : 'bg-emerald-500'}`} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-foreground">{agent.name}</p><p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{agent.purpose}</p></div><span className={`shrink-0 text-[10px] font-semibold ${running ? 'text-primary' : agent.blocked ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{label}</span></div>
      })}
    </div>
  )
}

function WorkspaceShell({ view, onNavigate, children, user, activeAgentId }: { view: View; onNavigate: (next: View) => void; children: React.ReactNode; user: unknown; activeAgentId: string | null }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const viewLabels: Record<View, string> = { today: 'Today', runs: 'Runs', reports: 'Reports', connections: 'Connections', schedules: 'Schedules', settings: 'Settings' }
  const operations = [
    { id: 'today' as View, label: 'Today', icon: LayoutDashboard },
    { id: 'runs' as View, label: 'Runs', icon: ListChecks },
    { id: 'reports' as View, label: 'Reports', icon: BarChart3 },
  ]
  const admin = [
    { id: 'connections' as View, label: 'Connections', icon: Network },
    { id: 'schedules' as View, label: 'Schedules', icon: CalendarClock },
    { id: 'settings' as View, label: 'Settings', icon: Settings },
  ]
  const navigate = (next: View) => {
    onNavigate(next)
    setMobileOpen(false)
  }
  const Sidebar = () => <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[calc(100vw-1rem)] -translate-x-full flex-col overflow-y-auto bg-slate-950 px-4 py-5 text-white shadow-2xl transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:shadow-none ${mobileOpen ? 'translate-x-0' : ''}`}>
    <div className="flex items-center justify-between px-2 pb-7"><div className="flex items-center gap-3 font-semibold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-primary"><ShieldCheck className="h-5 w-5" /></span>RTO Compliance</div><Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="h-10 w-10 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"><X className="h-5 w-5" /></Button></div>
    <p className="px-3 pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Operations</p>
    <nav className="space-y-1" aria-label="Operations navigation">{operations.map((item) => { const Icon = item.icon; const active = view === item.id; return <Button key={item.id} variant="ghost" onClick={() => navigate(item.id)} className={`h-11 w-full justify-start gap-3 rounded-lg px-3 text-sm font-medium ${active ? 'bg-white/10 text-white hover:bg-white/15' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon className="h-4 w-4" />{item.label}</Button> })}</nav>
    <p className="mt-8 px-3 pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Admin</p>
    <nav className="space-y-1" aria-label="Administration navigation">{admin.map((item) => { const Icon = item.icon; const active = view === item.id; return <Button key={item.id} variant="ghost" onClick={() => navigate(item.id)} className={`h-11 w-full justify-start gap-3 rounded-lg px-3 text-sm font-medium ${active ? 'bg-white/10 text-white hover:bg-white/15' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon className="h-4 w-4" />{item.label}</Button> })}</nav>
    <div className="mt-auto border-t border-white/10 pt-5"><p className="px-2 pb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Powering agents</p><AgentMiniStatus activeAgentId={activeAgentId} /><div className="mt-4 flex items-center gap-3 border-t border-white/10 px-2 pt-4"><span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-200 text-xs font-bold text-indigo-800">{authUserName(user).slice(0, 2).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{authUserName(user)}</p><p className="truncate text-[11px] text-slate-400">{authUserEmail(user) || 'HR Administrator'}</p></div></div></div>
  </aside>

  return <div className="min-h-screen min-w-0 bg-muted/30 text-foreground antialiased"><div className="flex min-h-screen min-w-0"><div className={`fixed inset-0 z-30 bg-slate-950/50 lg:hidden ${mobileOpen ? 'block' : 'hidden'}`} onClick={() => setMobileOpen(false)} aria-hidden="true" /><Sidebar /><main className="min-w-0 flex-1"><header className="flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6"><div className="flex min-w-0 items-center gap-3"><Button variant="outline" size="icon" onClick={() => setMobileOpen(true)} className="h-10 w-10 shrink-0 rounded-lg border-border lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></Button><div className="truncate text-sm text-muted-foreground">Operations <ChevronRight className="mx-1 inline h-3.5 w-3.5" /> <span className="font-semibold text-foreground">{viewLabels[view]}</span></div></div><div className="flex shrink-0 items-center gap-2"><div className="hidden items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground xl:flex"><Activity className="h-3.5 w-3.5 text-emerald-600" />Automation service online</div><Button variant="ghost" size="icon" onClick={() => toast.info('Help center is available to approved HR operators.')} aria-label="Open help" className="h-10 w-10 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><CircleHelp className="h-4 w-4" /></Button><ThemeToggle /><UserMenu /></div></header><div className="min-w-0">{children}</div></main></div></div>
}

function OperationsApp() {
  const { user, authFetch } = useAuth()
  const [view, setView] = useState<View>('today')
  const [sampleDataEnabled, setSampleDataEnabled] = useState(true)
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData>(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [managerResult, setManagerResult] = useState<Row | null>(null)
  const [managerError, setManagerError] = useState('')
  const [sourceResults, setSourceResults] = useState<{ roster: Row | null; forms: Row | null }>({ roster: null, forms: null })
  const [sourceErrors, setSourceErrors] = useState<{ roster: string; forms: string }>({ roster: '', forms: '' })
  const [runLoading, setRunLoading] = useState(false)
  const loadedForUser = useRef<string | null>(null)

  const loadWorkspace = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const seedResponse = await authFetch('/api/seed', { method: 'POST' })
      const seedPayload: unknown = await seedResponse.json()
      if (!seedResponse.ok || !isRecord(seedPayload) || seedPayload.success !== true) throw new Error(isRecord(seedPayload) ? stringValue(seedPayload.error, 'Starter data could not be prepared.') : 'Starter data could not be prepared.')
      const readRows = async (endpoint: string) => {
        const response = await authFetch(endpoint)
        const payload: unknown = await response.json()
        if (!response.ok || !isRecord(payload) || payload.success !== true) throw new Error(isRecord(payload) ? stringValue(payload.error, `Could not load ${endpoint}.`) : `Could not load ${endpoint}.`)
        return asRows(payload.data)
      }
      const [employees, scheduleSlots, holidays, rosterSnapshots, rosterSnapshotEntries, submissionSnapshots, submissionRecords, automationRuns, complianceResults, reminderDeliveries, exceptionReports, auditEvents, automationSettings] = await Promise.all([
        readRows('/api/employees'),
        readRows('/api/schedule_slots'),
        readRows('/api/holidays'),
        readRows('/api/roster_snapshots'),
        readRows('/api/roster_snapshot_entries'),
        readRows('/api/submission_snapshots'),
        readRows('/api/submission_records'),
        readRows('/api/automation_runs'),
        readRows('/api/compliance_results'),
        readRows('/api/reminder_deliveries'),
        readRows('/api/exception_reports'),
        readRows('/api/audit_events'),
        readRows('/api/automation_settings'),
      ])
      setWorkspaceData({ employees, scheduleSlots, holidays, rosterSnapshots, rosterSnapshotEntries, submissionSnapshots, submissionRecords, automationRuns, complianceResults, reminderDeliveries, exceptionReports, auditEvents, automationSettings })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The operations data could not be loaded.'
      setLoadError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    const email = authUserEmail(user)
    if (email && loadedForUser.current !== email) {
      loadedForUser.current = email
      void loadWorkspace()
    }
  }, [user, loadWorkspace])

  const hasLiveData = useMemo(() => Object.values(workspaceData).some((rows) => rows.length > 0), [workspaceData])
  const usingSampleData = sampleDataEnabled && !hasLiveData
  const displayData = usingSampleData ? SAMPLE_DATA : workspaceData

  const persistManagerRun = async (result: Row, trigger: string) => {
    const counts = isRecord(result.counts) ? result.counts : {}
    const blocked = booleanValue(result.publication_blocked)
    try {
      const response = await authFetch('/api/automation_runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ run_type: stringValue(result.run_slot, trigger), status: blocked ? 'blocked' : 'completed', started_at: `${BUSINESS_DATE}T10:45:00+05:30`, completed_at: `${BUSINESS_DATE}T10:46:00+05:30`, error_message: blocked ? 'Publication blocked because a required source is incomplete.' : '', triggered_by: trigger === 'manual' ? authUserEmail(user) : 'LYZR_SCHEDULER' }) })
      const payload: unknown = await response.json()
      if (!response.ok || !isRecord(payload) || payload.success !== true) throw new Error(isRecord(payload) ? stringValue(payload.error, 'The run could not be saved.') : 'The run could not be saved.')
      void counts
      await loadWorkspace()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The run response was received but could not be saved.')
    }
  }

  const runManager = async (slot: 'manual' | '13:00' = 'manual') => {
    setRunLoading(true)
    setActiveAgentId(MANAGER_AGENT_ID)
    setManagerError('')
    try {
      const result = await callAIAgent(`Perform an ${slot} RTO compliance reconciliation for business date ${BUSINESS_DATE}. Coordinate the roster and daily response reads, normalize employee IDs, apply the deterministic compliance rules, and return the complete structured response contract. The Microsoft Forms/Graph custom tool is currently not connected in this workspace. Treat that source as unavailable, set source_complete to false and publication_blocked to true unless live Forms data is actually available, and never invent counts, people, deliveries, reasons, or file references. WFH reasons must never be included in common Teams content.`, MANAGER_AGENT_ID)
      if (!result.success || result.response?.status !== 'success') throw new Error(result.response?.message ?? 'The compliance manager could not complete the run.')
      const structured = result.response.result
      if (!isRecord(structured)) throw new Error('The compliance manager returned no structured reconciliation result.')
      setManagerResult(structured)
      await persistManagerRun(structured, slot)
      toast.success('Compliance manager response received.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The compliance manager could not complete the run.'
      setManagerError(message)
      toast.error(message)
    } finally {
      setActiveAgentId(null)
      setRunLoading(false)
    }
  }

  const invokeSourceAgent = async (kind: AgentKind) => {
    const agentId = kind === 'roster' ? ROSTER_AGENT_ID : FORMS_AGENT_ID
    const prompt = kind === 'roster'
      ? `Read the active SharePoint roster and rotation schedule for ${BUSINESS_DATE}. Return the complete roster response contract. Do not fabricate records if the source is unavailable.`
      : `Read Microsoft Forms responses for ${BUSINESS_DATE} using the configured read-only Microsoft Forms/Graph custom tool. That custom tool is not connected in this workspace. Return the complete response contract with source_complete false and an anomaly when the source cannot be read. Do not fabricate responses.`
    setActiveAgentId(agentId)
    setSourceErrors((previous) => ({ ...previous, [kind]: '' }))
    try {
      const result = await callAIAgent(prompt, agentId)
      if (!result.success || result.response?.status !== 'success') throw new Error(result.response?.message ?? `${kind === 'roster' ? 'Roster' : 'Forms'} reader failed.`)
      const structured = result.response.result
      if (!isRecord(structured)) throw new Error(`${kind === 'roster' ? 'Roster' : 'Forms'} reader returned no structured result.`)
      setSourceResults((previous) => ({ ...previous, [kind]: structured }))
      toast.success(`${kind === 'roster' ? 'Roster' : 'Forms'} reader response received.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : `${kind === 'roster' ? 'Roster' : 'Forms'} reader failed.`
      setSourceErrors((previous) => ({ ...previous, [kind]: message }))
      toast.error(message)
    } finally {
      setActiveAgentId(null)
    }
  }

  const saveSettings = async (settings: Record<string, string>) => {
    try {
      for (const [setting_key, setting_value] of Object.entries(settings)) {
        const response = await authFetch('/api/automation_settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ setting_key, setting_value, description: `Configured from the ${setting_key.replace(/_/g, ' ')} control.` }) })
        const payload: unknown = await response.json()
        if (!response.ok || !isRecord(payload) || payload.success !== true) throw new Error(isRecord(payload) ? stringValue(payload.error, 'A setting could not be saved.') : 'A setting could not be saved.')
      }
      await loadWorkspace()
      toast.success('Automation settings saved.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Automation settings could not be saved.'
      toast.error(message)
      throw error
    }
  }

  const addHoliday = async (holiday: { holiday_date: string; name: string; description: string }) => {
    try {
      const response = await authFetch('/api/holidays', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(holiday) })
      const payload: unknown = await response.json()
      if (!response.ok || !isRecord(payload) || payload.success !== true) throw new Error(isRecord(payload) ? stringValue(payload.error, 'Holiday could not be saved.') : 'Holiday could not be saved.')
      await loadWorkspace()
      toast.success('Holiday added to the business calendar.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Holiday could not be saved.'
      toast.error(message)
      throw error
    }
  }

  return <WorkspaceShell view={view} onNavigate={setView} user={user} activeAgentId={activeAgentId}>
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
      {loadError && <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="text-sm font-semibold">Operations data is unavailable</p><p className="mt-1 text-xs leading-5">{loadError}</p></div></div><Button variant="outline" onClick={() => void loadWorkspace()} className="h-10 shrink-0 gap-2 border-red-300 bg-transparent text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/60"><RefreshCw className="h-4 w-4" />Retry load</Button></div>}
      {view === 'today' && <DashboardView data={displayData} usingSampleData={usingSampleData} loading={loading} userName={authUserName(user)} onRunNow={() => void runManager()} onReviewDefaulters={() => setView('runs')} onOpenLatestReport={() => setView('reports')} runLoading={runLoading} activeAgentId={activeAgentId} managerResult={managerResult} managerError={managerError} sourceResults={sourceResults} sourceErrors={sourceErrors} onCheckSource={invokeSourceAgent} onOpenConnections={() => setView('connections')} sampleDataEnabled={sampleDataEnabled} onSampleDataChange={setSampleDataEnabled} />}
      {view === 'runs' && <RunDetailView data={displayData} usingSampleData={usingSampleData} onExport={() => toast.success('Snapshot export prepared from the visible classifications.')} onRunNow={() => void runManager()} runLoading={runLoading} canViewSensitive={Boolean(user)} />}
      {view === 'reports' && <ReportsAuditView data={displayData} usingSampleData={usingSampleData} onGenerate={() => void runManager('13:00')} runLoading={runLoading} onRetry={() => void runManager('manual')} managerResult={managerResult} />}
      {(view === 'connections' || view === 'schedules' || view === 'settings') && <AdminSettingsView view={view} data={displayData} sourceResults={sourceResults} sourceErrors={sourceErrors} activeAgentId={activeAgentId} onCheckSource={invokeSourceAgent} onSaveSettings={saveSettings} onAddHoliday={addHoliday} usingSampleData={usingSampleData} />}
    </div>
  </WorkspaceShell>
}

export default function Page() {
  return <AuthProvider><Toaster richColors position="top-right" /><ProtectedRoute unauthenticatedFallback={<AuthScreen />}><OperationsApp /></ProtectedRoute></AuthProvider>
}

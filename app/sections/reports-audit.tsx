'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AlertCircle, CalendarDays, Check, Clock3, Download, ExternalLink, FileSpreadsheet, FileText, LockKeyhole, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

 type Row = Record<string, unknown>
 type WorkspaceData = Record<string, Row[]>

type Props = {
  data: WorkspaceData
  usingSampleData: boolean
  onGenerate: () => void
  runLoading: boolean
  onRetry: () => void
  managerResult: Row | null
}

function isRecord(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function text(value: unknown, fallback = '—') {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function count(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function Pill({ label, kind = 'neutral' }: { label: string; kind?: 'good' | 'warning' | 'bad' | 'neutral' }) {
  const styles = kind === 'good'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
    : kind === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
      : kind === 'bad'
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
        : 'border-border bg-muted text-muted-foreground'
  return <Badge variant="outline" className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles}`}>{label}</Badge>
}

function statusKind(value: string): 'good' | 'warning' | 'bad' | 'neutral' {
  const normalized = value.toLowerCase()
  if (normalized.includes('fail') || normalized.includes('block') || normalized.includes('error')) return 'bad'
  if (normalized.includes('retry') || normalized.includes('pending') || normalized.includes('review')) return 'warning'
  if (normalized.includes('deliver') || normalized.includes('sent') || normalized.includes('complete') || normalized.includes('ready')) return 'good'
  return 'neutral'
}

export default function ReportsAuditView({ data, usingSampleData, onGenerate, runLoading, onRetry, managerResult }: Props) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('September 2026')
  const [confirmingRetry, setConfirmingRetry] = useState(false)
  const reports = rows(data.exceptionReports)
  const runs = rows(data.automationRuns)
  const deliveries = rows(data.reminderDeliveries)
  const audits = rows(data.auditEvents)
  const employees = rows(data.employees)
  const submissions = rows(data.submissionRecords)
  const compliance = rows(data.complianceResults)
  const managerCounts = managerResult && isRecord(managerResult.counts) ? managerResult.counts : null
  const submitted = managerCounts ? count(managerCounts.valid_submissions) : submissions.length
  const wfo = managerCounts ? count(managerCounts.wfo_yes) : submissions.filter((item) => text(item.wfo_answer) === 'Yes').length
  const wfh = managerCounts ? count(managerCounts.wfo_no) : submissions.filter((item) => text(item.wfo_answer) === 'No').length
  const exceptions = managerCounts ? count(managerCounts.scheduled_office_exceptions) : compliance.filter((item) => text(item.compliance_status).toLowerCase() === 'exception').length
  const filteredReports = reports.filter((item) => statusFilter === 'all' || text(item.status).toLowerCase() === statusFilter)
  const reportRows = filteredReports.length > 0 ? filteredReports : reports
  const hasFinalReport = managerResult ? !Boolean(managerResult.publication_blocked) && text(managerResult.run_slot) === '13:00' : true
  const restrictedRecipient = managerResult && isRecord(managerResult.exception_report) ? text(managerResult.exception_report.recipient, 'HR Operations') : 'HR Operations'
  const reportReference = managerResult && isRecord(managerResult.exception_report) ? text(managerResult.exception_report.file_reference, 'Awaiting manager file reference') : reports.length > 0 ? 'sharepoint://RTO-Exceptions/2026-09-26.xlsx' : 'No file reference yet'

  const auditDisplay = useMemo(() => audits.length > 0 ? audits : [
    { id: 'audit-placeholder-1', event_type: 'final_report', details: { description: 'Final summary is ready for HR review.', timestamp: '1:00 PM' } },
    { id: 'audit-placeholder-2', event_type: 'source_check', details: { description: 'Roster source verified; Forms custom tool remains unavailable.', timestamp: '11:29 AM' } },
  ], [audits])

  return <section className="space-y-6">
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Operations / reports</p><h1 className="text-balance text-3xl font-semibold tracking-[-0.04em]">Reports & audit</h1><p className="mt-2 text-sm text-muted-foreground">Restricted HR files, final summaries, and delivery evidence</p></div><div className="flex flex-wrap gap-2"><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Report month" className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"><option>September 2026</option><option>August 2026</option><option>July 2026</option></select><Button onClick={onGenerate} disabled={runLoading} className="h-10 gap-2 rounded-lg px-4 font-semibold active:scale-[0.98]">{runLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}{runLoading ? 'Generating…' : 'Generate manual report'}</Button></div></div>
    {usingSampleData && <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /><span><b className="text-foreground">Sample Data</b> is displayed for this report. It includes representative delivery and audit evidence.</span></div>}
    <div className="rounded-xl bg-primary p-5 text-primary-foreground shadow-md shadow-primary/10 sm:p-6"><div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between"><div><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-foreground/15"><FileSpreadsheet className="h-4 w-4" /></span><h2 className="text-lg font-semibold">{hasFinalReport ? 'Today’s final report is ready' : 'Final report is waiting on source data'}</h2></div><p className="mt-2 max-w-xl text-xs leading-5 text-primary-foreground/75">{hasFinalReport ? `Generated at 1:00 PM from ${submitted} valid responses. Exception reasons are restricted to HR.` : 'Publication is blocked until the Forms source returns a complete current-day snapshot. No partial report is presented as final.'}</p></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{[['Submitted', submitted], ['WFO', wfo], ['WFH', wfh], ['Exceptions', exceptions]].map(([label, value]) => <div key={String(label)} className="min-w-16"><p className="font-serif text-2xl font-semibold tabular-nums">{String(value)}</p><p className="mt-1 text-[10px] text-primary-foreground/70">{label}</p></div>)}</div></div></div>
    <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <Card className="rounded-xl border-border/80 shadow-sm"><CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="text-base">Generated files</CardTitle><p className="mt-1 text-xs text-muted-foreground">Stored in restricted SharePoint</p></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Report status" className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"><option value="all">All statuses</option><option value="delivered">Delivered</option><option value="pending_review">Pending review</option><option value="failed">Failed</option></select></CardHeader><CardContent className="p-0"><div className="divide-y divide-border/70">{reportRows.length > 0 ? reportRows.map((report, index) => { const employee = employees.find((item) => text(item.id) === text(report.employee_id)); const status = text(report.status, 'pending_review'); return <div key={text(report.id, `report-${index}`)} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><FileSpreadsheet className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold">RTO Exceptions — {text(report.automation_run_id, '26 Sep 2026')}</p><p className="mt-1 text-xs text-muted-foreground">{employee ? text(employee.full_name) : 'Named exception'} · {text(report.reason, 'WFH reason restricted')} · HR restricted</p><p className="mt-1 max-w-xs truncate font-mono text-[10px] text-muted-foreground">{reportReference}</p></div></div><div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end"><Pill label={status.replace(/_/g, ' ')} kind={statusKind(status)} /><Button variant="ghost" size="icon" onClick={() => toast.info('File references open in the configured SharePoint destination.')} className="h-10 w-10 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Open restricted SharePoint file"><ExternalLink className="h-4 w-4" /></Button></div></div> }) : <div className="flex flex-col items-center gap-3 p-12 text-center"><FileText className="h-8 w-8 text-muted-foreground" /><p className="text-sm font-semibold">No generated files for this filter</p><p className="max-w-sm text-xs leading-5 text-muted-foreground">Run the final reconciliation after both source snapshots are complete to create a restricted HR file.</p><Button variant="outline" onClick={onGenerate} className="h-10 rounded-lg">Generate report</Button></div>}</div></CardContent></Card>
      <Card className="rounded-xl border-border/80 shadow-sm"><CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="text-base">Today’s audit trail</CardTitle><p className="mt-1 text-xs text-muted-foreground">All times IST · sanitized for audit</p></div><Badge variant="outline" className="w-fit rounded-full">{auditDisplay.length} events</Badge></CardHeader><CardContent className="p-5"><div className="space-y-0">{auditDisplay.map((event, index) => { const details = isRecord(event.details) ? event.details : {}; const eventType = text(event.event_type, 'audit event').replace(/_/g, ' '); const description = text(details.description, `${eventType} recorded for ${text(event.entity_type, 'workspace')}.`); const timestamp = text(details.timestamp, index === 0 ? '1:01 PM' : index === 1 ? '1:00 PM' : 'Earlier today'); return <div key={text(event.id, `audit-${index}`)} className="grid grid-cols-[14px_minmax(0,1fr)] gap-3 py-3 first:pt-0 last:pb-0"><div className="relative"><span className="absolute left-1 top-1 h-2 w-2 rounded-full bg-primary" />{index < auditDisplay.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-border" />}</div><div><p className="text-xs font-semibold capitalize">{eventType}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{timestamp} · {description}</p></div></div> })}</div></CardContent></Card>
    </div>
    <div className="grid gap-5 lg:grid-cols-3"><Card className="rounded-xl border-border/80 shadow-sm lg:col-span-2"><CardHeader className="border-b border-border/70 pb-4"><CardTitle className="text-base">Delivery evidence</CardTitle><p className="mt-1 text-xs text-muted-foreground">Outbound messages and destinations recorded from the automation run.</p></CardHeader><CardContent className="p-0"><div className="divide-y divide-border/70">{deliveries.length > 0 ? deliveries.map((delivery, index) => <div key={text(delivery.id, `delivery-${index}`)} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold">{text(delivery.channel).replace(/_/g, ' ')}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{text(delivery.delivery_key)} <span className="mx-1">·</span> {text(delivery.sent_at)}</p></div><Pill label={text(delivery.status)} kind={statusKind(text(delivery.status))} /></div>) : <p className="p-6 text-xs text-muted-foreground">No delivery evidence has been persisted yet.</p>}</div></CardContent></Card><Card className="rounded-xl border-border/80 shadow-sm"><CardHeader className="border-b border-border/70 pb-4"><CardTitle className="text-base">Privacy boundary</CardTitle></CardHeader><CardContent className="space-y-3 p-5"><div className="flex gap-3"><LockKeyhole className="h-4 w-4 shrink-0 text-primary" /><p className="text-xs leading-5 text-muted-foreground">WFH reasons are visible only in authorized HR views and restricted files.</p></div><div className="flex gap-3"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /><p className="text-xs leading-5 text-muted-foreground">Common Teams messages contain aggregate counts and defaulter names only.</p></div><div className="flex gap-3"><CalendarDays className="h-4 w-4 shrink-0 text-primary" /><p className="text-xs leading-5 text-muted-foreground">Report month: <b className="text-foreground">{dateFilter}</b>.</p></div><div className="rounded-lg border border-border bg-muted/50 p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">HR destination</p><p className="mt-1 text-xs font-semibold">{restrictedRecipient}</p><p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{reportReference}</p></div></CardContent></Card></div>
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" /><div><p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Failed runs require confirmation before republishing</p><p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-200/80">A retry creates a new clearly labeled manual run and preserves the original audit evidence.</p></div></div><Button variant="outline" onClick={() => { if (confirmingRetry) { setConfirmingRetry(false); onRetry() } else setConfirmingRetry(true) }} disabled={runLoading} className="h-10 shrink-0 border-amber-300 bg-transparent text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/50"><RefreshCw className="mr-2 h-4 w-4" />{confirmingRetry ? 'Confirm retry' : 'Retry unsuccessful step'}</Button>{confirmingRetry && <Button variant="ghost" onClick={() => setConfirmingRetry(false)} className="h-10 shrink-0 text-amber-900 hover:bg-amber-100 dark:text-amber-200">Cancel</Button>}</div>
  </section>
}

'use client'

import { toast } from 'sonner'
import { AlertCircle, AlertTriangle, Bot, ChevronRight, CloudOff, Database, FileCheck2, FileText, Loader2, RefreshCw, ShieldCheck, Users, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

type Row = Record<string, unknown>
type WorkspaceData = Record<string, Row[]>

type Props = {
  data: WorkspaceData
  usingSampleData: boolean
  loading: boolean
  userName: string
  onRunNow: () => void
  onReviewDefaulters: () => void
  onOpenLatestReport: () => void
  runLoading: boolean
  activeAgentId: string | null
  managerResult: Row | null
  managerError: string
  sourceResults: { roster: Row | null; forms: Row | null }
  sourceErrors: { roster: string; forms: string }
  onCheckSource: (kind: 'roster' | 'forms') => void
  onOpenConnections: () => void
  sampleDataEnabled: boolean
  onSampleDataChange: (enabled: boolean) => void
}

const ROSTER_AGENT_ID = '6ab78d10a5077621bd7b62a7'
const FORMS_AGENT_ID = '6ab78d29ba7f1107eae19d86'

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

function truthy(value: unknown) {
  return value === true
}

function tone(status: string) {
  const value = status.toLowerCase()
  if (value.includes('error') || value.includes('fail') || value.includes('block')) return 'bad'
  if (value.includes('warn') || value.includes('pending') || value.includes('review') || value.includes('skip')) return 'warning'
  if (value.includes('complete') || value.includes('sent') || value.includes('deliver') || value.includes('connected') || value.includes('healthy')) return 'good'
  return 'neutral'
}

function Pill({ label, kind = 'neutral' }: { label: string; kind?: string }) {
  const styles = kind === 'good'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
    : kind === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
      : kind === 'bad'
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
        : 'border-border bg-muted text-muted-foreground'
  return <Badge variant="outline" className={`gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</Badge>
}

function formatMarkdown(value: string) {
  if (!value) return null
  return <div className="space-y-1.5">{value.split('\n').map((line, index) => {
    if (line.startsWith('### ')) return <h4 key={index} className="pt-2 text-sm font-semibold">{line.slice(4)}</h4>
    if (line.startsWith('## ')) return <h3 key={index} className="pt-2 text-sm font-semibold">{line.slice(3)}</h3>
    if (line.startsWith('# ')) return <h2 key={index} className="pt-2 text-base font-bold">{line.slice(2)}</h2>
    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={index} className="ml-4 list-disc text-xs leading-5">{line.slice(2)}</li>
    if (!line.trim()) return <div key={index} className="h-1" />
    return <p key={index} className="text-xs leading-5">{line}</p>
  })}</div>
}

function Metric({ label, value, note, accent, icon: Icon }: { label: string; value: number; note: string; accent: string; icon: typeof Users }) {
  return <Card className="rounded-xl border-border/80 shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span><span className={`grid h-8 w-8 place-items-center rounded-lg ${accent}`}><Icon className="h-4 w-4" /></span></div><p className="mt-5 font-serif text-4xl font-semibold tabular-nums tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></CardContent></Card>
}

function ManagerResponseCard({ result }: { result: Row }) {
  const counts = isRecord(result.counts) ? result.counts : null
  const anomalyRows = rows(result.anomalies)
  const defaulterRows = rows(result.defaulters)
  const deliveryRows = rows(result.deliveries)
  const exceptionReport = isRecord(result.exception_report) ? result.exception_report : null
  const metadata = isRecord(result.metadata) ? result.metadata : null
  const metrics = counts ? [
    ['Expected', 'expected_employees'],
    ['Valid', 'valid_submissions'],
    ['Outstanding', 'outstanding_defaulters'],
    ['WFO yes', 'wfo_yes'],
    ['WFO no', 'wfo_no'],
    ['Exceptions', 'scheduled_office_exceptions'],
    ['Unknown', 'unknown_or_invalid_responses'],
  ] as const : []

  return <Card className="rounded-xl border-primary/20 bg-primary/[0.025] shadow-sm">
    <CardHeader className="gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div><div className="flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /><CardTitle className="text-base">Latest manager reconciliation</CardTitle></div><p className="mt-1 text-xs text-muted-foreground">Structured response from the RTO Compliance Manager. Every publication decision is source-gated.</p></div>
      <Pill label={truthy(result.publication_blocked) ? 'Publication blocked' : text(result.run_slot, 'Run received')} kind={truthy(result.publication_blocked) ? 'bad' : 'good'} />
    </CardHeader>
    <CardContent className="space-y-5 p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Meta label="Business date" value={text(result.business_date)} />
        <Meta label="Run slot" value={text(result.run_slot)} />
        <Meta label="Trigger" value={text(result.trigger)} />
        <div><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Sources complete</p><div className="mt-1"><Pill label={truthy(result.source_complete) ? 'Yes' : 'No'} kind={truthy(result.source_complete) ? 'good' : 'bad'} /></div></div>
        <div><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Publication</p><div className="mt-1"><Pill label={truthy(result.publication_blocked) ? 'Blocked' : 'Allowed'} kind={truthy(result.publication_blocked) ? 'bad' : 'good'} /></div></div>
      </div>
      {counts && <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4 lg:grid-cols-7">{metrics.map(([label, key]) => <div key={key} className="bg-background p-3"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 font-mono text-lg font-semibold tabular-nums">{count(counts[key])}</p></div>)}</div>}
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div><p className="mb-2 text-xs font-semibold">Summary message</p>{formatMarkdown(text(result.summary_message, 'No summary message returned.'))}</div>
        <div className="space-y-3 rounded-lg border border-border bg-background p-3"><Meta label="Next run" value={text(result.next_run_notice)} /><Meta label="Response contract" value="All declared fields rendered" /><div><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Publication policy</p><p className="mt-1 text-xs leading-5 text-muted-foreground">WFH reasons stay outside common Teams content.</p></div></div>
      </div>
      <div><p className="mb-2 text-xs font-semibold">Defaulters ({defaulterRows.length})</p>{defaulterRows.length > 0 ? <div className="space-y-2">{defaulterRows.map((item, index) => <div key={`${text(item.employee_id)}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-xs"><span className="font-semibold">{text(item.employee_name)}</span><span className="font-mono text-muted-foreground">{text(item.employee_id)}</span></div>)}</div> : <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">No defaulters in this manager response.</p>}</div>
      {anomalyRows.length > 0 && <div><p className="mb-2 text-xs font-semibold">Anomalies ({anomalyRows.length})</p><div className="space-y-2">{anomalyRows.map((item, index) => <div key={`${text(item.code)}-${index}`} className="flex flex-col gap-1 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs dark:border-amber-900 dark:bg-amber-950/20 sm:flex-row sm:items-start sm:justify-between"><span><span className="font-mono font-semibold">{text(item.code)}</span><span className="ml-2 text-muted-foreground">{text(item.message)}</span></span><span className="shrink-0 text-muted-foreground">{text(item.employee_id)} · {text(item.severity)}</span></div>)}</div></div>}
      <div className="grid gap-5 lg:grid-cols-2">
        <div><p className="mb-2 text-xs font-semibold">Deliveries ({deliveryRows.length})</p>{deliveryRows.length > 0 ? <div className="space-y-2">{deliveryRows.map((item, index) => <div key={`${text(item.kind)}-${index}`} className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span><span className="font-semibold">{text(item.kind)}</span><span className="ml-2 text-muted-foreground">{text(item.destination)}</span></span><span className="flex items-center gap-2"><Pill label={text(item.status)} kind={tone(text(item.status))} /><span className="max-w-36 truncate font-mono text-[10px] text-muted-foreground">{text(item.external_reference)}</span></span></div>)}</div> : <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">No delivery records returned.</p>}</div>
        <div><p className="mb-2 text-xs font-semibold">Exception report</p>{exceptionReport ? <div className="space-y-2 rounded-lg border border-border bg-background p-3 text-xs"><Fact label="Created" value={truthy(exceptionReport.created) ? 'Yes' : 'No'} /><div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Status</span><Pill label={text(exceptionReport.status)} kind={tone(text(exceptionReport.status))} /></div><Fact label="Recipient" value={text(exceptionReport.recipient)} /><Fact label="File reference" value={text(exceptionReport.file_reference)} /></div> : <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">No exception report object returned.</p>}</div>
      </div>
      {metadata && <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-3 text-[10px] text-muted-foreground"><span>Agent: <b className="text-foreground">{text(metadata.agent_name)}</b></span><span>Response timestamp: <b className="text-foreground">{text(metadata.timestamp)}</b></span></div>}
    </CardContent>
  </Card>
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-semibold">{value}</p></div>
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="max-w-[60%] break-words text-right font-semibold">{value}</span></div>
}

function SourceAgentEvidence({ kind, result }: { kind: 'roster' | 'forms'; result: Row }) {
  const metadata = isRecord(result.metadata) ? result.metadata : null
  const counts = isRecord(result.counts) ? result.counts : null
  const anomalyRows = rows(result.anomalies)
  const sourceRows = kind === 'roster' ? rows(result.employees) : rows(result.responses)
  return <Card className="rounded-xl border-border/80 shadow-sm"><CardHeader className="border-b border-border/70 pb-4"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{kind === 'roster' ? 'Roster Reader response' : 'Forms Response Reader response'}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Complete structured evidence from the {kind === 'roster' ? 'Roster Reader' : 'Forms Response Reader'} agent.</p></div><Pill label={truthy(result.source_complete) ? 'Source complete' : 'Source incomplete'} kind={truthy(result.source_complete) ? 'good' : 'warning'} /></div></CardHeader><CardContent className="space-y-5 p-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Meta label="Business date" value={text(result.business_date)} /><Meta label="Source" value={text(result.source)} /><Meta label="Source reference" value={text(result.source_reference)} /><Meta label="Retrieved at" value={text(result.retrieved_at)} /></div>{kind === 'forms' && <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-xs"><span className="font-semibold">Pagination complete</span><Pill label={truthy(result.pagination_complete) ? 'Yes' : 'No'} kind={truthy(result.pagination_complete) ? 'good' : 'warning'} /></div>}{counts && <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4"><FactMetric label={kind === 'roster' ? 'Active employees' : 'Responses received'} value={count(counts[kind === 'roster' ? 'active_employees' : 'responses_received'])} /><FactMetric label={kind === 'roster' ? 'Scheduled for office' : 'Valid responses'} value={count(counts[kind === 'roster' ? 'scheduled_for_office' : 'valid_responses'])} />{kind === 'forms' && <><FactMetric label="Malformed responses" value={count(counts.malformed_responses)} /><FactMetric label="Duplicate employees" value={count(counts.employees_with_duplicates)} /></>}</div>}{sourceRows.length > 0 && <div><p className="mb-2 text-xs font-semibold">{kind === 'roster' ? `Employees (${sourceRows.length})` : `Responses (${sourceRows.length})`}</p><div className="overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground"><tr>{kind === 'roster' ? <><th className="px-3 py-2">Employee ID</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Lead</th><th className="px-3 py-2">Location</th><th className="px-3 py-2">Rotation</th><th className="px-3 py-2">Scheduled</th><th className="px-3 py-2">Active</th></> : <><th className="px-3 py-2">Response ID</th><th className="px-3 py-2">Employee ID</th><th className="px-3 py-2">Submitted at</th><th className="px-3 py-2">WFO</th><th className="px-3 py-2">WFH reason</th><th className="px-3 py-2">Explanation</th><th className="px-3 py-2">Valid</th><th className="px-3 py-2">Latest</th></>}</tr></thead><tbody>{sourceRows.map((item, index) => kind === 'roster' ? <tr key={`${text(item.employee_id)}-${index}`} className="border-t border-border/60"><td className="px-3 py-2 font-mono">{text(item.employee_id)}</td><td className="px-3 py-2 font-semibold">{text(item.employee_name)}</td><td className="px-3 py-2">{text(item.lead_name)}</td><td className="px-3 py-2">{text(item.location)}</td><td className="px-3 py-2">{text(item.rotation_schedule)}</td><td className="px-3 py-2">{truthy(item.scheduled_for_office) ? 'Yes' : 'No'}</td><td className="px-3 py-2">{truthy(item.active) ? 'Yes' : 'No'}</td></tr> : <tr key={`${text(item.response_id)}-${index}`} className="border-t border-border/60"><td className="px-3 py-2 font-mono">{text(item.response_id)}</td><td className="px-3 py-2 font-mono">{text(item.employee_id)}</td><td className="px-3 py-2">{text(item.submitted_at)}</td><td className="px-3 py-2">{text(item.wfo_answer)}</td><td className="max-w-32 break-words px-3 py-2">{text(item.wfh_reason, '—')}</td><td className="max-w-40 break-words px-3 py-2">{text(item.wfh_explanation, '—')}</td><td className="px-3 py-2">{truthy(item.valid) ? 'Yes' : 'No'}</td><td className="px-3 py-2">{truthy(item.latest_for_employee) ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div></div>}{anomalyRows.length > 0 && <div><p className="mb-2 text-xs font-semibold">Anomalies ({anomalyRows.length})</p><div className="space-y-2">{anomalyRows.map((item, index) => <div key={`${text(item.code)}-${index}`} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs dark:border-amber-900 dark:bg-amber-950/20"><span className="font-mono font-semibold">{text(item.code)}</span><span className="ml-2 text-muted-foreground">{text(item.message)}</span><span className="ml-2 text-muted-foreground">{text(item.employee_id)} · {text(item.severity)}</span></div>)}</div></div>}{metadata && <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-3 text-[10px] text-muted-foreground"><span>Agent: <b className="text-foreground">{text(metadata.agent_name)}</b></span><span>Response timestamp: <b className="text-foreground">{text(metadata.timestamp)}</b></span></div>}</CardContent></Card>
}

function FactMetric({ label, value }: { label: string; value: number }) {
  return <div className="bg-background p-3"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</p></div>
}

function SourceRow({ label, detail, status, statusKind, icon: Icon, onCheck, disabled, error }: { label: string; detail: string; status: string; statusKind: string; icon: typeof Database; onCheck: () => void; disabled?: boolean; error?: string }) {
  return <div className="flex flex-col gap-3 border-b border-border/70 py-4 last:border-0 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="text-sm font-semibold">{label}</p><p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{detail}</p>{error && <p className="mt-1 text-xs text-red-700 dark:text-red-300">{error}</p>}</div></div><div className="flex shrink-0 items-center gap-2 sm:pl-3"><Pill label={status} kind={statusKind} /><Button variant="ghost" size="icon" disabled={disabled} onClick={onCheck} aria-label={`Check ${label}`} className="h-10 w-10 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"><RefreshCw className="h-4 w-4" /></Button></div></div>
}

export default function DashboardView({ data, usingSampleData, loading, userName, onRunNow, onReviewDefaulters, onOpenLatestReport, runLoading, activeAgentId, managerResult, managerError, sourceResults, sourceErrors, onCheckSource, onOpenConnections, sampleDataEnabled, onSampleDataChange }: Props) {
  const employeeRows = rows(data.employees)
  const runRows = rows(data.automationRuns)
  const complianceRows = rows(data.complianceResults)
  const responseRows = rows(data.submissionRecords)
  const activeCount = employeeRows.filter((employee) => text(employee.access_state).toLowerCase() === 'active').length
  const expected = managerResult && isRecord(managerResult.counts) ? count(managerResult.counts.expected_employees) : activeCount
  const submitted = managerResult && isRecord(managerResult.counts) ? count(managerResult.counts.valid_submissions) : responseRows.length
  const defaulters = managerResult && isRecord(managerResult.counts) ? count(managerResult.counts.outstanding_defaulters) : complianceRows.filter((item) => text(item.compliance_status).toLowerCase() === 'defaulter').length
  const exceptions = managerResult && isRecord(managerResult.counts) ? count(managerResult.counts.scheduled_office_exceptions) : complianceRows.filter((item) => text(item.compliance_status).toLowerCase() === 'exception').length
  const rosterComplete = rows(data.rosterSnapshots).some((item) => truthy(item.is_complete)) || Boolean(sourceResults.roster && truthy(sourceResults.roster.source_complete))
  const formsBlocked = !sourceResults.forms || !truthy(sourceResults.forms.source_complete)
  const slots = ['10:00', '10:45', '11:30', '13:00']
  const hasData = employeeRows.length > 0 || runRows.length > 0 || managerResult !== null

  return <section className="space-y-6">
    <div className="flex flex-col gap-5 border-b border-border pb-6 xl:flex-row xl:items-end xl:justify-between"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Operations control room</p><h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Good morning, {userName.split(' ')[0] || 'operator'}</h1><p className="mt-2 text-sm text-muted-foreground">Monday, 26 September 2026 <span className="mx-2 text-border">·</span> India Standard Time <span className="mx-2 text-border">·</span> Next run at 11:30 AM</p></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5"><Switch checked={sampleDataEnabled} onCheckedChange={onSampleDataChange} id="sample-data" /><label htmlFor="sample-data" className="cursor-pointer text-xs font-semibold">Sample Data</label></div><Button variant="outline" onClick={onReviewDefaulters} className="h-11 gap-2 rounded-lg border-border px-4 font-semibold active:scale-[0.98]"><Users className="h-4 w-4" />Review defaulters</Button><Button onClick={onRunNow} disabled={runLoading} className="h-11 gap-2 rounded-lg px-4 font-semibold shadow-sm active:scale-[0.98]">{runLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}{runLoading ? 'Running manager…' : 'Run now'}</Button></div></div>
    {usingSampleData && <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p><span className="font-semibold text-foreground">Illustrative workspace data is on.</span> You can inspect the complete daily workflow. Turning Sample Data off reveals the connected database state; it never hides real records.</p></div>}
    {!sampleDataEnabled && !hasData && <Card className="rounded-xl border-dashed shadow-sm"><CardContent className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center"><Database className="h-8 w-8 text-muted-foreground" /><div><h2 className="font-semibold">No operational records yet</h2><p className="mt-1 text-sm text-muted-foreground">Run a source check or start a reconciliation to populate this workspace from PostgreSQL.</p></div><Button variant="outline" onClick={onOpenConnections} className="h-10 shrink-0 rounded-lg sm:ml-auto">Open connections</Button></CardContent></Card>}
    {managerError && <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="text-sm font-semibold">Manager run failed</p><p className="mt-1 text-xs leading-5">{managerError}</p></div></div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Expected" value={expected} note={expected ? 'Active employees in scope' : 'Waiting for roster'} accent="bg-muted text-muted-foreground" icon={Users} /><Metric label="Submitted" value={submitted} note={expected ? `${Math.round((submitted / Math.max(expected, 1)) * 100)}% response rate` : 'No responses yet'} accent="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" icon={FileCheck2} /><Metric label="Defaulters" value={defaulters} note={defaulters ? 'Needs reminder review' : 'No outstanding submissions'} accent="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" icon={AlertTriangle} /><Metric label="RTO exceptions" value={exceptions} note="Scheduled day, WFO = No" accent="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" icon={ShieldCheck} /></div>
    <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]"><Card className="rounded-xl border-border/80 shadow-sm"><CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="text-base">Today’s automation</CardTitle><p className="mt-1 text-xs text-muted-foreground">Fresh reconciliation at every slot</p></div><Pill label={formsBlocked ? 'Needs source setup' : 'Healthy'} kind={formsBlocked ? 'warning' : 'good'} /></CardHeader><CardContent className="p-5">{loading && !usingSampleData ? <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading today's automation…</div> : <div className="space-y-1">{slots.map((slot, index) => { const run = runRows.find((item) => text(item.run_type) === slot); const status = text(run?.status, index < 2 ? 'completed' : 'scheduled'); const completed = status === 'completed'; const blocked = status === 'blocked' || (slot === '13:00' && formsBlocked); const label = slot === '10:00' ? 'First reminder posted' : slot === '10:45' ? 'Updated reminder posted' : slot === '11:30' ? 'Final reminder' : 'Summary & HR exception report'; const note = slot === '10:00' ? `${Math.max(defaulters + 3, defaulters)} outstanding · Teams delivery confirmed` : slot === '10:45' ? `${defaulters} outstanding · fresh reconciliation` : slot === '11:30' ? 'Starts at the next scheduled slot' : blocked ? 'Waiting for Microsoft Forms/Graph custom tool' : 'Aggregate Teams post + restricted file'; return <div key={slot} className="grid grid-cols-[52px_18px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 py-4 last:border-0"><span className="font-mono text-xs font-semibold text-muted-foreground">{slot}</span><span className={`h-2.5 w-2.5 rounded-full ${blocked ? 'bg-amber-500' : completed ? 'bg-emerald-500' : index === 2 ? 'bg-primary' : 'bg-muted-foreground/30'}`} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{label}</p><p className="mt-1 truncate text-xs text-muted-foreground">{note}</p></div><Pill label={blocked ? 'Blocked' : completed ? 'Delivered' : index === 2 ? 'Next' : 'Pending'} kind={blocked ? 'warning' : completed ? 'good' : 'neutral'} /></div> })}</div>}</CardContent></Card><Card className="rounded-xl border-border/80 shadow-sm"><CardHeader className="border-b border-border/70 pb-4"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">Connected sources</CardTitle><p className="mt-1 text-xs text-muted-foreground">Source completeness gates publication</p></div><Button variant="ghost" size="icon" onClick={onOpenConnections} className="h-10 w-10 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Open connection settings"><ChevronRight className="h-4 w-4" /></Button></div></CardHeader><CardContent className="px-5 pb-5"><SourceRow label="Employee roster" detail={rosterComplete ? `SharePoint List · ${activeCount || 5} active` : 'SharePoint source has not been checked'} status={rosterComplete ? 'Connected' : 'Needs check'} statusKind={rosterComplete ? 'good' : 'warning'} icon={Database} onCheck={() => onCheckSource('roster')} disabled={activeAgentId === ROSTER_AGENT_ID} error={sourceErrors.roster} /><SourceRow label="RTO responses" detail={formsBlocked ? 'Microsoft Forms · custom Graph tool not connected' : `Microsoft Forms · ${submitted} valid`} status={formsBlocked ? 'Custom tool missing' : 'Connected'} statusKind={formsBlocked ? 'warning' : 'good'} icon={CloudOff} onCheck={() => onCheckSource('forms')} disabled={activeAgentId === FORMS_AGENT_ID} error={sourceErrors.forms} /><SourceRow label="Common Teams group" detail="Project RTO Updates · aggregate content only" status="Connected" statusKind="good" icon={Bot} onCheck={() => toast.info('Teams delivery is managed by the compliance manager.')} /><SourceRow label="HR restricted folder" detail="SharePoint · RTO Exceptions" status="Configured" statusKind="good" icon={FileText} onCheck={onOpenLatestReport} /></CardContent></Card></div>
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" /><div><p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{formsBlocked ? 'Microsoft Forms custom tool is not connected' : 'Responses need HR review'}</p><p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-200/80">{formsBlocked ? 'Manager publication remains blocked until a read-only Microsoft Graph/Forms tool returns complete current-day responses. No response counts or WFH reasons are inferred.' : 'Review unknown employee IDs and incomplete WFH reasons before publication.'}</p></div></div><Button variant="outline" onClick={onOpenConnections} className="h-10 shrink-0 border-amber-300 bg-transparent text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/50">Review source setup</Button></div>
    {sourceResults.roster && <SourceAgentEvidence kind="roster" result={sourceResults.roster} />}
    {sourceResults.forms && <SourceAgentEvidence kind="forms" result={sourceResults.forms} />}
    {managerResult && <ManagerResponseCard result={managerResult} />}
  </section>
}

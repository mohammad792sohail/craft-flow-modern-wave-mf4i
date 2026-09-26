'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, Check, Download, Filter, LockKeyhole, Search, ShieldCheck, UserRound, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type Row = Record<string, unknown>
type WorkspaceData = Record<string, Row[]>

type Props = {
  data: WorkspaceData
  usingSampleData: boolean
  onExport: () => void
  onRunNow: () => void
  runLoading: boolean
  canViewSensitive: boolean
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

function numberValue(value: unknown, fallback = 0) {
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
  if (normalized.includes('exception') || normalized.includes('defaulter') || normalized.includes('invalid')) return 'bad'
  if (normalized.includes('review') || normalized.includes('pending')) return 'warning'
  if (normalized.includes('compliant')) return 'good'
  return 'neutral'
}

function recordDetails(record: Row): Row {
  return isRecord(record.details) ? record.details : {}
}

export default function RunDetailView({ data, usingSampleData, onExport, onRunNow, runLoading, canViewSensitive }: Props) {
  const [query, setQuery] = useState('')
  const [classification, setClassification] = useState('all')
  const [lead, setLead] = useState('all')
  const [location, setLocation] = useState('all')
  const [selectedId, setSelectedId] = useState('')

  const employees = rows(data.employees)
  const results = rows(data.complianceResults)
  const submissions = rows(data.submissionRecords)
  const runs = rows(data.automationRuns)
  const latestRun = runs.find((run) => text(run.run_type) === '10:45') || runs.find((run) => text(run.status).toLowerCase() === 'completed') || runs[0]
  const latestRunId = text(latestRun?.id, 'run-1045')
  const latestResults = results.filter((item) => text(item.automation_run_id, latestRunId) === latestRunId)
  const resultRows = latestResults.length > 0 ? latestResults : results

  const joined = useMemo(() => resultRows.map((result) => {
    const employeeId = text(result.employee_id, '')
    const employee = employees.find((item) => text(item.id, '') === employeeId)
    const details = recordDetails(result)
    const submission = submissions.find((item) => text(item.employee_id, '') === employeeId)
    return { result, employee, details, submission }
  }), [resultRows, employees, submissions])

  const leadOptions = Array.from(new Set(joined.map((row) => text(row.details.lead_name, 'Unknown lead')).filter(Boolean)))
  const locationOptions = Array.from(new Set(joined.map((row) => text(row.employee?.location, text(row.details.location, 'Unknown location'))).filter(Boolean)))
  const filtered = joined.filter((row) => {
    const employeeId = text(row.employee?.employee_code, text(row.employee?.id, ''))
    const name = text(row.employee?.full_name, 'Unknown employee')
    const searchMatch = !query.trim() || `${employeeId} ${name}`.toLowerCase().includes(query.toLowerCase())
    const classificationMatch = classification === 'all' || text(row.result.compliance_status).toLowerCase() === classification
    const leadMatch = lead === 'all' || text(row.details.lead_name, 'Unknown lead') === lead
    const locationMatch = location === 'all' || text(row.employee?.location, text(row.details.location)) === location
    return searchMatch && classificationMatch && leadMatch && locationMatch
  })
  const selected = filtered.find((row) => text(row.employee?.id, text(row.result.employee_id)) === selectedId) || filtered[0] || joined[0]
  const selectedEmployeeName = text(selected?.employee?.full_name, 'No employee selected')
  const selectedDetails = selected ? selected.details : {}
  const selectedStatus = selected ? text(selected.result.compliance_status, 'unknown') : 'unknown'
  const selectedSubmitted = selected ? Boolean(selected.submission) || Boolean(selectedDetails.response_found) : false
  const selectedWfo = selected ? text(selected.submission?.wfo_answer, text(selectedDetails.wfo_answer, '—')) : '—'

  return <section className="space-y-6">
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Runs / 26 Sep / 10:45 AM</p><h1 className="text-balance text-3xl font-semibold tracking-[-0.04em]">10:45 AM reconciliation</h1><p className="mt-2 text-sm text-muted-foreground">Completed in 42 seconds <span className="mx-2 text-border">·</span> {employees.length || 5} roster records <span className="mx-2 text-border">·</span> {submissions.length || 0} valid responses</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={onExport} className="h-10 gap-2 rounded-lg border-border font-semibold active:scale-[0.98]"><Download className="h-4 w-4" />Export snapshot</Button><Button onClick={onRunNow} disabled={runLoading} className="h-10 rounded-lg px-4 font-semibold active:scale-[0.98]">{runLoading ? 'Running…' : 'Run now'}</Button></div></div>
    {usingSampleData && <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /><span><b className="text-foreground">Sample Data</b> is displayed for this run. Turn it off from Today to inspect live database rows.</span></div>}
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 shadow-sm lg:flex-row lg:items-center"><div className="relative min-w-0 flex-1 lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employee ID or name" className="h-10 rounded-lg border-border pl-9 pr-9" />{query && <Button variant="ghost" size="icon" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-0 top-0 h-10 w-10 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></Button>}</div><div className="flex min-w-0 flex-wrap gap-2"><label className="sr-only" htmlFor="run-classification">Classification</label><select id="run-classification" value={classification} onChange={(event) => setClassification(event.target.value)} className="h-10 min-w-36 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"><option value="all">Classification: All</option><option value="defaulter">Defaulter</option><option value="compliant">Compliant</option><option value="exception">Exception</option><option value="not_expected">Not expected</option></select><label className="sr-only" htmlFor="run-lead">Lead</label><select id="run-lead" value={lead} onChange={(event) => setLead(event.target.value)} className="h-10 min-w-32 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"><option value="all">All leads</option>{leadOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select><label className="sr-only" htmlFor="run-location">Location</label><select id="run-location" value={location} onChange={(event) => setLocation(event.target.value)} className="h-10 min-w-36 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"><option value="all">All locations</option>{locationOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className="flex items-center gap-2 text-xs text-muted-foreground lg:ml-auto"><Filter className="h-4 w-4" />{filtered.length} visible</div></div>
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
      <Card className="min-w-0 overflow-hidden rounded-xl border-border/80 shadow-sm"><CardHeader className="flex flex-col gap-2 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-base">Employee classifications</CardTitle><p className="mt-1 text-xs text-muted-foreground">Employee ID is the authoritative matching key.</p></div><Badge variant="outline" className="w-fit rounded-full">{resultRows.length} classifications</Badge></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-xs"><thead><tr className="border-b border-border bg-muted/40 text-[10px] uppercase tracking-[0.12em] text-muted-foreground"><th className="px-5 py-3 font-semibold">Employee</th><th className="px-4 py-3 font-semibold">Lead</th><th className="px-4 py-3 font-semibold">Scheduled</th><th className="px-4 py-3 font-semibold">Submitted</th><th className="px-4 py-3 font-semibold">WFO</th><th className="px-4 py-3 font-semibold">Classification</th></tr></thead><tbody>{filtered.map((row) => { const employeeId = text(row.employee?.id, text(row.result.employee_id)); const resultStatus = text(row.result.compliance_status, 'unknown'); const scheduled = row.details.scheduled_for_office === true; const submitted = Boolean(row.submission) || row.details.response_found === true; const wfo = text(row.submission?.wfo_answer, text(row.details.wfo_answer, '—')); const selectedRow = text(selected?.employee?.id, text(selected?.result.employee_id)) === employeeId; return <tr key={text(row.result.id, employeeId)} onClick={() => setSelectedId(employeeId)} className={`cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/50 ${selectedRow ? 'bg-primary/[0.06]' : ''}`}><td className="px-5 py-4"><p className="font-semibold">{text(row.employee?.full_name, 'Unknown employee')}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{text(row.employee?.employee_code, text(row.employee?.id))} · {text(row.employee?.location, text(row.details.location))}</p></td><td className="px-4 py-4 text-muted-foreground">{text(row.details.lead_name)}</td><td className="px-4 py-4">{scheduled ? <Pill label="Yes" kind="good" /> : <Pill label="No" />}</td><td className="px-4 py-4">{submitted ? <Pill label="Yes" kind="good" /> : <Pill label="No" kind="bad" />}</td><td className="px-4 py-4">{wfo === 'Yes' ? <Pill label="Yes" kind="good" /> : wfo === 'No' ? <Pill label="No" kind="warning" /> : <span className="text-muted-foreground">—</span>}</td><td className="px-4 py-4"><Pill label={resultStatus.replace(/_/g, ' ')} kind={statusKind(resultStatus)} /></td></tr> })}</tbody></table></div>{filtered.length === 0 && <div className="flex flex-col items-center justify-center gap-2 p-12 text-center"><Search className="h-7 w-7 text-muted-foreground" /><p className="text-sm font-semibold">No classifications match these filters</p><p className="text-xs text-muted-foreground">Clear the search or choose a broader classification.</p></div>}</CardContent></Card>
      <Card className="h-fit rounded-xl border-border/80 shadow-sm xl:sticky xl:top-5"><CardHeader className="border-b border-border/70 pb-4"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{selectedEmployeeName}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{selected ? `${text(selected.employee?.employee_code, text(selected.result.employee_id))} · ${text(selected.employee?.location, text(selectedDetails.location))} · ${text(selectedDetails.lead_name)}` : 'Select a row to inspect evidence'}</p></div><UserRound className="h-5 w-5 text-muted-foreground" /></div></CardHeader><CardContent className="space-y-4 p-5">{selected ? <><div className={`rounded-lg border p-4 ${statusKind(selectedStatus) === 'bad' ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/25' : 'border-primary/20 bg-primary/[0.04]'}`}><p className="text-xs font-semibold">Why is {selectedEmployeeName.split(' ')[0]} classified this way?</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{selectedStatus.toLowerCase() === 'defaulter' ? `${selectedEmployeeName} is active and expected to submit today. No valid response matching employee ID ${text(selected.employee?.employee_code, text(selected.result.employee_id))} was available at this run.` : selectedStatus.toLowerCase() === 'exception' ? `${selectedEmployeeName} submitted WFO = No on a scheduled office day. The reason is restricted to authorized HR viewers.` : selectedStatus.toLowerCase() === 'compliant' ? `${selectedEmployeeName} is active, submitted a valid response, and matched the expected office schedule.` : 'The source evidence does not indicate an expected office-day submission.'}</p></div><div className="space-y-0 divide-y divide-border/70">{[['Roster status', text(selected.employee?.access_state, 'Active')], ['Scheduled today', selectedDetails.scheduled_for_office === true ? 'Yes' : 'No'], ['Response found', selectedSubmitted ? 'Yes' : 'No'], ['Submission date', text(selected.submission?.submission_date, text(selected.result.period_start))], ['Period start', text(selected.result.period_start)], ['Period end', text(selected.result.period_end)], ['Required days', String(numberValue(selected.result.required_days))], ['Actual days', String(numberValue(selected.result.actual_days))], ['WFO answer', selectedWfo], ['Submission timestamp', text(selected.submission?.submitted_at, text(selectedDetails.submitted_at))], ['Current action', selectedStatus.toLowerCase() === 'defaulter' ? 'Included in Teams list' : 'Retained in audit evidence']].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 py-2.5 text-xs"><span className="text-muted-foreground">{label}</span><b className="max-w-[58%] break-words text-right font-medium">{value}</b></div>)}</div>{canViewSensitive && selectedWfo === 'No' && <div className="rounded-lg border border-red-200 bg-red-50/70 p-3 dark:border-red-900 dark:bg-red-950/25"><div className="flex items-center gap-2 text-xs font-semibold text-red-800 dark:text-red-200"><LockKeyhole className="h-3.5 w-3.5" />HR-restricted WFH reason</div><p className="mt-2 text-xs leading-5 text-red-800/80 dark:text-red-200/80">{text(selected.submission?.wfh_reason, text(selectedDetails.wfh_reason, 'No reason supplied'))}</p><p className="mt-1 text-[10px] text-red-800/70 dark:text-red-200/70">Explanation: {text(selected.submission?.wfh_explanation, text(selectedDetails.wfh_explanation, 'None'))}</p></div>}<div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-[11px] leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />Classification uses employee ID as the authoritative key. No attendance reason is inferred when a response is missing.</div></> : <div className="py-8 text-center text-sm text-muted-foreground">Select a classification to inspect its source evidence.</div>}</CardContent></Card>
    </div>
  </section>
}

'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, CalendarClock, Check, CloudOff, Database, ExternalLink, FileText, KeyRound, Loader2, LockKeyhole, Network, RefreshCw, Save, Settings, ShieldCheck, TimerReset, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type Row = Record<string, unknown>
type WorkspaceData = Record<string, Row[]>
type AdminView = 'connections' | 'schedules' | 'settings'

type Props = {
  view: AdminView
  data: WorkspaceData
  sourceResults: { roster: Row | null; forms: Row | null }
  sourceErrors: { roster: string; forms: string }
  activeAgentId: string | null
  onCheckSource: (kind: 'roster' | 'forms') => void
  onSaveSettings: (settings: Record<string, string>) => Promise<void>
  onAddHoliday: (holiday: { holiday_date: string; name: string; description: string }) => Promise<void>
  usingSampleData: boolean
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

function titleFor(view: AdminView) {
  if (view === 'connections') return ['Connections', 'Verify source access and publication destinations.']
  if (view === 'schedules') return ['Schedules', 'Review fixed weekday automation slots in the business timezone.']
  return ['Settings', 'Configure operational defaults without changing agent instructions.']
}

export default function AdminSettingsView({ view, data, sourceResults, sourceErrors, activeAgentId, onCheckSource, onSaveSettings, onAddHoliday, usingSampleData }: Props) {
  const [saving, setSaving] = useState(false)
  const settingsRows = rows(data.automationSettings)
  const settingValue = (key: string, fallback: string) => {
    const row = settingsRows.find((item) => text(item.setting_key) === key)
    const value = row?.setting_value
    return typeof value === 'string' ? value : fallback
  }
  const [timezone, setTimezone] = useState(() => settingValue('business_timezone', 'Asia/Kolkata'))
  const [teamsDestination, setTeamsDestination] = useState(() => settingValue('common_teams_destination', 'Project RTO Updates'))
  const [hrDestination, setHrDestination] = useState(() => settingValue('hr_destination', 'HR Operations'))
  const [formUrl, setFormUrl] = useState(() => settingValue('rto_form_url', 'https://forms.office.com/r/rto-daily'))
  const [rosterReference, setRosterReference] = useState(() => settingValue('roster_source_reference', 'sharepoint://lists/rto-roster'))
  const [retentionDays, setRetentionDays] = useState(() => settingValue('retention_days', '180'))
  const [holidayDate, setHolidayDate] = useState('')
  const [holidayName, setHolidayName] = useState('')
  const [holidayNote, setHolidayNote] = useState('')
  const [holidayMessage, setHolidayMessage] = useState('')

  const [heading, subtitle] = titleFor(view)
  const rosterComplete = sourceResults.roster ? text(sourceResults.roster.source_complete) === 'true' : rows(data.rosterSnapshots).some((item) => item.is_complete === true)
  const formsAvailable = sourceResults.forms ? sourceResults.forms.source_complete === true : false
  const holidays = rows(data.holidays)
  const schedules = rows(data.scheduleSlots)
  const sourceChecking = activeAgentId === '6ab78d10a5077621bd7b62a7' || activeAgentId === '6ab78d29ba7f1107eae19d86'

  const save = async () => {
    setSaving(true)
    try {
      await onSaveSettings({ business_timezone: timezone, common_teams_destination: teamsDestination, hr_destination: hrDestination, rto_form_url: formUrl, roster_source_reference: rosterReference, retention_days: retentionDays })
    } finally {
      setSaving(false)
    }
  }

  const addHoliday = async () => {
    if (!holidayDate || !holidayName) {
      setHolidayMessage('Add a holiday date and name before saving.')
      return
    }
    setHolidayMessage('Holiday saved to the company calendar.')
    await onAddHoliday({ holiday_date: holidayDate, name: holidayName, description: holidayNote || 'Company holiday' })
    setHolidayDate('')
    setHolidayName('')
    setHolidayNote('')
  }

  return <section className="space-y-6">
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Admin / {view}</p><h1 className="text-balance text-3xl font-semibold tracking-[-0.04em]">{heading}</h1><p className="mt-2 text-sm text-muted-foreground">{subtitle}</p></div>{view === 'settings' && <Button onClick={() => void save()} disabled={saving} className="h-10 gap-2 rounded-lg px-4 font-semibold active:scale-[0.98]">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Saving…' : 'Save settings'}</Button>}</div>
    {usingSampleData && <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /><span><b className="text-foreground">Sample Data</b> is on. Settings fields show realistic defaults; saved changes still use the database routes.</span></div>}
    {view === 'connections' && <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"><Card className="rounded-xl border-border/80 shadow-sm"><CardHeader className="border-b border-border/70 pb-4"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">Source connections</CardTitle><CardDescription className="mt-1 text-xs">A required source must be complete before the manager can publish.</CardDescription></div><Pill label={rosterComplete && formsAvailable ? 'Ready to publish' : 'Publication gated'} kind={rosterComplete && formsAvailable ? 'good' : 'warning'} /></div></CardHeader><CardContent className="space-y-1 p-5"><div className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-muted"><Database className="h-4 w-4 text-muted-foreground" /></span><div><p className="text-sm font-semibold">Employee roster</p><p className="mt-1 text-xs text-muted-foreground">SharePoint List · {rosterComplete ? 'complete snapshot available' : 'not checked'}</p>{sourceErrors.roster && <p className="mt-1 text-xs text-red-700 dark:text-red-300">{sourceErrors.roster}</p>}</div></div><div className="flex items-center gap-2"><Pill label={rosterComplete ? 'Connected' : 'Needs check'} kind={rosterComplete ? 'good' : 'warning'} /><Button variant="outline" size="icon" onClick={() => onCheckSource('roster')} disabled={sourceChecking} className="h-10 w-10 rounded-lg" aria-label="Check roster connection">{activeAgentId === '6ab78d10a5077621bd7b62a7' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button></div></div><div className="flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"><CloudOff className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Microsoft Forms / Graph</p><p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-200/80">Custom tool required · currently not connected. The app will not invent responses, counts, or WFH reasons.</p>{sourceErrors.forms && <p className="mt-1 text-xs text-red-700 dark:text-red-300">{sourceErrors.forms}</p>}</div></div><div className="flex items-center gap-2"><Pill label={formsAvailable ? 'Connected' : 'Missing tool'} kind={formsAvailable ? 'good' : 'warning'} /><Button variant="outline" size="icon" onClick={() => onCheckSource('forms')} disabled={sourceChecking} className="h-10 w-10 rounded-lg border-amber-300 bg-transparent dark:border-amber-800" aria-label="Check Forms connection">{activeAgentId === '6ab78d29ba7f1107eae19d86' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button></div></div><div className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-muted"><Network className="h-4 w-4 text-muted-foreground" /></span><div><p className="text-sm font-semibold">Microsoft Teams</p><p className="mt-1 text-xs text-muted-foreground">{teamsDestination} · aggregate content only</p></div></div><Pill label="Connected" kind="good" /></div><div className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-muted"><FileText className="h-4 w-4 text-muted-foreground" /></span><div><p className="text-sm font-semibold">HR restricted destination</p><p className="mt-1 text-xs text-muted-foreground">{hrDestination} · restricted exception files</p></div></div><Pill label="Configured" kind="good" /></div></CardContent></Card><Card className="h-fit rounded-xl border-border/80 shadow-sm"><CardHeader className="border-b border-border/70 pb-4"><CardTitle className="text-base">Source policy</CardTitle></CardHeader><CardContent className="space-y-4 p-5"><PolicyRow icon={ShieldCheck} title="No partial publication" detail="A failed or incomplete source read blocks Teams and HR delivery." /><PolicyRow icon={KeyRound} title="Read-only Forms access" detail="The missing custom tool must return response IDs, timestamps, answers, and pagination state." /><PolicyRow icon={LockKeyhole} title="Reasons stay restricted" detail="WFH reasons are never included in common-channel messages or non-HR logs." /><a href="https://learn.microsoft.com/graph/api/resources/forms-api-overview" target="_blank" rel="noreferrer" className="flex min-h-10 items-center gap-2 text-xs font-semibold text-primary hover:underline">Review Microsoft Forms API requirements <ExternalLink className="h-3.5 w-3.5" /></a></CardContent></Card></div>}
    {view === 'schedules' && <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]"><Card className="rounded-xl border-border/80 shadow-sm"><CardHeader className="border-b border-border/70 pb-4"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">Weekday automation</CardTitle><CardDescription className="mt-1 text-xs">LYZR_SCHEDULER invokes fresh reads at each fixed slot.</CardDescription></div><Pill label="Asia/Kolkata" /></div></CardHeader><CardContent className="p-5"><div className="space-y-3">{[['10:00', 'First reconciliation and Teams defaulter message', 'Expected responses + current outstanding list'], ['10:45', 'Fresh reconciliation and updated reminder', 'Excludes employees who submitted after 10:00'], ['11:30', 'Final defaulter reconciliation', 'Final reminder before the afternoon summary'], ['13:00', 'Final summary and HR exception report', 'Aggregate Teams post + restricted SharePoint file']].map(([time, title, detail]) => <div key={time} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[70px_1fr_auto] sm:items-center"><span className="font-mono text-sm font-semibold text-primary">{time}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div><Pill label={time === '13:00' && !formsAvailable ? 'Gated' : 'Enabled'} kind={time === '13:00' && !formsAvailable ? 'warning' : 'good'} /></div>)}</div></CardContent></Card><Card className="h-fit rounded-xl border-border/80 shadow-sm"><CardHeader className="border-b border-border/70 pb-4"><CardTitle className="text-base">Calendar exceptions</CardTitle><CardDescription className="mt-1 text-xs">Weekends and configured holidays are skipped.</CardDescription></CardHeader><CardContent className="space-y-3 p-5">{holidays.length > 0 ? holidays.map((holiday, index) => <div key={text(holiday.id, `holiday-${index}`)} className="rounded-lg border border-border p-3"><p className="text-sm font-semibold">{text(holiday.name)}</p><p className="mt-1 text-xs text-muted-foreground">{text(holiday.holiday_date)} · {text(holiday.description)}</p></div>) : <div className="rounded-lg bg-muted/60 p-4 text-xs leading-5 text-muted-foreground">No holidays are configured. Add company holidays from Settings before enabling production schedules.</div>}<div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/[0.04] p-4"><TimerReset className="h-4 w-4 shrink-0 text-primary" /><p className="text-xs leading-5 text-muted-foreground">Configured timezone is <b className="text-foreground">{timezone}</b>. The service does not infer time from the server timezone.</p></div></CardContent></Card></div>}
    {view === 'settings' && <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]"><Card className="rounded-xl border-border/80 shadow-sm"><CardHeader className="border-b border-border/70 pb-4"><CardTitle className="text-base">Operational defaults</CardTitle><CardDescription className="mt-1 text-xs">These values are persisted per authenticated HR workspace.</CardDescription></CardHeader><CardContent className="grid gap-5 p-5 sm:grid-cols-2"><Field label="Business timezone" value={timezone} onChange={setTimezone} placeholder="Asia/Kolkata" /><Field label="Common Teams destination" value={teamsDestination} onChange={setTeamsDestination} placeholder="Project RTO Updates" /><Field label="HR restricted destination" value={hrDestination} onChange={setHrDestination} placeholder="HR Operations" /><Field label="RTO Form URL" value={formUrl} onChange={setFormUrl} placeholder="https://forms.office.com/r/..." /><Field label="Roster source reference" value={rosterReference} onChange={setRosterReference} placeholder="sharepoint://lists/..." /><Field label="Retention duration (days)" value={retentionDays} onChange={setRetentionDays} placeholder="180" type="number" /></CardContent></Card><div className="space-y-5"><Card className="rounded-xl border-border/80 shadow-sm"><CardHeader className="border-b border-border/70 pb-4"><CardTitle className="text-base">Add company holiday</CardTitle><CardDescription className="mt-1 text-xs">Holiday entries block automated runs for that business date.</CardDescription></CardHeader><CardContent className="space-y-3 p-5"><Field label="Date" value={holidayDate} onChange={setHolidayDate} placeholder="2026-10-02" type="date" /><Field label="Holiday name" value={holidayName} onChange={setHolidayName} placeholder="Gandhi Jayanti" /><Field label="Description" value={holidayNote} onChange={setHolidayNote} placeholder="Company holiday" /><Button variant="outline" onClick={() => void addHoliday()} className="h-10 w-full gap-2 rounded-lg"><CalendarClock className="h-4 w-4" />Add holiday</Button>{holidayMessage && <p className="text-xs text-muted-foreground">{holidayMessage}</p>}</CardContent></Card><Card className="rounded-xl border-border/80 bg-muted/30 shadow-none"><CardContent className="flex gap-3 p-5"><Wrench className="h-4 w-4 shrink-0 text-primary" /><p className="text-xs leading-5 text-muted-foreground">Agent instructions remain unchanged. Settings control the application services around the hosted agents: schedules, storage, destinations, and privacy boundaries.</p></CardContent></Card></div></div>}
  </section>
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <label className="block space-y-2"><span className="text-xs font-semibold">{label}</span><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 rounded-lg border-border" /></label>
}

function PolicyRow({ icon: Icon, title, detail }: { icon: typeof ShieldCheck; title: string; detail: string }) {
  return <div className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div></div>
}

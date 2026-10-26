import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Plus,
  Sparkles, Trash2, TrendingUp, X,
} from 'lucide-react'

type ActivityStatus = 'planned' | 'completed' | 'skipped'
type ActivityCategory = 'Pleasure' | 'Mastery' | 'Both'
type ActivityPlannerProps = {
  onActivityCompleted?: () => void
}

type SkippedReason =
  | 'Low energy'
  | 'Lack of time'
  | 'Unexpected event'
  | 'Felt too difficult'
  | 'Not interested anymore'
  | 'Other'

type PlannedActivity = {
  id: string
  title: string
  date: string // local YYYY-MM-DD
  time: string
  category: ActivityCategory
  expectedPleasure: number
  expectedMastery: number
  status: ActivityStatus
  actualPleasure?: number
  actualMastery?: number
  
skippedReason?: SkippedReason
skippedNote?: string

  reflection?: string
  createdAt: string
}

const STORAGE_KEY = 'mindease-activities-v1'
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const PRESETS = [
  'Go for a walk', 'Exercise / gym', 'Meet a friend', 'Read for pleasure',
  'Work on a small task', 'Practice a hobby', 'Rest without distractions',
  'Spend time outdoors', 'Cook a meal', 'Tidy one small area',
]

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfWeek(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7))
  return result
}

function addDays(date: Date, amount: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function readActivities(): PlannedActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as PlannedActivity[] : []
  } catch {
    return []
  }
}

function shortDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function dateLabel(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function RatingInput({
  label, value, onChange,
}: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-[#6F687F]">{label}</label>
        <span className="rounded-lg bg-[#F1EAFE] px-2 py-1 text-sm font-bold text-[#7954C8]">{value}/10</span>
      </div>
      <input
        type="range" min="0" max="10" step="1" value={value}
        onChange={event => onChange(Number(event.target.value))}
        className="w-full accent-[#7954C8]"
      />
      <div className="flex justify-between text-[11px] text-[#A09AAC]">
        <span>Not at all</span><span>Very much</span>
      </div>
    </div>
  )
}

export default function ActivityPlanner({
  onActivityCompleted,
}: ActivityPlannerProps) {
    
const [skipId, setSkipId] = useState<string | null>(null)
const [skippedReason, setSkippedReason] =
  useState<SkippedReason | ''>('')
const [skippedNote, setSkippedNote] = useState('')

    const reflectionRef = useRef<HTMLFormElement | null>(null)
const [shouldScrollToReflection, setShouldScrollToReflection] = useState(false)
  const [activities, setActivities] = useState<PlannedActivity[]>(() => readActivities())
  const [weekOffset, setWeekOffset] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => localDateKey(addDays(startOfWeek(new Date()), 0)))
  const [time, setTime] = useState('17:00')
  const [category, setCategory] = useState<ActivityCategory>('Both')
  const [expectedPleasure, setExpectedPleasure] = useState(6)
  const [expectedMastery, setExpectedMastery] = useState(6)
  const [reflectionId, setReflectionId] = useState<string | null>(null)
  const [actualPleasure, setActualPleasure] = useState(6)
  const [actualMastery, setActualMastery] = useState(6)
  const [reflection, setReflection] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities))
  }, [activities])

  const weekStart = useMemo(() => addDays(startOfWeek(new Date()), weekOffset * 7), [weekOffset])
  const weekDates = useMemo(() => WEEKDAYS.map((_, index) => addDays(weekStart, index)), [weekStart])
  const weekKeys = useMemo(() => weekDates.map(localDateKey), [weekDates])
  const weekActivities = useMemo(
    () => activities.filter(item => weekKeys.includes(item.date)).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [activities, weekKeys],
  )

  const completed = weekActivities.filter(item => item.status === 'completed')
  const rated = completed.filter(item => item.actualPleasure !== undefined && item.actualMastery !== undefined)
  const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
  const avgPleasure = average(rated.map(item => item.actualPleasure as number))
  const avgMastery = average(rated.map(item => item.actualMastery as number))
  const avgExpectedPleasure = average(rated.map(item => item.expectedPleasure))
  const pleasureDifference = avgPleasure !== null && avgExpectedPleasure !== null ? avgPleasure - avgExpectedPleasure : null

  function resetForm() {
    setTitle('')
    setDate(localDateKey(startOfWeek(new Date())))
    setTime('17:00')
    setCategory('Both')
    setExpectedPleasure(6)
    setExpectedMastery(6)
    setEditingId(null)
    setShowForm(false)
  }

  function openNewForm(dateValue = localDateKey(startOfWeek(new Date()))) {
    setTitle('')
    setDate(dateValue)
    setTime('17:00')
    setCategory('Both')
    setExpectedPleasure(6)
    setExpectedMastery(6)
    setEditingId(null)
    setShowForm(true)
  }

  function saveActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return
    if (editingId) {
      setActivities(previous => previous.map(item => item.id === editingId
        ? { ...item, title: title.trim(), date, time, category, expectedPleasure, expectedMastery }
        : item))
      setNotice('Activity updated.')
    } else {
      const item: PlannedActivity = {
        id: crypto.randomUUID(),
        title: title.trim(),
        date,
        time,
        category,
        expectedPleasure,
        expectedMastery,
        status: 'planned',
        createdAt: new Date().toISOString(),
      }
      setActivities(previous => [...previous, item])
      setNotice('Activity added to your plan.')
    }
    resetForm()
  }

  function editActivity(item: PlannedActivity) {
    setTitle(item.title)
    setDate(item.date)
    setTime(item.time)
    setCategory(item.category)
    setExpectedPleasure(item.expectedPleasure)
    setExpectedMastery(item.expectedMastery)
    setEditingId(item.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openReflection(item: PlannedActivity) {
  setReflectionId(item.id)
  setActualPleasure(item.actualPleasure ?? item.expectedPleasure)
  setActualMastery(item.actualMastery ?? item.expectedMastery)
  setReflection(item.reflection ?? '')
  setShouldScrollToReflection(true)
}

  function saveReflection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reflectionId) return
    setActivities(previous => previous.map(item => item.id === reflectionId
      ? { ...item, status: 'completed', actualPleasure, actualMastery, reflection: reflection.trim() }
      : item))
      onActivityCompleted?.()
    setReflectionId(null)
    setNotice('Your activity reflection has been saved.')
  }

  
function setStatus(id: string, status: ActivityStatus) {
  if (status === 'completed') {
    const item = activities.find(activity => activity.id === id)
    if (item) openReflection(item)
    return
  }

  if (status === 'skipped') {
    const item = activities.find(activity => activity.id === id)
    if (!item) return

    setSkipId(id)
    setSkippedReason(item.skippedReason ?? '')
    setSkippedNote(item.skippedNote ?? '')
    return
  }

  setActivities(previous => previous.map(item =>
    item.id === id
      ? { ...item, status: 'planned' }
      : item
  ))
  setNotice('Activity moved back to planned.')
}

function saveSkippedReason(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault()
  if (!skipId) return

  setActivities(previous => previous.map(item =>
    item.id === skipId
      ? {
          ...item,
          status: 'skipped',
          skippedReason: skippedReason || undefined,
          skippedNote: skippedNote.trim() || undefined,
        }
      : item
  ))

  setSkipId(null)
  setSkippedReason('')
  setSkippedNote('')
  setNotice(
    'Your plan was updated. There is no right or wrong outcome.'
  )
}


  function deleteActivity(id: string) {
    if (!window.confirm('Delete this planned activity?')) return
    setActivities(previous => previous.filter(item => item.id !== id))
    setNotice('Activity deleted.')
  }

  const currentReflectionActivity = activities.find(item => item.id === reflectionId)
  
useEffect(() => {
  if (
    reflectionId &&
    shouldScrollToReflection &&
    currentReflectionActivity &&
    reflectionRef.current
  ) {
    reflectionRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })

    setShouldScrollToReflection(false)
  }
}, [
  reflectionId,
  shouldScrollToReflection,
  currentReflectionActivity,
])

  const weekLabel = `${shortDate(localDateKey(weekStart))} – ${shortDate(localDateKey(addDays(weekStart, 6)))}`

const avgExpectedMastery = average(
  rated.map(item => item.expectedMastery)
)

const masteryDifference =
  avgMastery !== null && avgExpectedMastery !== null
    ? avgMastery - avgExpectedMastery
    : null

const skippedActivities = weekActivities.filter(
  item => item.status === 'skipped'
)

const skippedReasonCounts = skippedActivities.reduce<
  Partial<Record<SkippedReason, number>>
>((counts, item) => {
  if (item.skippedReason) {
    counts[item.skippedReason] =
      (counts[item.skippedReason] ?? 0) + 1
  }
  return counts
}, {})

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-[#7954C8] via-[#9A70D5] to-[#D77DBA] p-6 text-white sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs"><Sparkles size={14} /> Behavioral activation</span>
        <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Make room for what matters.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
          Plan small, meaningful activities. Predict how they might feel, then reflect on what you actually experienced.
          There is no right score and no need to fill every day.
        </p>
        <button onClick={() => openNewForm(localDateKey(addDays(startOfWeek(new Date()), weekOffset * 7)))} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#7954C8]">
          <Plus size={17} /> Plan an activity
        </button>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#D9EDE3] bg-[#EFF9F3] px-4 py-3 text-sm text-[#347354]">
          <span className="flex items-center gap-2"><Check size={16} />{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss message"><X size={15} /></button>
        </div>
      )}

      {showForm && (
        <form onSubmit={saveActivity} className="rounded-2xl border border-[#E7DDF8] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7954C8]">{editingId ? 'Edit plan' : 'Step 1 · Plan'}</p>
              <h3 className="mt-1 text-lg font-bold">{editingId ? 'Update your activity' : 'What would you like to do?'}</h3>
            </div>
            <button type="button" onClick={resetForm} aria-label="Close form" className="rounded-lg p-2 text-[#8C859C] hover:bg-[#F7F2FF]"><X size={18} /></button>
          </div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="activity-title">Activity</label>
          <input id="activity-title" value={title} onChange={event => setTitle(event.target.value)} required maxLength={100} placeholder="e.g. Go to the gym, call a friend, study for 20 minutes" className="mb-4 w-full rounded-xl border border-[#EEEAF5] px-3 py-3 text-sm outline-none focus:border-[#B59BEA] focus:ring-2 focus:ring-[#F1EAFE]" />
          <p className="mb-2 text-xs text-[#9A93A8]">Or choose an idea</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {PRESETS.map(preset => <button key={preset} type="button" onClick={() => setTitle(preset)} className="rounded-full border border-[#E9E0F5] px-3 py-2 text-xs text-[#7954C8] hover:bg-[#F7F2FF]">{preset}</button>)}
          </div>
          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="activity-date">Day</label>
              <input id="activity-date" type="date" value={date} onChange={event => setDate(event.target.value)} required className="w-full rounded-xl border border-[#EEEAF5] px-3 py-3 text-sm" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="activity-time">Time</label>
              <input id="activity-time" type="time" value={time} onChange={event => setTime(event.target.value)} required className="w-full rounded-xl border border-[#EEEAF5] px-3 py-3 text-sm" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="activity-category">Activity focus</label>
              <select id="activity-category" value={category} onChange={event => setCategory(event.target.value as ActivityCategory)} className="w-full rounded-xl border border-[#EEEAF5] bg-white px-3 py-3 text-sm">
                <option value="Pleasure">Pleasure</option><option value="Mastery">Mastery</option><option value="Both">Both</option>
              </select>
            </div>
          </div>
          <div className="mb-5 rounded-2xl bg-[#FCFAFF] p-4">
            <p className="mb-4 text-sm font-semibold">Step 2 · Predict before you do it</p>
            <p className="mb-4 text-xs leading-5 text-[#8C859C]">These are personal ratings from 0–10, not percentages or probabilities. There are no right answers.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <RatingInput label="Expected pleasure / enjoyment" value={expectedPleasure} onChange={setExpectedPleasure} />
              <RatingInput label="Expected mastery / accomplishment" value={expectedMastery} onChange={setExpectedMastery} />
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={resetForm} className="rounded-xl border border-[#EEEAF5] px-4 py-3 text-sm font-semibold text-[#817B91]">Cancel</button>
            <button type="submit" className="rounded-xl bg-[#7954C8] px-5 py-3 text-sm font-semibold text-white hover:bg-[#6944B8]">{editingId ? 'Save changes' : 'Add to week'}</button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-[#F0ECF5] bg-white p-4 sm:p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="font-bold">Your weekly plan</h3><p className="mt-1 text-sm text-[#9A93A8]">{weekLabel}</p></div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(value => value - 1)} aria-label="Previous week" className="rounded-lg border border-[#EEEAF5] p-2 hover:bg-[#FCFAFF]"><ChevronLeft size={18} /></button>
            <button onClick={() => setWeekOffset(0)} className="rounded-lg border border-[#EEEAF5] px-3 py-2 text-xs font-medium">This week</button>
            <button onClick={() => setWeekOffset(value => value + 1)} aria-label="Next week" className="rounded-lg border border-[#EEEAF5] p-2 hover:bg-[#FCFAFF]"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="grid gap-3">
          {weekDates.map((day, index) => {
            const key = localDateKey(day)
            const dayActivities = weekActivities.filter(item => item.date === key)
            const isToday = key === localDateKey(new Date())
            return (
              <div key={key} className={`rounded-xl border p-3 sm:p-4 ${isToday ? 'border-[#C9B5EF] bg-[#FCFAFF]' : 'border-[#F0ECF5]'}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-[#7954C8]" />
                    <span className="text-sm font-semibold">{WEEKDAYS[index]}</span>
                    <span className="text-xs text-[#9A93A8]">{dateLabel(key).split(', ').slice(1).join(', ')}</span>
                    {isToday && <span className="rounded-full bg-[#F1EAFE] px-2 py-0.5 text-[10px] font-semibold text-[#7954C8]">Today</span>}
                  </div>
                  <button onClick={() => openNewForm(key)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#7954C8] hover:bg-[#F1EAFE]"><Plus size={14} /> Add</button>
                </div>
                {dayActivities.length === 0 ? <p className="py-2 text-xs text-[#A09AAC]">Nothing planned. You can leave it open or add a small activity.</p> : (
                  <div className="space-y-2">
                    {dayActivities.map(item => (
                      <div key={item.id} className="rounded-xl bg-[#FAF9FE] p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="break-words text-sm font-semibold">{item.title}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.status === 'completed' ? 'bg-[#E8F6EE] text-[#347354]' : item.status === 'skipped' ? 'bg-[#FCEAF0] text-[#A64E70]' : 'bg-[#F1EAFE] text-[#7954C8]'}`}>{item.status === 'completed' ? 'Completed' : item.status === 'skipped' ? 'Not completed' : 'Planned'}</span>
                            </div>
                            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#8C859C]"><Clock3 size={12} /> {item.time} · {item.category}</p>
                            <p className="mt-2 text-xs text-[#6F687F]">Expected: pleasure {item.expectedPleasure}/10 · mastery {item.expectedMastery}/10</p>
                            {item.status === 'completed' && item.actualPleasure !== undefined && item.actualMastery !== undefined && (
                              <div className="mt-2 rounded-lg border border-[#E9E0F5] bg-white p-2">
                                <p className="text-xs font-medium text-[#7954C8]">Actual: pleasure {item.actualPleasure}/10 · mastery {item.actualMastery}/10</p>
                                <p className="mt-1 text-xs text-[#8C859C]">Difference from prediction: pleasure {item.actualPleasure - item.expectedPleasure > 0 ? '+' : ''}{item.actualPleasure - item.expectedPleasure}, mastery {item.actualMastery - item.expectedMastery > 0 ? '+' : ''}{item.actualMastery - item.expectedMastery}</p>
                                {item.reflection && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#6F687F]">{item.reflection}</p>}
                              </div>
                            )}
                            {item.status === 'skipped' && item.skippedReason && (
  <p className="mt-2 text-xs text-[#8C859C]">
    Reason: {item.skippedReason}
    {item.skippedNote ? ` — ${item.skippedNote}` : ''}
  </p>
)}
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {item.status !== 'completed' && <button onClick={() => setStatus(item.id, 'completed')} className="rounded-lg bg-[#7954C8] px-2.5 py-2 text-xs font-semibold text-white">{item.status === 'skipped' ? 'Reflect' : 'Complete'}</button>}
                            {item.status === 'completed' && <button onClick={() => openReflection(item)} className="rounded-lg border border-[#E9E0F5] px-2.5 py-2 text-xs font-semibold text-[#7954C8]">Edit reflection</button>}
                            <button onClick={() => editActivity(item)} aria-label={`Edit ${item.title}`} className="rounded-lg border border-[#EEEAF5] p-2 text-[#817B91] hover:bg-white"><span className="sr-only">Edit</span><Sparkles size={14} /></button>
                            <button onClick={() => deleteActivity(item.id)} aria-label={`Delete ${item.title}`} className="rounded-lg p-2 text-[#B45C70] hover:bg-[#FFF0F3]"><Trash2 size={14} /></button>
                            {item.status === 'planned' && <button onClick={() => setStatus(item.id, 'skipped')} className="rounded-lg border border-[#EEEAF5] px-2 py-2 text-[11px] text-[#817B91]">Not done</button>}
                            {item.status === 'skipped' && <button onClick={() => setStatus(item.id, 'planned')} className="rounded-lg border border-[#EEEAF5] px-2 py-2 text-[11px] text-[#817B91]">Reschedule</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

 {reflectionId && currentReflectionActivity && (
  <form
    ref={reflectionRef}
    onSubmit={saveReflection}
    className="rounded-2xl border border-[#DCCCF8] bg-white p-5 shadow-sm sm:p-6 scroll-mt-6"
  >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7954C8]">Step 3 · Reflect</p>
              <h3 className="mt-1 text-lg font-bold">{currentReflectionActivity.title}</h3>
              <p className="mt-1 text-sm text-[#8C859C]">Record what happened, without judging yourself or your ratings.</p>
            </div>
            <button type="button" onClick={() => setReflectionId(null)} aria-label="Close reflection" className="rounded-lg p-2 text-[#8C859C] hover:bg-[#F7F2FF]"><X size={18} /></button>
          </div>
          <div className="mb-5 grid gap-5 sm:grid-cols-2">
            <RatingInput label="Actual pleasure / enjoyment" value={actualPleasure} onChange={setActualPleasure} />
            <RatingInput label="Actual mastery / accomplishment" value={actualMastery} onChange={setActualMastery} />
          </div>
          <div className="mb-5 rounded-xl bg-[#FCFAFF] p-3 text-sm text-[#6F687F]">
            <p className="font-semibold">Your prediction</p>
            <p className="mt-1">Pleasure {currentReflectionActivity.expectedPleasure}/10 · Mastery {currentReflectionActivity.expectedMastery}/10</p>
            <p className="mt-2 text-xs text-[#9A93A8]">Actual ratings can be higher, lower, or the same. All outcomes are useful to notice.</p>
          </div>
          <label htmlFor="activity-reflection" className="mb-2 block text-sm font-semibold">What did you notice? (optional)</label>
          <textarea id="activity-reflection" value={reflection} onChange={event => setReflection(event.target.value)} rows={3} maxLength={800} placeholder="What went well? What was different from what you expected? What might you change next time?" className="mb-4 w-full rounded-xl border border-[#EEEAF5] p-3 text-sm outline-none focus:border-[#B59BEA] focus:ring-2 focus:ring-[#F1EAFE]" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setReflectionId(null)} className="rounded-xl border border-[#EEEAF5] px-4 py-3 text-sm">Cancel</button>
            <button type="submit" className="rounded-xl bg-[#7954C8] px-5 py-3 text-sm font-semibold text-white">Save reflection</button>
          </div>
        </form>
      )}

{skipId && (
  <form
    onSubmit={saveSkippedReason}
    className="rounded-2xl border border-[#DCCCF8] bg-white p-5 shadow-sm"
  >
    <h3 className="font-bold">
      What got in the way?
    </h3>

    <p className="mt-1 mb-4 text-sm text-[#8C859C]">
      Optional. This is for understanding your needs,
      not judging yourself.
    </p>

    <label className="mb-2 block text-sm font-semibold">
      Reason
    </label>

    <select
      value={skippedReason}
      onChange={event =>
        setSkippedReason(
          event.target.value as SkippedReason | ''
        )
      }
      className="mb-4 w-full rounded-xl border border-[#EEEAF5] bg-white p-3 text-sm"
    >
      <option value="">Prefer not to say</option>
      <option value="Low energy">Low energy</option>
      <option value="Lack of time">Lack of time</option>
      <option value="Unexpected event">
        Unexpected event
      </option>
      <option value="Felt too difficult">
        Felt too difficult
      </option>
      <option value="Not interested anymore">
        Not interested anymore
      </option>
      <option value="Other">Other</option>
    </select>

    <label
      htmlFor="skipped-note"
      className="mb-2 block text-sm font-semibold"
    >
      Anything else? (optional)
    </label>

    <textarea
      id="skipped-note"
      value={skippedNote}
      onChange={event => setSkippedNote(event.target.value)}
      maxLength={300}
      rows={2}
      placeholder="Add a note if you'd like..."
      className="mb-4 w-full rounded-xl border border-[#EEEAF5] p-3 text-sm"
    />

    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={() => setSkipId(null)}
        className="rounded-xl border border-[#EEEAF5] px-4 py-3 text-sm"
      >
        Cancel
      </button>

      <button
        type="submit"
        className="rounded-xl bg-[#7954C8] px-5 py-3 text-sm font-semibold text-white"
      >
        Save
      </button>
    </div>
  </form>
)}

{skippedActivities.length > 0 && (
  <div className="mt-4 rounded-xl border border-[#F0ECF5] p-4">
    <h4 className="font-semibold">
      Understanding your barriers
    </h4>

    <p className="mt-1 text-sm text-[#8C859C]">
      {skippedActivities.length} planned
      {skippedActivities.length === 1
        ? ' activity was'
        : ' activities were'}{' '}
      not completed this week. Plans can change.
    </p>

    <div className="mt-3 space-y-2">
      {Object.entries(skippedReasonCounts).map(
        ([reason, count]) => (
          <div
            key={reason}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="text-[#6F687F]">
              {reason}
            </span>
            <span className="font-semibold">
              {count}
            </span>
          </div>
        )
      )}
    </div>

    <p className="mt-3 text-xs leading-5 text-[#8C859C]">
      You can use these patterns to adjust future
      activities to fit your time, energy and needs.
    </p>
  </div>
)}

      <section className="rounded-2xl border border-[#F0ECF5] bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1EAFE] text-[#7954C8]"><TrendingUp size={20} /></span>
          <div><h3 className="font-bold">Weekly insights</h3><p className="mt-1 text-sm text-[#9A93A8]">Based only on activities you have recorded for this week.</p></div>
        </div>
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-[#FCFAFF] p-4"><p className="text-xs text-[#8C859C]">Activities planned</p><p className="mt-2 text-2xl font-bold">{weekActivities.length}</p></div>
          <div className="rounded-xl bg-[#FCFAFF] p-4"><p className="text-xs text-[#8C859C]">Completed</p><p className="mt-2 text-2xl font-bold">{completed.length}</p><p className="mt-1 text-xs text-[#9A93A8]">{weekActivities.length ? Math.round(completed.length / weekActivities.length * 100) : 0}% of planned</p></div>
          <div className="rounded-xl bg-[#FCFAFF] p-4"><p className="text-xs text-[#8C859C]">Average pleasure</p><p className="mt-2 text-2xl font-bold">{avgPleasure === null ? '—' : `${avgPleasure.toFixed(1)}/10`}</p></div>
          <div className="rounded-xl bg-[#FCFAFF] p-4"><p className="text-xs text-[#8C859C]">Average mastery</p><p className="mt-2 text-2xl font-bold">{avgMastery === null ? '—' : `${avgMastery.toFixed(1)}/10`}</p></div>
        </div>
        {rated.length === 0 ? (
          <p className="rounded-xl bg-[#FCFAFF] p-4 text-sm leading-6 text-[#817B91]">Complete an activity and record your actual ratings to unlock prediction-versus-outcome insights. You can start with just one activity.</p>
        ) : (
         
<div className="rounded-xl bg-[#F7F2FF] p-4">
  <p className="text-sm font-semibold text-[#5F478D]">
    Prediction versus experience
  </p>

  <p className="mt-1 text-xs text-[#8C859C]">
    Average ratings across {rated.length} completed
    {rated.length === 1 ? ' activity' : ' activities'} with reflections.
  </p>

  <div className="mt-4 grid gap-3 sm:grid-cols-2">
    <div className="rounded-xl bg-white p-4">
      <p className="text-sm font-semibold">
        Pleasure / enjoyment
      </p>

      <p className="mt-3 text-sm text-[#6F687F]">
        Expected
        <span className="float-right font-semibold">
          {avgExpectedPleasure!.toFixed(1)}/10
        </span>
      </p>

      <p className="mt-2 text-sm text-[#6F687F]">
        Actual
        <span className="float-right font-semibold">
          {avgPleasure!.toFixed(1)}/10
        </span>
      </p>

      <p className="mt-3 border-t border-[#EEEAF5] pt-3 text-sm font-semibold text-[#7954C8]">
        Difference
        <span className="float-right">
          {pleasureDifference! > 0 ? '+' : ''}
          {pleasureDifference!.toFixed(1)} points
        </span>
      </p>
    </div>

    <div className="rounded-xl bg-white p-4">
      <p className="text-sm font-semibold">
        Mastery / accomplishment
      </p>

      <p className="mt-3 text-sm text-[#6F687F]">
        Expected
        <span className="float-right font-semibold">
          {avgExpectedMastery!.toFixed(1)}/10
        </span>
      </p>

      <p className="mt-2 text-sm text-[#6F687F]">
        Actual
        <span className="float-right font-semibold">
          {avgMastery!.toFixed(1)}/10
        </span>
      </p>

      <p className="mt-3 border-t border-[#EEEAF5] pt-3 text-sm font-semibold text-[#7954C8]">
        Difference
        <span className="float-right">
          {masteryDifference! > 0 ? '+' : ''}
          {masteryDifference!.toFixed(1)} points
        </span>
      </p>
    </div>
  </div>

  <p className="mt-3 text-xs leading-5 text-[#8C859C]">
    These ratings describe your own experience, not a
    clinical score. A difference is an opportunity to
    reflect, not a measure of success or failure.
  </p>
</div>

        )}
      </section>
      <p className="text-xs leading-5 text-[#9A93A8]"><ShieldNote /> Your activity plan is stored in this browser on this device. These self-guided exercises are for wellbeing reflection and are not a diagnosis or a substitute for professional care.</p>
    </section>
  )
}

function ShieldNote() {
  return <span className="inline font-semibold text-[#7954C8]">Privacy note:</span>
}

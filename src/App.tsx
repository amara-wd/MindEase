
import { useEffect, useMemo, useState,useRef } from 'react'
import ActivityPlanner from './ActivityPlanner'
import {
  Activity, ArrowLeft, ArrowRight, Brain, Check, ChevronRight,
  Clock, Heart, History, Home, Leaf, MessageCircle, Pause, Play,
  Plus, RotateCcw, Settings, ShieldCheck, Sparkles, Trash2,
  Wind, X,CalendarDays,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

type CheckIn = {
  id: string
  date: string
  stress: number
  mood: string
  factors: string[]
  reflection: string
}

// type ChatMessage = {
//   role: 'assistant' | 'user'
//   text: string
// }

const STORAGE_KEY = 'mindease-checkins-v1'
const MOODS = [
  { label: 'Very low', face: 'Low', color: '#D65391' },
  { label: 'Low', face: 'Down', color: '#C58AAB' },
  { label: 'Okay', face: 'Okay', color: '#A17BD5' },
  { label: 'Good', face: 'Good', color: '#7E9ED5' },
  { label: 'Great', face: 'Great', color: '#478B70' },
]

const FACTORS = ['Studies / work', 'Sleep', 'Relationships', 'Finances', 'Health', 'Other']
const NAV = [
  { label: 'Overview', icon: Home },
  { label: 'Check-in', icon: Heart },
  { label: 'History', icon: History },
    { label: 'Activity Planner', icon: CalendarDays },
  { label: 'Coping Toolkit', icon: Leaf },
  { label: 'AI Companion', icon: MessageCircle },
]

function readCheckIns(): CheckIn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as CheckIn[] : []
  } catch {
    return []
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function getMoodColor(mood: string) {
  return MOODS.find(item => item.label === mood)?.color ?? '#7954C8'
}

function getSuggestion(entry?: CheckIn) {
  if (!entry) {
    return {
      title: 'Start with a small check-in',
      description: 'Record how you feel today to receive a more relevant coping suggestion.',
      activity: 'Mindful breathing',
      reason: 'A gentle place to begin',
    }
  }

  if (entry.factors.includes('Sleep')) {
    return {
      title: 'Make room for rest',
      description: 'Try a short wind-down break. Dim distractions and give yourself a few quiet minutes.',
     activity: 'Mindful breathing',
      reason: 'You selected sleep as a contributing factor',
    }
  }

  if (entry.factors.includes('Studies / work')) {
    return {
      title: 'Take one thing at a time',
      description: 'Step away briefly, breathe slowly, then choose one manageable next task.',
      activity: 'Box breathing',
      reason: 'You selected studies / work',
    }
  }

  if (entry.stress >= 7) {
    return {
      title: 'Give yourself a gentle pause',
      description: 'Try a grounding exercise and notice what is around you, without judging how you feel.',
      activity: '5-4-3 grounding',
      reason: 'Based on your latest self-reported stress rating',
    }
  }

  return {
    title: 'Keep nurturing your wellbeing',
    description: 'A short reflection can help you notice what is going well and what support you need.',
    activity: 'Guided journaling',
    reason: 'A small step for today',
  }
}

function App() {
  const followUpPromptRef = useRef<HTMLDivElement | null>(null)
 const activityRef = useRef<HTMLDivElement | null>(null)
  const [page, setPage] = useState('Overview')
  const [checkIns, setCheckIns] = useState<CheckIn[]>(() => readCheckIns())
  const [stress, setStress] = useState(5)
  const [mood, setMood] = useState('Okay')
  const [factors, setFactors] = useState<string[]>([])
  const [reflection, setReflection] = useState('')
  const [notice, setNotice] = useState('')
  const [activity, setActivity] = useState('Mindful breathing')
  const [breathing, setBreathing] = useState(false)
  const [breathSeconds, setBreathSeconds] = useState(0)
  const [showFollowUpPrompt, setShowFollowUpPrompt] = useState(false)
  // const [chatInput, setChatInput] = useState('')
  // const [messages, setMessages] = useState<ChatMessage[]>([
  //   {
  //     role: 'assistant',
  //     text: 'Hi, I’m your MindEase companion. I can help you reflect on stress and explore general wellbeing activities. What has been on your mind today?',
  //   },
  // ])
const [checkInToDelete, setCheckInToDelete] = useState<string | null>(null)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkIns))
  }, [checkIns])

  useEffect(() => {
    if (!breathing) return
    const timer = window.setInterval(() => setBreathSeconds(s => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [breathing])
useEffect(() => {
  if (page !== 'Coping Toolkit') return

  const timer = window.setTimeout(() => {
    activityRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, 100)

  return () => window.clearTimeout(timer)
}, [page, activity])
  const sorted = useMemo(
    () => [...checkIns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [checkIns],
  )
  const latest = sorted[0]
  const suggestion = getSuggestion(latest)

 const now = new Date()
const weekStart = new Date(now)
weekStart.setHours(0, 0, 0, 0)
weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))

const weekEnd = new Date(weekStart)
weekEnd.setDate(weekEnd.getDate() + 7)

const thisWeekEntries = checkIns.filter(item => {
  const date = new Date(item.date)
  return date >= weekStart && date < weekEnd
})
useEffect(() => {
  if (!showFollowUpPrompt) return

  followUpPromptRef.current?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}, [showFollowUpPrompt])
const weeklyCount = thisWeekEntries.length

const weeklyAverageStress =
  thisWeekEntries.length > 0
    ? thisWeekEntries.reduce((sum, item) => sum + item.stress, 0) /
      thisWeekEntries.length
    : null

const recentEntries = sorted.slice(0, 3)
const previousEntries = sorted.slice(3, 6)

const averageStress = (entries: CheckIn[]) =>
  entries.length > 0
    ? entries.reduce((sum, item) => sum + item.stress, 0) /
      entries.length
    : null

const recentStressAverage = averageStress(recentEntries)
const previousStressAverage = averageStress(previousEntries)

const stressTrend =
  recentStressAverage === null || previousStressAverage === null
    ? 'Need 6 check-ins'
    : recentStressAverage > previousStressAverage + 0.5
      ? 'Increasing'
      : recentStressAverage < previousStressAverage - 0.5
        ? 'Decreasing'
        : 'Stable'

const factorCounts: Record<string, number> = {}

sorted.slice(0, 7).forEach(entry => {
  entry.factors.forEach(factor => {
    factorCounts[factor] = (factorCounts[factor] ?? 0) + 1
  })
})

const commonFactor =
  Object.entries(factorCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  ?? 'Not enough data'

  const chartData = useMemo(() => {
    return [...sorted].reverse().map(item => ({
      day: formatDate(item.date),
      stress: item.stress,
    }))
  }, [sorted])

  function navigate(next: string) {
    setPage(next)
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function saveCheckIn() {
    const entry: CheckIn = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      stress,
      mood,
      factors,
      reflection: reflection.trim(),
    }
    setCheckIns(previous => [entry, ...previous])
   setReflection('')
setFactors([])
navigate('Overview')
setNotice('Your check-in has been saved on this device.')
  }

 function deleteCheckIn(id: string) {
  setCheckIns(previous =>
    previous.filter(item => item.id !== id)
  )

  setNotice('Check-in deleted successfully.')
}

  function toggleFactor(factor: string) {
    setFactors(previous =>
      previous.includes(factor)
        ? previous.filter(item => item !== factor)
        : [...previous, factor],
    )
  }
  // const [isChatLoading, setIsChatLoading] = useState(false)

 
// async function sendMessage(text = chatInput) {
//   const cleaned = text.trim()
//   if (!cleaned || isChatLoading) return

//   setChatInput('')
//   setIsChatLoading(true)

//   // Add the user's message immediately.
//   setMessages(previous => [
//     ...previous,
//     { role: 'user', text: cleaned },
//   ])

//   try {
//    const controller = new AbortController()
// const timeoutId = setTimeout(() => controller.abort(), 20000)

// let response: Response

// try {
//   response = await fetch('http://127.0.0.1:8000/api/chat', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ message: cleaned }),
//     signal: controller.signal,
//   })
// } finally {
//   clearTimeout(timeoutId)
// }

//     const data = await response.json()

//     if (!response.ok) {
//       throw new Error(
//         typeof data.detail === 'string'
//           ? data.detail
//           : 'The AI service could not respond. Please try again.'
//       )
//     }

//     // Display Gemini's actual response.
//     setMessages(previous => [
//       ...previous,
//       { role: 'assistant', text: data.reply },
//     ])
//   } catch (error) {
//     console.error('MindEase chat error:', error)

//     setMessages(previous => [
//       ...previous,
//       {
//         role: 'assistant',
//         text: 'I could not connect to the AI service. Please check that the MindEase backend is running and try again.',
//       },
//     ])
//   } finally {
//     setIsChatLoading(false)
//   }
// }


  const pageTitle: Record<string, string> = {
    Overview: 'Your wellbeing overview',
    'Check-in': 'Check in with yourself',
    History: 'Your check-in history',
    'Coping Toolkit': 'Your coping toolkit',
    'AI Companion': 'Your AI companion',
    'Activity Planner': 'Plan activities that support your wellbeing',
  }
function handleActivityCompleted() {
  setShowFollowUpPrompt(true)
}
  return (
    <div className="min-h-screen bg-[#FAF9FE] text-[#29243A] md:flex">
      <aside className="border-b border-[#EEEAF5] bg-white p-4 md:fixed md:inset-y-0 md:flex md:w-[238px] md:flex-col md:border-b-0 md:border-r md:p-5">
        <button onClick={() => navigate('Overview')} className="mb-5 flex items-center gap-3 text-left md:mb-10">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7954C8] to-[#E879B9] text-white">
            <Brain size={23} />
          </span>
          <span>
            <span className="block text-xl font-bold">MindEase</span>
            <span className="block text-xs text-[#9991AB]">Your wellbeing space</span>
          </span>
        </button>

        <p className="mb-3 hidden px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#A7A0B6] md:block">Workspace</p>
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => navigate(label)}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                page === label
                  ? 'bg-[#F1EAFE] text-[#7954C8]'
                  : 'text-[#817B91] hover:bg-[#FAF8FD]'
              }`}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto hidden rounded-2xl bg-gradient-to-br from-[#F3EEFF] to-[#FDECF4] p-4 md:mt-8 md:block">
          <ShieldCheck className="mb-3 text-[#7954C8]" size={22} />
          <p className="text-sm font-semibold">Your space, your pace</p>
          <p className="mt-1 text-xs leading-5 text-[#777087]">Small steps count. There is no perfect way to feel.</p>
        </div>
        <p className="mt-4 hidden items-center gap-2 px-2 text-xs text-[#A09AAC] md:flex">
          <Settings size={14} /> MindEase prototype
        </p>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 md:ml-[238px] md:px-10 md:py-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#928BA2]">MindEase / {page}</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{pageTitle[page]}</h1>
            <p className="mt-2 text-sm text-[#8C859C]">Understand how you feel, one small step at a time.</p>
          </div>
          <button onClick={() => navigate('Check-in')} className="flex items-center gap-2 rounded-xl bg-[#7954C8] px-4 py-3 text-sm font-semibold text-white hover:bg-[#6944B8]">
            <Plus size={17} /> New check-in
          </button>
        </header>

        {notice && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#D9EDE3] bg-[#EFF9F3] px-4 py-3 text-sm text-[#347354]">
            <span className="flex items-center gap-2"><Check size={17} />{notice}</span>
            <button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16} /></button>
          </div>
        )}

        {page === 'Overview' && (
          <>
            <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-[#7954C8] via-[#9A70D5] to-[#D77DBA] p-6 text-white sm:p-8">
              <div className="pointer-events-none absolute -right-8 -top-14 h-52 w-52 rounded-full border-[32px] border-white/10" />
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs"><Sparkles size={14} /> A little care goes a long way</span>
              <h2 className="relative mt-5 max-w-xl text-2xl font-bold sm:text-3xl">Make space for how you feel.</h2>
              <p className="relative mt-3 max-w-lg text-sm leading-6 text-white/85">Check in with yourself, notice patterns over time, and find small ways to support your wellbeing.</p>
              <button onClick={() => navigate('Check-in')} className="relative mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#7954C8]">
                Check in with yourself <ArrowRight size={16} />
              </button>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Latest stress" value={latest ? `${latest.stress}/10` : '—'} detail={latest ? formatDate(latest.date) : 'No check-ins yet'} icon={<Activity size={19} />} />
              <SummaryCard label="This week" value={String(weeklyCount)} detail="Check-ins recorded" icon={<History size={19} />} />
              <SummaryCard label="Latest mood" value={latest?.mood ?? '—'} detail={latest ? 'Your latest selection' : 'Choose a mood in your first check-in'} icon={<Heart size={19} />} />
              <SummaryCard label="Total check-ins" value={String(checkIns.length)} detail="Saved on this device" icon={<Check size={19} />} />
            </section>
            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
  <SummaryCard
    label="Weekly average stress"
    value={
      weeklyAverageStress === null
        ? '—'
        : `${weeklyAverageStress.toFixed(1)}/10`
    }
    detail="Based on this week's check-ins"
    icon={<Activity size={19} />}
  />

  <SummaryCard
    label="Common stress trigger"
    value={commonFactor}
    detail="From your latest 7 check-ins"
    icon={<Brain size={19} />}
  />

  <SummaryCard
    label="Recent stress trend"
    value={stressTrend}
    detail="Comparing your last 3 with the previous 3 check-ins"
    icon={<Activity size={19} />}
  />
</section>

            <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_.8fr]">
              <div className="rounded-2xl border border-[#F0ECF5] bg-white p-5 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold">Stress trend</h2>
                    <p className="mt-1 text-sm text-[#9A93A8]">Your self-reported ratings over time</p>
                  </div>
                  <span className="rounded-lg bg-[#F1EAFE] px-2.5 py-1.5 text-xs text-[#7954C8]">Scale: 1–10</span>
                </div>
                {chartData.length === 0 ? (
                  <EmptyState text="Your stress trend will appear after you record your first check-in." action="Record a check-in" onClick={() => navigate('Check-in')} />
                ) : (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                        <defs>
                          <linearGradient id="stressFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#9A79DF" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#9A79DF" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#F0ECF5" strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="day" tick={{ fill: '#A09AAC', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fill: '#A09AAC', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #EEEAF5', fontSize: 12 }} />
                        <Area type="monotone" dataKey="stress" name="Stress level" stroke="#8B6AD4" strokeWidth={2.5} fill="url(#stressFill)" connectNulls />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#F0ECF5] bg-white p-5 sm:p-6">
                <h2 className="font-bold">Suggested next step</h2>
                <p className="mt-1 text-sm text-[#9A93A8]">{suggestion.reason}</p>
                <div className="my-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EAFE] text-[#7954C8]"><Leaf size={26} /></div>
                <h3 className="text-lg font-semibold">{suggestion.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#817B91]">{suggestion.description}</p>
             <div className="mt-5 flex flex-wrap gap-3">
  <button
    onClick={() => {
      setActivity(suggestion.activity)
      navigate('Coping Toolkit')
    }}
    className="flex items-center gap-2 rounded-xl bg-[#7954C8] px-4 py-3 text-sm font-semibold text-white hover:bg-[#6944B8]"
  >
    Try an activity <ArrowRight size={16} />
  </button>

  <button
    onClick={() => navigate('Activity Planner')}
    className="flex items-center gap-2 rounded-xl border border-[#E8E0F2] px-4 py-3 text-sm font-semibold text-[#7954C8] hover:bg-[#FCFAFF]"
  >
    <CalendarDays size={16} /> Plan an activity
  </button>
</div>
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-[#F0ECF5] bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold">Recent check-ins</h2>
                  <p className="mt-1 text-sm text-[#9A93A8]">Your three latest entries</p>
                </div>
                <button onClick={() => navigate('History')} className="text-sm font-semibold text-[#7954C8]">View history <ArrowRight className="ml-1 inline" size={15} /></button>
              </div>
              {sorted.length === 0 ? (
                <EmptyState text="No check-ins yet. Your journey starts whenever you are ready." action="Start a check-in" onClick={() => navigate('Check-in')} />
              ) : (
                <div className="divide-y divide-[#F1EDF6]">
                  {sorted.slice(0, 3).map(item => <CheckInRow key={item.id} item={item} />)}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-[#F3EEFF] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#7954C8]">Keep going at your pace</p>
                  <h2 className="mt-2 text-lg font-bold">What would help you right now?</h2>
                  <p className="mt-1 text-sm text-[#777087]">Check in, explore an activity, or put your thoughts into words.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionButton onClick={() => navigate('Check-in')}><Heart size={16} /> Check in</ActionButton>
                  <ActionButton onClick={() => navigate('Coping Toolkit')}><Leaf size={16} /> Toolkit</ActionButton>
                  <ActionButton onClick={() => navigate('AI Companion')}><MessageCircle size={16} /> Companion</ActionButton>
                </div>
              </div>
            </section>
          </>
        )}

        {page === 'Check-in' && (
          <section className="mx-auto max-w-3xl rounded-2xl border border-[#F0ECF5] bg-white p-5 sm:p-8">
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7954C8]">Step 1 · Check in</p>
              <h2 className="mt-2 text-xl font-bold">How are things feeling right now?</h2>
              <p className="mt-2 text-sm leading-6 text-[#8C859C]">There are no right or wrong answers. Record what feels true for you.</p>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="stress" className="font-semibold">Your stress level</label>
                <span className="rounded-xl bg-[#F1EAFE] px-3 py-2 text-lg font-bold text-[#7954C8]">{stress}/10</span>
              </div>
              <input id="stress" type="range" min="1" max="10" value={stress} onChange={e => setStress(Number(e.target.value))} className="mt-5 w-full accent-[#7954C8]" />
              <div className="flex justify-between text-xs text-[#9A93A8]"><span>1 · Very low</span><span>10 · Very high</span></div>
            </div>

            <div className="mb-8">
              <p className="mb-3 font-semibold">How is your mood?</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {MOODS.map(item => (
                  <button key={item.label} onClick={() => setMood(item.label)} className={`rounded-xl border p-3 text-sm transition ${mood === item.label ? 'border-[#A78AE7] bg-[#F3EEFF] ring-2 ring-[#E5D9FF]' : 'border-[#EEEAF5] hover:bg-[#FCFAFF]'}`}>
                    <span className="mx-auto mb-2 block h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-1 font-semibold">What might be affecting you?</p>
              <p className="mb-3 text-sm text-[#9A93A8]">Select any that feel relevant. This is optional.</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FACTORS.map(factor => (
                  <label key={factor} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${factors.includes(factor) ? 'border-[#BBA5EC] bg-[#F8F4FF]' : 'border-[#EEEAF5]'}`}>
                    <input type="checkbox" checked={factors.includes(factor)} onChange={() => toggleFactor(factor)} className="h-4 w-4 accent-[#7954C8]" />
                    {factor}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-7">
              <label htmlFor="reflection" className="mb-2 block font-semibold">Anything else on your mind?</label>
              <textarea id="reflection" value={reflection} onChange={e => setReflection(e.target.value)} maxLength={1000} rows={4} placeholder="Write a little about how your day has been, if you want..." className="w-full resize-y rounded-xl border border-[#EEEAF5] bg-[#FCFBFE] p-3 text-sm outline-none focus:border-[#B59BEA] focus:ring-2 focus:ring-[#F1EAFE]" />
              <p className="mt-1 text-right text-xs text-[#A09AAC]">{reflection.length}/1000</p>
            </div>

            <div className="flex flex-wrap justify-between gap-3">
              <button onClick={() => navigate('Overview')} className="rounded-xl border border-[#EEEAF5] px-4 py-3 text-sm font-semibold text-[#817B91]">Cancel</button>
              <button onClick={saveCheckIn} className="flex items-center gap-2 rounded-xl bg-[#7954C8] px-5 py-3 text-sm font-semibold text-white hover:bg-[#6944B8]"><Check size={17} /> Save check-in</button>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-[#9A93A8]"><ShieldCheck size={15} /> This prototype saves entries in this browser on this device. It does not send them to a server.</p>
          </section>
        )}

       
{page === 'History' && (
  <section className="space-y-5">
    {/* Header */}
    <div className="rounded-2xl border border-[#F0ECF5] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
         
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#817B91]">
            Look back at your moods, stress levels, and reflections.
            Every check-in is an opportunity to understand yourself better.
          </p>
        </div>

        
      </div>

      {/* Summary */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[#F7F2FF] p-4">
          <p className="text-sm text-[#817B91]">Total check-ins</p>
          <p className="mt-1 text-2xl font-bold text-[#7954C8]">
            {checkIns.length}
          </p>
        </div>

        <div className="rounded-xl bg-[#FCF2F7] p-4">
          <p className="text-sm text-[#817B91]">Latest check-in</p>
          <p className="mt-1 text-base font-semibold text-[#A64E82]">
            {sorted.length > 0
              ? formatDateTime(sorted[0].date)
              : 'No check-ins yet'}
          </p>
        </div>
      </div>
    </div>

    {/* Check-in list */}
    <div className="rounded-2xl border border-[#F0ECF5] bg-white p-5 sm:p-6">
      <div className="mb-5">
        <h3 className="font-bold text-[#29243A]">Past check-ins</h3>
        <p className="mt-1 text-sm text-[#9A93A8]">
          {sorted.length === 0
            ? 'Your saved entries will appear here.'
            : 'Your most recent check-ins appear first.'}
        </p>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          text="You haven't recorded a check-in yet. Take a moment to reflect on how you're feeling."
          action="Record your first check-in"
          onClick={() => navigate('Check-in')}
        />
      ) : (
        <div className="space-y-4">
          {sorted.map((item, index) => (
            <article
              key={item.id}
              className="rounded-2xl border border-[#F0ECF5] p-4 transition hover:border-[#DCCCF8] hover:shadow-sm sm:p-5"
            >
              {/* Date and delete */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[#49366F]">
                      {index === 0 ? 'Most recent check-in' : 'Check-in'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#9A93A8]">
                    {formatDateTime(item.date)}
                  </p>
                </div>

                <button
  onClick={() => setCheckInToDelete(item.id)}
  aria-label="Delete this check-in"
  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#B45C70] transition hover:bg-[#FFF0F3]"
>
  <Trash2 size={15} />
  Delete
</button>
              </div>

              {/* Stress and mood */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-[#F1EAFE] px-3 py-2 text-sm font-semibold text-[#7954C8]">
                  Stress: {item.stress}/10
                </span>

                <span
                  className="rounded-lg px-3 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: `${getMoodColor(item.mood)}20`,
                    color: getMoodColor(item.mood),
                  }}
                >
                  Mood: {item.mood}
                </span>
              </div>

              {/* Contributing factors */}
              {item.factors.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9A93A8]">
                    Contributing factors
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.factors.map(factor => (
                      <span
                        key={factor}
                        className="rounded-full border border-[#EAE3F2] bg-[#FCFAFF] px-3 py-1.5 text-xs text-[#6F687F]"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal reflection */}
              {item.reflection && (
                <div className="mt-4 rounded-xl bg-[#FAF8FC] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9A93A8]">
                    Your reflection
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#6F687F]">
                    {item.reflection}
                  </p>
                </div>
              )}

              {!item.reflection && item.factors.length === 0 && (
                <p className="mt-4 text-sm italic text-[#9A93A8]">
                  No additional notes or contributing factors were added.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  </section>
)}
{checkInToDelete !== null && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-[#29243A]/40 p-4 backdrop-blur-sm"
    onClick={() => setCheckInToDelete(null)}
  >
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      className="w-full max-w-md rounded-3xl border border-[#F0ECF5] bg-white p-6 shadow-xl sm:p-7"
      onClick={event => event.stopPropagation()}
    >
      {/* Icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0F3] text-[#B45C70]">
        <Trash2 size={25} />
      </div>

      {/* Message */}
      <h2
        id="delete-dialog-title"
        className="mt-5 text-xl font-bold text-[#29243A]"
      >
        Delete this check-in?
      </h2>

      <p
        id="delete-dialog-description"
        className="mt-3 text-sm leading-6 text-[#817B91]"
      >
        Are you sure you want to delete this check-in? This will permanently
        remove it from your saved history on this device. You cannot undo
        this action.
      </p>

      {/* Actions */}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={() => setCheckInToDelete(null)}
          className="rounded-xl border border-[#E8E0F2] px-5 py-3 text-sm font-semibold text-[#6F687F] transition hover:bg-[#FAF8FC]"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            deleteCheckIn(checkInToDelete)
            setCheckInToDelete(null)
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#B45C70] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9E465B]"
        >
          <Trash2 size={15} />
          Delete check-in
        </button>
      </div>
    </div>
  </div>
)}

        {page === 'Coping Toolkit' && (
          <section>
            <div className="mb-5 rounded-2xl bg-gradient-to-r from-[#F3EEFF] to-[#FDECF4] p-5 sm:p-6">
              <h2 className="text-lg font-bold">Choose a moment of care</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777087]">These simple activities may help you pause and reflect. Choose what feels comfortable, and stop if an activity makes you feel worse.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                { title: 'Mindful breathing', detail: 'A short guided breathing session.', icon: Wind, time: '2 minutes' },
                { title: 'Box breathing', detail: 'Gentle, paced breathing if comfortable.', icon: Activity, time: '2 minutes' },
                { title: '5-4-3 grounding', detail: 'Reconnect with your surroundings through your senses.', icon: Leaf, time: '3 minutes' },
                { title: 'Guided journaling', detail: 'Reflect on what you feel and what you need.', icon: Brain, time: '5 minutes' },
              ].map(item => (
                <button key={item.title} 
               onClick={() => {
  setActivity(item.title);
  setBreathSeconds(0);
  setBreathing(false);

  setTimeout(() => {
    activityRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 100);
}}
                 className={`rounded-2xl border bg-white p-5 text-left transition hover:border-[#C9B5EF] hover:shadow-sm ${activity === item.title ? 'border-[#BBA5EC] ring-1 ring-[#E5D9FF]' : 'border-[#F0ECF5]'}`}>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1EAFE] text-[#7954C8]"><item.icon size={23} /></span>
                    <span className="text-xs text-[#9A93A8]"><Clock className="mr-1 inline" size={13} />{item.time}</span>
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#817B91]">{item.detail}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#7954C8]">Open activity <ChevronRight size={16} /></span>
                </button>
              ))}
            </div>

          <div
  ref={activityRef}
  className="mt-5 scroll-mt-6 rounded-2xl border border-[#F0ECF5] bg-white p-5 sm:p-7"
>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#7954C8]">Selected activity</p>
                  <h2 className="mt-2 text-xl font-bold">{activity}</h2>
                </div>
                <button onClick={() => navigate('Overview')} className="flex items-center gap-1 text-sm text-[#817B91]"><ArrowLeft size={15} /> Dashboard</button>
              </div>
              {(activity === 'Mindful breathing' || activity === 'Box breathing' || activity === 'Mindful breathing') ? (
                <>
                  <p className="mt-4 text-sm leading-6 text-[#817B91]">Sit comfortably if you can. Breathe gently without forcing or holding your breath. Follow the pace that feels safe for you.</p>
                  <div className="my-6 flex flex-col items-center rounded-2xl bg-[#F7F2FF] p-7">
                    <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-[#DCCCF8] bg-white text-center text-[#7954C8]">
                      <div><Wind size={27} className="mx-auto mb-2" /><span className="text-2xl font-bold">{Math.floor(breathSeconds / 60)}:{String(breathSeconds % 60).padStart(2, '0')}</span><span className="mt-1 block text-xs">elapsed</span></div>
                    </div>
                    <p className="mt-4 text-sm text-[#817B91]">{breathing ? 'Take slow, comfortable breaths.' : 'Start when you feel ready.'}</p>
                    <div className="mt-4 flex gap-3">
                      <button onClick={() => setBreathing(v => !v)} className="flex items-center gap-2 rounded-xl bg-[#7954C8] px-4 py-3 text-sm font-semibold text-white">{breathing ? <Pause size={16} /> : <Play size={16} />}{breathing ? 'Pause' : 'Start'}</button>
                      <button onClick={() => { setBreathing(false); setBreathSeconds(0) }} className="flex items-center gap-2 rounded-xl border border-[#E8E0F2] px-4 py-3 text-sm"><RotateCcw size={16} /> Reset</button>
                    </div>
                  </div>
                </>
              ) : activity === '5-4-3 grounding' ? (
                <div className="mt-5 space-y-3">
                  {['Notice 5 things you can see.', 'Notice 4 things you can physically feel.', 'Notice 3 things you can hear.', 'Notice 2 things you can smell, if possible.', 'Notice 1 thing you can taste, or one slow breath.'].map((step, index) => <GroundingStep key={step} number={index + 1} text={step} />)}
                </div>
              ) : (
                <Journaling />
              )}
            </div>
          </section>
        )}

        
{page === 'AI Companion' && (
  <section className="mx-auto flex min-h-[65vh] max-w-3xl items-center justify-center">
    <div className="w-full overflow-hidden rounded-3xl border border-[#F0ECF5] bg-white text-center shadow-sm">
      <div className="bg-gradient-to-br from-[#F3EEFF] via-[#FAF6FF] to-[#FDECF4] px-6 py-12 sm:px-12 sm:py-16">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-[#7954C8] shadow-sm">
          <Brain size={38} />
        </span>

        <span className="mt-6 inline-flex items-center rounded-full border border-[#DCCCF8] bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#7954C8]">
          Coming Soon
        </span>

        <h2 className="mt-5 text-2xl font-bold tracking-tight text-[#29243A] sm:text-3xl">
          Meet your MindEase Companion
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#777087] sm:text-base">
          A supportive space to explore your thoughts, reflect on your day,
          and discover small steps that may support your wellbeing.
        </p>

        <div className="mx-auto mt-8 grid max-w-md gap-3 text-left sm:grid-cols-2">
          <div className="rounded-2xl border border-white bg-white/80 p-4">
            <MessageCircle className="mb-3 text-[#7954C8]" size={21} />
            <h3 className="text-sm font-semibold text-[#49366F]">
              Supportive conversations
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#817B91]">
              A place to put your thoughts into words.
            </p>
          </div>

          <div className="rounded-2xl border border-white bg-white/80 p-4">
            <Sparkles className="mb-3 text-[#7954C8]" size={21} />
            <h3 className="text-sm font-semibold text-[#49366F]">
              Personal reflection
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#817B91]">
              Explore gentle prompts and practical next steps.
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm text-[#8C859C]">
          We’re working on bringing this experience to life.
        </p>

        <button
          onClick={() => navigate('Coping Toolkit')}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#7954C8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6944B8]"
        >
          Explore Coping Toolkit
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  </section>
)}

       {page === 'Activity Planner' && (
  <>
   {showFollowUpPrompt && (
  <section
    ref={followUpPromptRef}
    className="mb-5 scroll-mt-6 rounded-2xl border border-[#E5D9FF] bg-[#F7F2FF] p-5 sm:p-6"
  >
        <h2 className="font-bold text-[#49366F]">
          Take a moment to check in with yourself
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#777087]">
          You completed an activity. Would you like to reflect on how you feel
          now? There is no right or wrong answer, and this step is optional.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => {
              setShowFollowUpPrompt(false)
              navigate('Check-in')
            }}
            className="rounded-xl bg-[#7954C8] px-4 py-3 text-sm font-semibold text-white hover:bg-[#6944B8]"
          >
            Start follow-up check-in
          </button>

          <button
            onClick={() => setShowFollowUpPrompt(false)}
            className="rounded-xl border border-[#E5D9FF] bg-white px-4 py-3 text-sm font-semibold text-[#7954C8]"
          >
            Maybe later
          </button>
        </div>
      </section>
    )}

    <ActivityPlanner onActivityCompleted={handleActivityCompleted} />
  </>
)}
      </main>
    </div>
  )
}

function SummaryCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#F0ECF5] bg-white p-5 shadow-sm shadow-purple-100/20">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-[#898298]">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EAFE] text-[#7954C8]">{icon}</span>
      </div>
      <p className="mt-4 break-words text-2xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-[#A09AAC]">{detail}</p>
    </div>
  )
}

function EmptyState({ text, action, onClick }: { text: string; action: string; onClick: () => void }) {
  return (
    <div className="rounded-xl bg-[#FCFAFF] px-4 py-8 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1EAFE] text-[#7954C8]"><Heart size={21} /></span>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#817B91]">{text}</p>
      <button onClick={onClick} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#7954C8]">{action} <ArrowRight size={15} /></button>
    </div>
  )
}

function CheckInRow({ item }: { item: CheckIn }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-1 last:pb-1">
      <div>
        <p className="text-sm font-semibold">{formatDateTime(item.date)}</p>
        <p className="mt-1 text-xs text-[#9A93A8]">Mood: {item.mood}{item.factors.length ? ` · ${item.factors.join(', ')}` : ''}</p>
      </div>
      <span className="rounded-xl bg-[#F1EAFE] px-3 py-2 text-sm font-bold text-[#7954C8]">{item.stress}/10 stress</span>
    </div>
  )
}

function ActionButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-[#7954C8] hover:bg-[#FCFAFF]">{children}</button>
}

function GroundingStep({ number, text }: { number: number; text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button onClick={() => setDone(v => !v)} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm ${done ? 'border-[#C5E5D3] bg-[#F0F9F3] text-[#347354]' : 'border-[#EEEAF5] text-[#6F687F]'}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F1EAFE] font-semibold text-[#7954C8]">{done ? <Check size={16} /> : number}</span>
      {text}
    </button>
  )
}

function Journaling() {
  const [answers, setAnswers] = useState(['', '', ''])
  const prompts = ['What is taking up the most space in my mind?', 'What do I need right now?', 'What is one small, kind step I can take?']
  return (
    <div className="mt-5 space-y-5">
      {prompts.map((prompt, index) => (
        <div key={prompt}>
          <label className="mb-2 block text-sm font-semibold">{prompt}</label>
          <textarea value={answers[index]} onChange={e => setAnswers(old => old.map((value, i) => i === index ? e.target.value : value))} rows={2} maxLength={500} className="w-full rounded-xl border border-[#EEEAF5] p-3 text-sm outline-none focus:border-[#B59BEA]" placeholder="Write here, if you want..." />
        </div>
      ))}
      <p className="text-xs text-[#9A93A8]">These reflections remain in this form only and are not saved. You can copy anything you wish to keep.</p>
      <button onClick={() => { const text = prompts.map((p, i) => `${p}\n${answers[i]}`).join('\n\n'); void navigator.clipboard?.writeText(text) }} className="rounded-xl bg-[#7954C8] px-4 py-3 text-sm font-semibold text-white">Copy reflection</button>
    </div>
  )
}

export default App

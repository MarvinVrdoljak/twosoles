'use server'

import {revalidatePath} from 'next/cache'
import {createClient} from '@/utility/supabase/server'
import {getUser} from '@/utility/supabase/user'

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

function dateStr(ms: number) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function questions(count: number) {
  return Array.from({length: count}, (_, index) => ({text: `Dummy-Frage ${index + 1}`, custom: false}))
}

// DEV ONLY: wipe the current user's events and seed one event per status
// (draft / live / ended / expired). No photos. Guarded so it never runs in prod.
export async function seedDummyEventsAction() {
  if (process.env.NODE_ENV !== 'development') return

  const user = await getUser()
  if (!user) return

  const supabase = await createClient()
  await supabase.from('events').delete().eq('user_id', user.id)

  const now = Date.now()
  const base = {
    user_id: user.id,
    person1_color: '#a67070',
    person2_color: '#1f2937',
    game_language: 'de',
  }

  await supabase.from('events').insert([
    {
      // Entwurf: not started, date in the future.
      ...base,
      person1_name: 'Lena',
      person2_name: 'David',
      occasion: 'wedding',
      title: 'Lena & David',
      event_date: dateStr(now + 30 * DAY),
      package: 'medium',
      questions: questions(12),
      started_at: null,
    },
    {
      // Live: started 2h ago (within the 48h window).
      ...base,
      person1_name: 'Mia',
      person2_name: 'Jon',
      occasion: 'prewedding',
      title: 'Polterabend',
      event_date: dateStr(now + DAY),
      package: 'large',
      questions: questions(10),
      started_at: new Date(now - 2 * HOUR).toISOString(),
    },
    {
      // Beendet: started 3 days ago (past the 48h window).
      ...base,
      person1_name: 'Ann',
      person2_name: 'Ben',
      occasion: 'engagement',
      title: 'Verlobung',
      event_date: dateStr(now - 5 * DAY),
      package: 'medium',
      questions: questions(15),
      started_at: new Date(now - 3 * DAY).toISOString(),
    },
    {
      // Abgelaufen: never started, date in the past.
      ...base,
      person1_name: 'Sara',
      person2_name: 'Tom',
      occasion: 'anniversary',
      title: 'Silberhochzeit',
      event_date: dateStr(now - 5 * DAY),
      package: 'free',
      questions: questions(8),
      started_at: null,
    },
  ])

  revalidatePath('/[locale]/host', 'page')
}

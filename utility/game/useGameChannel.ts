'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import type {RealtimeChannel} from '@supabase/supabase-js'
import {createClient} from '@/utility/supabase/client'
import {INITIAL_GAME_STATE} from './types'
import type {CoupleAnswer, GameState, GameTheme} from './types'

type Role = 'host' | 'display' | 'guest' | 'couple'

type PresenceMeta = {role: Role; joinedAt: number; coupleSlot?: 0 | 1 | null}

// Shared live-game channel over Supabase Realtime. The host is the authority:
// it holds + broadcasts the GameState; display + guests subscribe. Guests send
// vote events which the host tallies. Guest count comes from Presence.
//
// Works offline too: if the channel never connects (e.g. local backend down),
// `state` stays local and `setState` still updates the local view — so each
// screen renders and the dev stepper can drive it without a backend.
export function useGameChannel(
  eventId: string,
  role: Role,
  initialTheme: GameTheme = 'light',
  capacity: number = Infinity,
  // Host only: the last state restored from the DB, so a reload resumes the
  // game (phase/votes/results) instead of resetting everyone to the lobby.
  initialState: GameState | null = null,
  // Couple devices only: which partner this device is (0 = person1, 1 = person2),
  // or null for the picker (not yet chosen). Published via Presence so the other
  // partner's picker can tell which slot is already taken.
  coupleSlot: 0 | 1 | null = null,
) {
  const [state, setLocalState] = useState<GameState>(
    initialState ?? {...INITIAL_GAME_STATE, theme: initialTheme},
  )
  const [guestCount, setGuestCount] = useState(0)
  const [connected, setConnected] = useState(false)
  // Guests only: true when this guest joined past the package's capacity.
  const [overCapacity, setOverCapacity] = useState(false)
  // Couple slots currently claimed by any connected couple device — lets the
  // picker disable a partner the other device already took.
  const [claimedCoupleSlots, setClaimedCoupleSlots] = useState<(0 | 1)[]>([])

  const channelRef = useRef<RealtimeChannel | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  // Sending on a channel before it's SUBSCRIBED is silently dropped, so track
  // readiness and hold any votes cast in that window to flush on connect.
  const subscribedRef = useRef(false)
  const pendingVotesRef = useRef<(0 | 1)[]>([])
  // Couple devices (phone mode): each partner's pick, held until connected.
  const pendingCoupleRef = useRef<{slot: 0 | 1; option: 0 | 1}[]>([])

  // Stable identity + join time for this device, so the capacity ranking is
  // deterministic and this guest can locate itself in the presence list.
  const presenceKeyRef = useRef(`${role}-${Math.random().toString(36).slice(2)}`)
  const joinedAtRef = useRef(Date.now())

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`game:${eventId}`, {
      config: {presence: {key: presenceKeyRef.current}},
    })

    // Subscribers apply the host's broadcast state.
    channel.on('broadcast', {event: 'state'}, ({payload}) => {
      if (role !== 'host') setLocalState(payload as GameState)
    })

    // Late joiners ask the host to re-send the current state.
    channel.on('broadcast', {event: 'sync'}, () => {
      if (role === 'host') {
        channel.send({type: 'broadcast', event: 'state', payload: stateRef.current})
      }
    })

    // Host tallies incoming guest votes.
    if (role === 'host') {
      channel.on('broadcast', {event: 'vote'}, ({payload}) => {
        const option = (payload as {option: 0 | 1}).option
        setLocalState((current) => {
          const votes: [number, number] = [...current.votes]
          votes[option] += 1
          const next = {...current, votes}
          channel.send({type: 'broadcast', event: 'state', payload: next})
          return next
        })
      })

      // Host records the couple's own picks (phone mode). Each partner (slot 0 =
      // person1's device, 1 = person2's) sends who they pointed at for the
      // question the host currently shows. Last write per slot wins, so a partner
      // can change their mind while voting is open.
      channel.on('broadcast', {event: 'coupleVote'}, ({payload}) => {
        const {slot, option} = payload as {slot: 0 | 1; option: 0 | 1}
        setLocalState((current) => {
          const prev = current.coupleAnswers[current.questionIndex] ?? [-1, -1]
          const pair: CoupleAnswer = [prev[0], prev[1]]
          pair[slot] = option
          const next = {
            ...current,
            coupleAnswers: {...current.coupleAnswers, [current.questionIndex]: pair},
          }
          channel.send({type: 'broadcast', event: 'state', payload: next})
          return next
        })
      })
    }

    channel.on('presence', {event: 'sync'}, () => {
      // Order all present guests by join time (tie-break by presence key) so
      // every client agrees on who holds the first `capacity` seats. When an
      // admitted guest leaves, everyone re-ranks and a waiting guest is promoted.
      const guests = Object.entries(channel.presenceState<PresenceMeta>())
        .map(([key, metas]) => ({key, joinedAt: metas[0]?.joinedAt ?? 0, role: metas[0]?.role}))
        .filter((entry) => entry.role === 'guest')
        .sort((a, b) => a.joinedAt - b.joinedAt || a.key.localeCompare(b.key))

      setGuestCount(guests.length)

      if (role === 'guest') {
        const myRank = guests.findIndex((entry) => entry.key === presenceKeyRef.current)
        setOverCapacity(myRank >= capacity)
      }

      // Which couple slots are already taken by a connected partner device.
      const claimed = Object.values(channel.presenceState<PresenceMeta>())
        .map((metas) => metas[0]?.coupleSlot)
        .filter((slot): slot is 0 | 1 => slot === 0 || slot === 1)
      setClaimedCoupleSlots([...new Set(claimed)])
    })

    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return
      subscribedRef.current = true
      setConnected(true)
      void channel.track({role, joinedAt: joinedAtRef.current, coupleSlot})
      if (role === 'host') {
        channel.send({type: 'broadcast', event: 'state', payload: stateRef.current})
      } else {
        channel.send({type: 'broadcast', event: 'sync', payload: {}})
      }
      // Flush any votes cast before the channel was ready.
      const pending = pendingVotesRef.current
      pendingVotesRef.current = []
      for (const option of pending) {
        channel.send({type: 'broadcast', event: 'vote', payload: {option}})
      }
      // Same for couple picks cast before connect.
      const pendingCouple = pendingCoupleRef.current
      pendingCoupleRef.current = []
      for (const cv of pendingCouple) {
        channel.send({type: 'broadcast', event: 'coupleVote', payload: cv})
      }
    })

    channelRef.current = channel
    return () => {
      subscribedRef.current = false
      void supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [eventId, role, capacity, coupleSlot])

  // Host: update + broadcast. Subscribers (dev stepper): update local view only.
  const setState = useCallback(
    (updater: GameState | ((prev: GameState) => GameState)) => {
      setLocalState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        if (role === 'host') {
          channelRef.current?.send({type: 'broadcast', event: 'state', payload: next})
        }
        return next
      })
    },
    [role],
  )

  const sendVote = useCallback((option: 0 | 1) => {
    // Before the channel is ready, queue the vote so it isn't silently dropped;
    // the subscribe handler flushes the queue on connect.
    if (subscribedRef.current) {
      channelRef.current?.send({type: 'broadcast', event: 'vote', payload: {option}})
    } else {
      pendingVotesRef.current.push(option)
    }
  }, [])

  // Couple device (phone mode): send this partner's pick for the current
  // question. Queued until connected, mirroring sendVote.
  const sendCoupleVote = useCallback((slot: 0 | 1, option: 0 | 1) => {
    if (subscribedRef.current) {
      channelRef.current?.send({type: 'broadcast', event: 'coupleVote', payload: {slot, option}})
    } else {
      pendingCoupleRef.current.push({slot, option})
    }
  }, [])

  // Host-relevant: the game is full once as many (or more) guests are present as
  // the package allows.
  const atCapacity = guestCount >= capacity

  return {
    state,
    setState,
    sendVote,
    sendCoupleVote,
    guestCount,
    connected,
    overCapacity,
    atCapacity,
    capacity,
    claimedCoupleSlots,
  }
}

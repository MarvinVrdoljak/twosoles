'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import type {RealtimeChannel} from '@supabase/supabase-js'
import {createClient} from '@/utility/supabase/client'
import {INITIAL_GAME_STATE} from './types'
import type {GameState, GameTheme} from './types'

type Role = 'host' | 'display' | 'guest'

type PresenceMeta = {role: Role; joinedAt: number}

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
) {
  const [state, setLocalState] = useState<GameState>({...INITIAL_GAME_STATE, theme: initialTheme})
  const [guestCount, setGuestCount] = useState(0)
  const [connected, setConnected] = useState(false)
  // Guests only: true when this guest joined past the package's capacity.
  const [overCapacity, setOverCapacity] = useState(false)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

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
    })

    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return
      setConnected(true)
      void channel.track({role, joinedAt: joinedAtRef.current})
      if (role === 'host') {
        channel.send({type: 'broadcast', event: 'state', payload: stateRef.current})
      } else {
        channel.send({type: 'broadcast', event: 'sync', payload: {}})
      }
    })

    channelRef.current = channel
    return () => {
      void supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [eventId, role, capacity])

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
    channelRef.current?.send({type: 'broadcast', event: 'vote', payload: {option}})
  }, [])

  // Host-relevant: the game is full once as many (or more) guests are present as
  // the package allows.
  const atCapacity = guestCount >= capacity

  return {state, setState, sendVote, guestCount, connected, overCapacity, atCapacity, capacity}
}

// Maximum number of guests that may join the live game, per package. Production
// caps match the pricing tiers (Kleine Runde 10 / Intim 50 / Klassisch 100 /
// Große Feier 300); in development we use tiny caps so the limit is trivial to
// hit and test with a couple of phones/tabs.
const PRODUCTION: Record<string, number> = {free: 10, small: 50, medium: 100, large: 300}
const DEVELOPMENT: Record<string, number> = {free: 3, small: 5, medium: 10, large: 15}

// Resolved on the server (in the game pages) and passed down as a prop, so the
// dev override follows the server's NODE_ENV.
//
// A DRAFT event (not yet set live) is always capped at the free tier, whatever
// package was booked: the paid capacity only unlocks once the host goes live.
// This keeps a whole party from streaming in during setup/testing and makes
// "go live" the deliberate switch that turns the booked capacity on.
export function guestCapacity(pkg: string, isLive: boolean): number {
  const table = process.env.NODE_ENV === 'development' ? DEVELOPMENT : PRODUCTION
  const effective = isLive ? pkg : 'free'
  return table[effective] ?? table.free
}

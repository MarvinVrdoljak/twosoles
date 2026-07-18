#!/usr/bin/env node
// Interaktiver Migrations-Push nach Staging oder Production.
//
// Wendet die Dateien aus supabase/migrations über die Supabase-CLI auf das
// gewählte Remote-Projekt an (link + db push). Bewusst getrennt vom lokalen
// Stack: lokal läuft `npx supabase migration up`, remote läuft dieses Script.
//
// Nutzung:
//   npm run db:push                  interaktive Auswahl (Staging/Production)
//   npm run db:push -- staging       direkt Staging
//   npm run db:push -- prod          direkt Production (mit Extra-Bestätigung)
//   npm run db:push -- staging --dry-run   nur anzeigen, was gepusht würde
//
// Voraussetzungen (einmalig): `npx supabase login` und das DB-Passwort des
// jeweiligen Projekts zur Hand (die CLI fragt danach; alternativ per Env
// SUPABASE_DB_PASSWORD). Siehe docs/DEPLOYMENT.md, Schritt 1c.

import {spawnSync} from 'node:child_process'
import {createInterface} from 'node:readline/promises'
import {stdin, stdout, argv, exit} from 'node:process'

const TARGETS = {
  staging: {
    ref: 'ffurdhrgeigezhajbfey',
    url: 'https://ffurdhrgeigezhajbfey.supabase.co',
    label: 'STAGING',
  },
  production: {
    ref: 'ixrostqubfojzvknrpng',
    url: 'https://ixrostqubfojzvknrpng.supabase.co',
    label: 'PRODUCTION',
  },
}

// 'prod'/'production' -> production, 'staging'/'stage' -> staging.
function normalizeTarget(value) {
  const v = String(value ?? '').toLowerCase()
  if (v === 'production' || v === 'prod' || v === 'p') return 'production'
  if (v === 'staging' || v === 'stage' || v === 's') return 'staging'
  return null
}

// Run `npx supabase <args>` with inherited stdio, so the CLI's own prompts
// (DB password, "push these migrations? [Y/n]") reach the user directly.
// shell:true is required on Windows: since a Node security fix, spawning the
// npx.cmd shim without a shell throws EINVAL. Our args are simple tokens
// (no spaces), so shell quoting is not a concern here.
function supabase(args) {
  // stdin is 'ignore', not 'inherit': after this script reads the confirmation
  // via readline, an inherited stdin leaves the child CLI waiting on it and it
  // hangs. We pass --yes so the CLI needs no input anyway; auth is file-based
  // (access token), not stdin. stdout/stderr still inherit so output shows.
  const res = spawnSync('npx', ['supabase', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: true,
  })
  if (res.error) {
    console.error(`\n✖ Konnte "supabase" nicht starten: ${res.error.message}`)
    exit(1)
  }
  if (res.status !== 0) {
    console.error(`\n✖ Fehlgeschlagen: supabase ${args.join(' ')}`)
    exit(res.status ?? 1)
  }
}

async function main() {
  // Split args into the target (first non-flag) and pass-through flags (--dry-run).
  const rawArgs = argv.slice(2)
  const flags = rawArgs.filter((a) => a.startsWith('-'))
  const positional = rawArgs.find((a) => !a.startsWith('-'))
  const dryRun = flags.includes('--dry-run')

  const rl = createInterface({input: stdin, output: stdout})

  let key = normalizeTarget(positional)
  if (!key) {
    stdout.write('\nWohin pushen?\n  1) Staging\n  2) Production\n')
    const choice = (await rl.question('Auswahl [1/2]: ')).trim()
    key = choice === '2' ? 'production' : choice === '1' ? 'staging' : null
    if (!key) {
      console.error('✖ Ungültige Auswahl.')
      rl.close()
      exit(1)
    }
  }

  const target = TARGETS[key]
  stdout.write(
    `\n→ Ziel: ${target.label}\n  Projekt-Ref: ${target.ref}\n  URL: ${target.url}\n` +
      (dryRun ? '  Modus: DRY-RUN (nichts wird verändert)\n' : ''),
  )

  // Extra-Sicherung für Production: den Namen ausschreiben lassen.
  if (key === 'production' && !dryRun) {
    const typed = (await rl.question('\n⚠  Das schreibt auf PRODUCTION. Tippe "PRODUCTION" zum Bestätigen: ')).trim()
    if (typed !== 'PRODUCTION') {
      console.error('✖ Abgebrochen (keine Bestätigung).')
      rl.close()
      exit(1)
    }
  } else if (!dryRun) {
    const ok = (await rl.question(`\nMigrationen auf ${target.label} pushen? [y/N]: `)).trim().toLowerCase()
    if (ok !== 'y' && ok !== 'j') {
      console.error('✖ Abgebrochen.')
      rl.close()
      exit(1)
    }
  }
  rl.close()

  // No DB password needed: `supabase db push` provisions a temporary login role
  // via the access token from `supabase login` (the "Initialising login role"
  // step). --yes auto-answers the CLI's own y/n prompt, which otherwise hangs
  // because it does not render through the npm -> node -> shell wrapper. Safe:
  // this script already collected an explicit confirmation above.
  stdout.write(`\n1/2 · Verlinke Projekt ${target.ref} …\n`)
  supabase(['link', '--project-ref', target.ref, '--yes'])

  stdout.write(`\n2/2 · ${dryRun ? 'Zeige ausstehende Migrationen (dry-run)' : 'Pushe Migrationen'} …\n`)
  supabase(['db', 'push', ...(dryRun ? ['--dry-run'] : ['--yes'])])

  stdout.write(`\n✓ Fertig${dryRun ? ' (dry-run)' : ` — Migrationen auf ${target.label} angewendet`}.\n`)
  if (!dryRun && key === 'staging') {
    stdout.write('  Tipp: erst Staging testen, dann dasselbe für Production laufen lassen.\n')
  }
}

main().catch((err) => {
  console.error(err)
  exit(1)
})

# TwoSoles

Digitales „Wedding Shoe Game" – Next.js (App Router) + Supabase.

Dieser Stand enthält das Grundgerüst: Next.js mit i18n (de/en), lokales Supabase
und E-Mail/Passwort-Login inklusive Konto-Erstellung. **Noch kein Styling.**

## Stack

- **Next.js 16** (App Router, React 19, TypeScript strict)
- **next-intl v4** – Locale im URL via `[locale]`-Segment (`localePrefix: 'as-needed'`,
  Default `de` läuft ohne Präfix → `/`, `/login`; Englisch unter `/en`, `/en/login`)
- **Supabase** – Auth lokal über die Supabase CLI (Docker)
- CSS-Architektur, Token & Konventionen siehe `SKILL.md`

## Voraussetzungen

- Node 20+
- Docker Desktop (läuft) – für das lokale Supabase

## Lokal starten

```bash
npm install
npm run supabase:start    # startet den lokalen Supabase-Stack (Docker)
npm run dev               # http://localhost:3001
```

Nützliche Adressen im lokalen Betrieb:

- App: http://localhost:3001
- Supabase Studio: http://127.0.0.1:54323
- Eingehende Mails (Mailpit): http://127.0.0.1:54324

Weitere Skripte: `npm run supabase:stop`, `npm run supabase:status`,
`npm run db:reset`, `npm run typecheck`, `npm run lint:css`.

## Auth – passwortlos (Magic Link)

- **Registrierung:** `/register` (DE) bzw. `/en/register` – Name + E-Mail. Legt
  das Konto an (Name landet in `user_metadata.name`) und schickt einen Link.
- **Login:** `/login` bzw. `/en/login` – nur E-Mail, schickt einen Magic Link an
  bestehende Konten. Unbekannte E-Mails werden hier **nicht** angelegt.
- **Routen-Gating:** Eingeloggte User werden von `/`, `/login`, `/register` auf
  **`/dashboard`** geleitet (der eingeloggte Bereich). `/dashboard` ohne Session → `/login`.
  Die Home `/` ist nur für ausgeloggte Besucher. Gating sitzt in den jeweiligen
  Server Components (`getUser()` aus `utility/supabase/user.ts`).
- **Spiel-Ansichten (Platzhalter):** Pro Event gibt es drei Top-Level-Routen –
  `/host/[id]` (Host-Steuerung), `/display/[id]` (Leinwand/Beamer) und
  `/guest/[id]` (Gäste-Handy). Aktuell nur leere Platzhalter (`LayoutGameStub`),
  verlinkt aus der Event-Detailseite (`/dashboard/events/[id]`) – Spiel-Logik folgt.
- **Logout:** Server-Action (`utility/auth/actions.ts`) – meldet server-seitig ab
  und leitet auf `/login`.
- Der Link in der E-Mail zeigt auf `/auth/confirm?token_hash=…&type=…`. Die Route
  [`app/auth/confirm/route.ts`](app/auth/confirm/route.ts) verifiziert ihn
  (`verifyOtp`), setzt die Session und leitet weiter. Sie liegt außerhalb von
  `[locale]` und ist im `middleware.ts`-Matcher ausgenommen.
- **E-Mail-Templates:** `supabase/templates/magic_link.html` (Login/Registrierung)
  und `confirmation.html`, konfiguriert in `supabase/config.toml`.
- Supabase-Clients liegen in `utility/supabase/` (`client.ts` Browser,
  `server.ts` Server, `middleware.ts` Session-Refresh). `middleware.ts`
  kombiniert next-intl-Routing mit dem Supabase Session-Refresh.

> Lokal werden Mails **nicht** versendet, sondern landen in **Mailpit**
> (http://127.0.0.1:54324). Dort den Link öffnen, um den Flow zu testen.
> Nach Config-Änderungen unter `supabase/` einmal `npm run supabase:stop &&
npm run supabase:start` ausführen.

### Google OAuth (Social Login)

Login-/Register-Seite haben einen „Mit Google fortfahren"-Button
([`FormGoogleButton`](components/form/FormGoogleButton.tsx) →
`signInWithOAuth({provider:'google'})`). Google leitet auf den Supabase-Callback,
Supabase auf [`app/auth/callback/route.ts`](app/auth/callback/route.ts), das den
`code` per `exchangeCodeForSession` gegen eine Session tauscht.

Provider-Config: `[auth.external.google]` in `supabase/config.toml`
(`skip_nonce_check = true` für lokal). **Credentials** kommen über `env()` aus der
git-ignorierten `.env` (`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` / `_SECRET`).

**Einrichtung (Google Cloud Console):**

1. Projekt anlegen → **OAuth consent screen** konfigurieren (User type _External_,
   App-Name, Support-Mail; Scopes `email`/`profile`/`openid`). Während _Testing_
   dich als Test-User hinzufügen; für den öffentlichen Betrieb veröffentlichen.
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. **Authorized redirect URI** = der **Supabase**-Callback (nicht die App!):
   - Lokal: `http://127.0.0.1:54321/auth/v1/callback`
   - Live: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Client ID + Secret in die `.env` eintragen, dann
   `npm run supabase:stop && npm run supabase:start`.

Live (supabase.com): dieselben Client-ID/-Secret im Dashboard unter
_Authentication → Providers → Google_ setzen (statt in der lokalen `.env`).

## Umgebungsvariablen

`.env.local` ist mit den lokalen Supabase-Defaults vorbefüllt. Vorlage: `.env.example`.

| Variable                        | Lokal                    | Live (supabase.com)                 |
| ------------------------------- | ------------------------ | ----------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `http://127.0.0.1:54321` | `https://<ref>.supabase.co`         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | lokaler anon key         | anon (public) key aus dem Dashboard |

## Migration nach supabase.com (live)

Der Code bleibt identisch – es wechseln nur die Env-Werte und das Ziel der
Datenbank-Migrationen:

1. Projekt auf https://supabase.com anlegen, Projekt-Ref notieren.
2. Lokal verknüpfen: `npx supabase link --project-ref <ref>`
3. Lokale DB-Schema-Änderungen liegen als Migrationen unter `supabase/migrations/`
   und werden hochgeschoben mit `npx supabase db push`.
   (Aktuell wird nur die eingebaute `auth`-Tabelle genutzt – noch keine eigenen
   Migrationen nötig.)
4. Auth-Einstellungen (z. B. `enable_confirmations`, Redirect-URLs, Site-URL) in
   `supabase/config.toml` pflegen bzw. im Dashboard setzen.
5. In Vercel die beiden `NEXT_PUBLIC_SUPABASE_*` Env-Vars auf die Live-Werte
   setzen. Fertig – kein Code-Wechsel.

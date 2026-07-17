# TwoSoles Deployment: Staging und Production

Diese Anleitung führt TwoSoles von lokal auf zwei öffentliche Umgebungen:

- **Production** `https://twosoles.live` (echte Zahlungen, Live Stripe, bezahltes Supabase)
- **Staging** `https://staging.twosoles.live` (Sandbox Stripe, kostenloses Supabase, dauerhaft passwortgeschützt)

Die Reihenfolge ist bewusst gewählt: Supabase zuerst (liefert URLs und Keys), dann
Vercel (braucht diese Keys), dann Domain, dann Resend und Stripe, zum Schluss der
Zugriffsschutz und der Go-Live.

## Architektur auf einen Blick

| | Production | Staging |
|---|---|---|
| Vercel Environment | Production | Custom Environment `staging` |
| Git Branch | `main` | `staging` |
| Domain | `twosoles.live` | `staging.twosoles.live` |
| Supabase | eigenes Projekt in **bezahlter** Org (Pro) | eigenes Projekt in **kostenloser** Org (Free) |
| Stripe | Live Mode (echte Zahlungen) | Sandbox / Test Mode |
| Resend | gleicher Account, verifizierte Domain `twosoles.live` | gleicher Account |
| Basic Auth | anfangs an, zum Launch aus | dauerhaft an |

Wichtig zum Verständnis der Umgebungs-Trennung auf Vercel: Environment-Variablen
werden pro Environment gesetzt. Production-Variablen greifen nur auf `main`,
Staging-Variablen nur auf dem `staging`-Branch. So laufen beide Welten strikt
getrennt mit eigenem Supabase, eigenem Stripe und eigener URL.

---

## Schritt 0: Repo vorbereiten

Die Code-Vorbereitung ist bereits erledigt (in diesem Branch):

- `proxy.ts` hat jetzt einen per Env-Variable schaltbaren Basic-Auth-Schutz.
- `vercel.json` pinnt die Server-Region auf `fra1` (Frankfurt), passend zu EU-Nutzern und Supabase EU.

Noch zu tun:

1. Diese Änderungen committen und pushen (`main`).
2. Den `staging`-Branch anlegen und pushen:

   ```bash
   git checkout main
   git pull
   git checkout -b staging
   git push -u origin staging
   git checkout main
   ```

Ab jetzt gilt: alles was du auf `main` mergst geht (nach Setup) automatisch nach
Production, alles auf `staging` nach Staging.

---

## Schritt 1: Supabase (zwei Orgs, damit nur Prod kostet)

Supabase rechnet **pro Organisation** ab. Ziel: Production in einer Pro-Org,
Staging in einer kostenlosen Org.

### 1a) Zwei Organisationen anlegen

1. In Supabase oben links auf den Org-Switcher, **New organization**.
2. Org 1: Name z. B. `TwoSoles`, Plan **Pro** (nur diese Org zahlt).
3. Org 2: Name z. B. `TwoSoles Staging`, Plan **Free**.

Hinweis: Free-Projekte pausieren nach 7 Tagen Inaktivität und werden beim nächsten
Zugriff wieder gestartet. Für Staging ist das ok.

### 1b) Zwei Projekte anlegen

1. In der Pro-Org: **New project** `twosoles-prod`, Region **Central EU (Frankfurt)**, ein starkes DB-Passwort erzeugen und sicher speichern.
2. In der Free-Org: **New project** `twosoles-staging`, ebenfalls **Frankfurt**.

Für jedes Projekt brauchst du später:

- **Project URL** (`https://<ref>.supabase.co`) unter Project Settings, API.
- **anon / publishable Key** (der öffentliche Key) unter Project Settings, API Keys.
- **secret Key** (`sb_secret_…`) unter Project Settings, API Keys. Der ersetzt den alten `service_role`. Dieser Key umgeht RLS, niemals ins Frontend.

### 1c) Schema (Migrationen) in beide Projekte pushen

Die Tabellen, RLS-Policies und Storage-Grants liegen in `supabase/migrations`.
Diese pro Projekt einspielen (Supabase CLI ist schon Dev-Dependency):

```bash
# Production
npx supabase link --project-ref <prod-ref>
npx supabase db push

# Staging
npx supabase link --project-ref <staging-ref>
npx supabase db push
```

`db push` wendet alle Migrationen auf das verlinkte Remote-Projekt an. Danach
existieren `events`, `event_payments`, die RLS-Policies und die
`service_role`-Grants in beiden DBs.

Nach dem Migrieren musst du in **beiden** Projekten den Storage-Bucket prüfen:
Der Code erwartet einen **privaten** Bucket `event-photos`. Falls die Migrationen
ihn nicht anlegen, im Dashboard unter Storage manuell anlegen (Name `event-photos`,
nicht öffentlich). Die Zugriffs-Policies kommen aus den Migrationen.

### 1d) Auth-URLs pro Projekt setzen (Dashboard)

Diese Einstellungen NICHT per `supabase config push` setzen, weil `config.toml`
noch die lokalen `localhost:3001`-URLs enthält und die das Remote überschreiben
würden. Stattdessen im Dashboard unter **Authentication, URL Configuration**:

Production-Projekt:
- **Site URL**: `https://twosoles.live`
- **Redirect URLs**: `https://twosoles.live/**`

Staging-Projekt:
- **Site URL**: `https://staging.twosoles.live`
- **Redirect URLs**: `https://staging.twosoles.live/**`

Die Site URL landet im Magic-Link-Template als `{{ .SiteURL }}`, deshalb muss sie
exakt stimmen.

### 1e) Magic-Link E-Mail-Template pro Projekt hinterlegen (Dashboard)

Im Dashboard unter **Authentication, Emails, Magic Link** für beide Projekte:

- **Subject**: den Inhalt aus `config.toml` `[auth.email.template.magic_link] subject` einfügen (der Ausdruck mit `{{ if eq .Data.locale ... }}` funktioniert auch im Hosted-Dashboard).
- **Message body**: den kompletten Inhalt von `supabase/templates/magic_link.html` einfügen.

Ebenfalls unter **Authentication, Sign In / Providers** sicherstellen, dass
**Email** aktiv ist und **Confirm email** ausgeschaltet ist (reiner OTP-/Magic-Link-Flow, wie lokal `enable_confirmations=false`).

### 1f) Google Login (optional, falls live gewünscht)

Der Login-/Register-Screen hat einen Google-Button. Damit der live funktioniert,
pro Projekt im Dashboard unter **Authentication, Providers, Google** aktivieren und
Client ID plus Secret aus der Google Cloud Console eintragen. In der Google Cloud
Console als autorisierte Redirect-URI die Supabase-Callback-URL des jeweiligen
Projekts eintragen: `https://<ref>.supabase.co/auth/v1/callback`.

Wenn du Google zum Start weglassen willst: Provider deaktiviert lassen, dann führt
der Button ins Leere. In dem Fall den Button vorerst ausblenden (separate Aufgabe).

---

## Schritt 2: Vercel (CD, Environments, Env-Vars, Tracking)

### 2a) Projekt importieren

1. Vercel, **Add New, Project**, GitHub-Repo `MarvinVrdoljak/twosoles` importieren.
2. Framework wird als **Next.js** erkannt, Build-Command `next build` (Default).
3. **Noch nicht deployen bevor die Env-Variablen gesetzt sind** (Build würde sonst wegen fehlender Supabase/Stripe-Variablen fehlschlagen). Falls Vercel sofort deployt: einfach nach dem Setzen der Variablen erneut deployen.

Production-Branch ist standardmäßig `main`. Das ist korrekt so.

### 2b) Staging als Custom Environment anlegen

1. Projekt, **Settings, Environments**.
2. **Create Environment**, Name `staging`, verknüpfter Branch `staging`.

Damit hast du drei Env-Scopes: `Production` (Branch main), `staging` (Branch
staging) und `Preview` (alle übrigen Branches). Env-Variablen setzt du gezielt pro
Scope.

### 2c) Environment-Variablen setzen

Unter **Settings, Environment Variables**. Jede Variable jeweils dem richtigen
Scope zuordnen. Die vollständige Liste steht in der Tabelle unten in dieser Datei
(Abschnitt „Environment-Variablen Referenz"). Kurzfassung:

**Production (Scope: Production):**

```
NEXT_PUBLIC_APP_URL=https://twosoles.live
NEXT_PUBLIC_SUPABASE_URL=https://<prod-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod anon/publishable key>
SUPABASE_SECRET_KEY=<prod sb_secret_...>
RESEND_API_KEY=<resend api key>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...            (Live-Endpoint, siehe Schritt 4)
STRIPE_PRODUCT_SMALL=prod_...              (Live-Produkt)
STRIPE_PRODUCT_MEDIUM=prod_...             (Live-Produkt)
STRIPE_PRODUCT_LARGE=prod_...              (Live-Produkt)
SITE_BASIC_AUTH=<user:passwort>            (anfangs setzen, zum Launch entfernen)
```

**Staging (Scope: staging):**

```
NEXT_PUBLIC_APP_URL=https://staging.twosoles.live
NEXT_PUBLIC_SUPABASE_URL=https://<staging-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging anon/publishable key>
SUPABASE_SECRET_KEY=<staging sb_secret_...>
RESEND_API_KEY=<resend api key>
STRIPE_SECRET_KEY=sk_test_...              (Sandbox)
STRIPE_WEBHOOK_SECRET=whsec_...            (Test-Endpoint, siehe Schritt 4)
STRIPE_PRODUCT_SMALL=prod_...              (Test-Produkt)
STRIPE_PRODUCT_MEDIUM=prod_...             (Test-Produkt)
STRIPE_PRODUCT_LARGE=prod_...              (Test-Produkt)
SITE_BASIC_AUTH=<user:passwort>            (dauerhaft)
```

Optional pro Umgebung: `CONTACT_TO_EMAIL` und `CONTACT_FROM_EMAIL`, falls die
Kontaktformular-Adressen von den Defaults (`hello@twosoles.live`) abweichen sollen.

Hinweis zu `SITE_BASIC_AUTH`: Format ist `benutzername:passwort`, genau ein
Doppelpunkt. Beispiel `twosoles:launch2026`. Solange die Variable existiert, ist
die Umgebung passwortgeschützt. Zum Entfernen des Schutzes einfach die Variable
löschen und neu deployen.

### 2d) Tracking aktivieren

`@vercel/analytics` und `@vercel/speed-insights` sind bereits im Layout eingebunden
(`app/[locale]/layout.tsx`). Im Vercel-Projekt nur noch einschalten:

1. Projekt, Tab **Analytics**, **Enable**.
2. Projekt, Tab **Speed Insights**, **Enable**.

Danach werden Seitenaufrufe und Web Vitals automatisch erfasst, sobald deployt ist.

### 2e) Erstes Deployment

1. `main` deployen lassen (Push auf main oder in Vercel **Redeploy**).
2. `staging`-Branch deployen lassen (Push auf staging).

Beide sollten jetzt erfolgreich bauen. Die Vercel-URLs (`*.vercel.app`) zeigen die
Seite bereits, aber wegen `SITE_BASIC_AUTH` mit Passwortabfrage.

---

## Schritt 3: Domain bei Hostinger verbinden

Wichtig: **Nameserver bei Hostinger belassen**, nicht auf Vercel umstellen. Du hast
dort custom E-Mail (MX-Records) und die Resend-Records (SPF, DKIM, DMARC) liegen.
Ein Nameserver-Wechsel zu Vercel würde diese DNS-Einträge verlieren, und E-Mail
plus Resend-Versand würden brechen. Wir fügen nur Web-Records hinzu.

### 3a) Domains in Vercel hinzufügen

1. Projekt, **Settings, Domains**.
2. `twosoles.live` hinzufügen, dem Environment **Production** zuordnen.
3. `staging.twosoles.live` hinzufügen, dem Environment **staging** zuordnen.
4. Optional `www.twosoles.live` hinzufügen und als Redirect auf `twosoles.live` konfigurieren.

Vercel zeigt dir dann die genau benötigten DNS-Records an. Nutze die Werte, die
Vercel anzeigt. Typischerweise:

- Apex `twosoles.live`: **A-Record** auf `76.76.21.21`
- `staging.twosoles.live`: **CNAME** auf `cname.vercel-dns.com`
- `www`: **CNAME** auf `cname.vercel-dns.com`

### 3b) Records bei Hostinger eintragen

In Hostinger, **Domains, twosoles.live, DNS / Nameserver, DNS Records verwalten**:

1. A-Record für `@` (Apex) auf den von Vercel angezeigten Wert setzen (meist `76.76.21.21`). Falls Hostinger schon einen A-Record fürs Parking auf `@` hat: diesen ändern, nicht doppelt anlegen.
2. CNAME `staging` auf `cname.vercel-dns.com`.
3. Optional CNAME `www` auf `cname.vercel-dns.com`.

**Nicht anfassen:** alle `MX`-Records (custom E-Mail) und die Resend-Einträge
(TXT für SPF/DMARC, die DKIM-CNAMEs, und die `send`-Subdomain-Records). Die bleiben
unverändert.

### 3c) Verifizieren

Zurück in Vercel unter Domains: nach DNS-Propagation (wenige Minuten bis zu einer
Stunde) zeigen beide Domains **Valid Configuration** und Vercel stellt automatisch
TLS-Zertifikate aus.

---

## Schritt 4: Resend als SMTP für Supabase Magic Links

Resend funktioniert bereits fürs Kontaktformular über `RESEND_API_KEY` (App-Env,
nicht Supabase). Für Magic Links muss Supabase über Resend versenden, sonst greift
das strenge Supabase-Standard-Limit (nur wenige Mails pro Stunde, nur an
Team-Mitglieder). Die Domain `twosoles.live` und „Enable Sending" sind bei Resend
schon verifiziert.

### 4a) Custom SMTP in beiden Supabase-Projekten aktivieren

Im Dashboard unter **Project Settings, Authentication, SMTP Settings**, **Enable
Custom SMTP**:

```
Host:        smtp.resend.com
Port:        465
Username:    resend
Password:    <Resend API Key, re_...>
Sender email: noreply@twosoles.live      (Adresse auf der verifizierten Domain)
Sender name:  TwoSoles
```

Das für Production- und Staging-Projekt getrennt eintragen (gleicher Resend-Account
und -Key ist ok, die Absenderdomain ist dieselbe).

### 4b) Rate Limits anheben

Ebenfalls unter Authentication, **Rate Limits**: das Limit für versendete E-Mails
hochsetzen (der Default ist sehr niedrig und nur für den eingebauten Versand
gedacht). Mit eigenem SMTP kannst du das gefahrlos erhöhen.

### 4c) Test

Auf Staging `https://staging.twosoles.live/register` eine echte Adresse
registrieren, Mail sollte über Resend ankommen, Link führt auf
`https://staging.twosoles.live/auth/confirm...` und loggt ein. Im Resend-Dashboard
unter Logs siehst du den Versand.

---

## Schritt 5: Stripe (Sandbox auf Staging, Live auf Production)

Der Code nutzt **Managed Payments** (Stripe ist Merchant of Record, kümmert sich um
Steuern). Es gibt zwei Welten: Sandbox/Test für Staging, Live für Production. Beide
brauchen jeweils eigene Produkte, eigene Keys und einen eigenen Webhook.

Der Code liest die Preise **live aus Stripe** (jedes Produkt braucht einen Default
Price), und die Produkt-IDs kommen aus `STRIPE_PRODUCT_SMALL/MEDIUM/LARGE`.

### 5a) Staging (Sandbox)

1. In Stripe eine **Sandbox** öffnen (oder Test Mode).
2. Managed Payments für die Sandbox aktivieren.
3. Drei **Produkte** anlegen mit Managed-Payments-fähigem Tax Code, jeweils mit einem **Default Price** in **EUR**, Preis inklusive Steuer:
   - „Intim" (small)
   - „Klassisch" (medium)
   - „Große Feier" (large)

   Die drei Produkt-IDs (`prod_...`) notieren, sie gehören in die Staging-Env-Vars.
4. **Webhook** anlegen unter Developers, Webhooks, **Add endpoint**:
   - URL: `https://staging.twosoles.live/api/stripe/webhook`
   - Events: `checkout.session.completed` und `checkout.session.async_payment_succeeded`
   - Signing Secret (`whsec_...`) kopieren nach Staging `STRIPE_WEBHOOK_SECRET`.
5. Sandbox **Secret Key** (`sk_test_...`) nach Staging `STRIPE_SECRET_KEY`.

### 5b) Production (Live)

1. Stripe-Account vollständig aktivieren (Geschäftsdaten, Auszahlungskonto).
2. Managed Payments im Live-Account aktivieren und die ToS akzeptieren.
3. Dieselben drei **Produkte** im Live Mode anlegen (Tax Code, Default Price in EUR, inklusive Steuer). Neue, eigene `prod_...`-IDs, in die Production-Env-Vars.
4. **Webhook** (Live Mode) anlegen:
   - URL: `https://twosoles.live/api/stripe/webhook`
   - Events: `checkout.session.completed` und `checkout.session.async_payment_succeeded`
   - Signing Secret nach Production `STRIPE_WEBHOOK_SECRET`.
5. Live **Secret Key** (`sk_live_...`) nach Production `STRIPE_SECRET_KEY`.

### 5c) Test

- Staging: einen kostenpflichtigen Event-Kauf mit Stripe-Testkarte `4242 4242 4242 4242` durchspielen. Nach Rückkehr sollte der Event auf das bezahlte Paket springen (synchroner Confirm), und der Webhook im Stripe-Dashboard sollte 200 liefern.
- Production: nach Go-Live einen echten Kauf mit kleinem Betrag testen (oder gut prüfen), danach ggf. rückerstatten.

---

## Schritt 6: Zugriffsschutz steuern (Basic Auth)

Der Schutz ist im Code (`proxy.ts`) und wird allein durch die Env-Variable
`SITE_BASIC_AUTH` gesteuert.

- **Setzen** (`benutzer:passwort`) plus Redeploy: Umgebung ist passwortgeschützt.
- **Löschen** plus Redeploy: Umgebung ist öffentlich.

Der Schutz greift auf allen Seiten. Bewusst NICHT geschützt sind `/api/*` (der
Stripe-Webhook muss erreichbar sein) und `/auth/*` (der Magic-Link-Callback). Das
ist sicher, weil alle App-Daten zusätzlich über Supabase RLS geschützt sind. Der
Basic-Auth-Gate hält die Vorab-Version nur von Suchmaschinen und zufälligen
Besuchern fern.

**Empfehlung:**
- Staging: `SITE_BASIC_AUTH` dauerhaft gesetzt lassen.
- Production: jetzt gesetzt lassen, und beim finalen Launch die Variable im
  Production-Scope löschen und einmal neu deployen. Fertig, kein Code-Deploy nötig.

---

## Go-Live Checkliste

Vor dem Öffentlichmachen von Production:

- [ ] `main` und `staging` sind gepusht, beide Vercel-Deployments grün.
- [ ] Beide Supabase-Projekte migriert (`db push`), Bucket `event-photos` vorhanden und privat.
- [ ] Auth-URLs pro Projekt korrekt (Site URL plus Redirect URLs auf die jeweilige Domain).
- [ ] Magic-Link-Template und Subject in beiden Projekten hinterlegt, Email-Provider an, Confirm email aus.
- [ ] Resend-SMTP in beiden Projekten aktiv, Test-Mail auf Staging kam an.
- [ ] Domains in Vercel „Valid", TLS aktiv, `twosoles.live` und `staging.twosoles.live` erreichbar.
- [ ] MX- und Resend-DNS-Records bei Hostinger unverändert, E-Mail funktioniert weiter.
- [ ] Stripe: Staging Sandbox getestet (Testkarte, Webhook 200), Production Live aktiviert, Produkte plus Default Prices in EUR, Live-Webhook eingerichtet.
- [ ] Vercel Analytics und Speed Insights aktiviert.
- [ ] Kontaktformular auf Staging getestet (Mail kommt über Resend an).
- [ ] Rechtliches: Impressum, Datenschutz, AGB mit echten Angaben gefüllt (aktuell Platzhalter).
- [ ] Launch: `SITE_BASIC_AUTH` im Production-Scope entfernen und neu deployen.

---

## Environment-Variablen Referenz

Alle von der App gelesenen Variablen. Spalte „Scope" zeigt, wo sie gesetzt sein muss.

| Variable | Zweck | Wo gelesen | Production | Staging |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Öffentliche Basis-URL (SEO, Sitemap, Canonical, QR-Codes, Stripe-Redirect-Fallback) | `utility/seo.ts`, `utility/stripe/actions.ts`, `display/[id]` | `https://twosoles.live` | `https://staging.twosoles.live` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Projekt-URL | `utility/supabase/config.ts` | Prod-Projekt | Staging-Projekt |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Öffentlicher Supabase Key (Browser plus SSR) | `utility/supabase/config.ts` | Prod anon | Staging anon |
| `SUPABASE_SECRET_KEY` | Service-Key (umgeht RLS) für Webhook plus Konto-Löschung | `utility/supabase/service.ts` | Prod `sb_secret_...` | Staging `sb_secret_...` |
| `RESEND_API_KEY` | Kontaktformular-Versand | `utility/contact/actions.ts` | `re_...` | `re_...` |
| `CONTACT_TO_EMAIL` | optional, Empfänger Kontaktformular | `utility/contact/actions.ts` | Default `hello@twosoles.live` | Default |
| `CONTACT_FROM_EMAIL` | optional, Absender Kontaktformular | `utility/contact/actions.ts` | Default `Two Soles <hello@twosoles.live>` | Default |
| `STRIPE_SECRET_KEY` | Stripe Server-Key | `utility/stripe/server.ts` | `sk_live_...` | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook-Signatur | `app/api/stripe/webhook/route.ts` | Live-Endpoint | Test-Endpoint |
| `STRIPE_PRODUCT_SMALL` | Produkt-ID Tier „small" | `utility/stripe/packages.ts` | Live `prod_...` | Test `prod_...` |
| `STRIPE_PRODUCT_MEDIUM` | Produkt-ID Tier „medium" | `utility/stripe/packages.ts` | Live `prod_...` | Test `prod_...` |
| `STRIPE_PRODUCT_LARGE` | Produkt-ID Tier „large" | `utility/stripe/packages.ts` | Live `prod_...` | Test `prod_...` |
| `SITE_BASIC_AUTH` | Zugriffsschutz `user:passwort`, leer = öffentlich | `proxy.ts` | anfangs setzen, zum Launch löschen | dauerhaft setzen |

Nur für die lokale Supabase-CLI relevant (nicht in Vercel setzen, hosted Supabase
konfiguriert Google im Dashboard): `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`,
`SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`.

---

## Laufender Betrieb

- **Deployen:** Merge nach `staging` deployt Staging, Merge nach `main` deployt Production. Vercel baut automatisch (CD).
- **Neue DB-Migration:** Datei in `supabase/migrations` anlegen, dann `supabase link --project-ref <ref>` und `supabase db push` pro Projekt (Staging zuerst testen).
- **Neue Tabelle, die der Webhook beschreibt:** braucht ein explizites `grant ... to service_role` in der Migration (sonst 42501).
- **Env-Variable ändern:** in Vercel setzen und neu deployen (Env-Änderungen greifen erst mit einem neuen Deployment).

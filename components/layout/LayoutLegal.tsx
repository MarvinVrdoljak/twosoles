import {getTranslations} from 'next-intl/server'
import {GlobalAppHeader} from '@/components/globals/GlobalAppHeader'
import {GlobalFooter} from '@/components/globals/GlobalFooter'
import {GlobalHeader} from '@/components/globals/GlobalHeader'
import {getUser} from '@/utility/supabase/user'
import styles from './LayoutLegal.module.css'

type LegalPage = 'imprint' | 'privacy' | 'terms'

type LegalSection = {
  heading: string
  body: string
}

type LayoutLegalProps = {
  page: LegalPage
}

// Shared shell for the static legal pages (imprint, privacy, terms): marketing
// header, a readable prose column and the shared footer. All content comes from
// the `legal` message namespace so both languages stay in sync.
export async function LayoutLegal({page}: LayoutLegalProps) {
  const t = await getTranslations('legal')
  const sections = t.raw(`${page}.sections`) as LegalSection[]
  const hasIntro = t.has(`${page}.intro`)

  // Show the chrome that matches the visitor's state: the app header (with the
  // account menu) when signed in, the marketing header otherwise — so a logged-in
  // user never sees the "Login / Sign up" bar on a legal page.
  const user = await getUser()

  return (
    <>
      {user ? <GlobalAppHeader /> : <GlobalHeader />}
      <main className={styles.root}>
        <article className={styles.article}>
          <header className={styles.header}>
            <h1 className={styles.title}>{t(`${page}.title`)}</h1>
            <p className={styles.meta}>
              {t('updatedLabel')}: {t('updated')}
            </p>
          </header>

          <p className={styles.note}>{t('placeholderNote')}</p>

          {hasIntro ? <p className={styles.intro}>{t(`${page}.intro`)}</p> : null}

          {sections.map((section, index) => (
            <section key={index} className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.heading}</h2>
              <p className={styles.body}>{section.body}</p>
            </section>
          ))}
        </article>
      </main>
      <GlobalFooter />
    </>
  )
}

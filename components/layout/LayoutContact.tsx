import {getTranslations} from 'next-intl/server'
import {Clock, Heart, Mail} from 'lucide-react'
import {FormContact} from '@/components/form/FormContact'
import {GlobalAppHeader} from '@/components/globals/GlobalAppHeader'
import {GlobalFooter} from '@/components/globals/GlobalFooter'
import {GlobalHeader} from '@/components/globals/GlobalHeader'
import {getUser} from '@/utility/supabase/user'
import styles from './LayoutContact.module.css'

// Contact page shell: marketing/app header (matching the visitor's auth state,
// like the legal pages), a two-column layout — direct contact info on the left,
// the message form on the right — and the shared footer.
export async function LayoutContact() {
  const t = await getTranslations('contact')
  const user = await getUser()

  const infoCards = [
    {icon: Mail, title: t('info.email.title'), text: t('info.email.value'), highlight: true},
    {icon: Clock, title: t('info.response.title'), text: t('info.response.value')},
    {icon: Heart, title: t('info.bigEvent.title'), text: t('info.bigEvent.value')},
  ]

  return (
    <>
      {user ? <GlobalAppHeader /> : <GlobalHeader />}
      <main className={styles.root}>
        <div className={styles.inner}>
          <header className={styles.header}>
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </header>

          <div className={styles.grid}>
            <aside className={styles.info}>
              <h2 className={styles.infoTitle}>{t('info.title')}</h2>
              <p className={styles.infoLead}>{t('info.lead')}</p>

              <ul className={styles.cards}>
                {infoCards.map(({icon: Icon, title, text, highlight}) => (
                  <li key={title} className={styles.cardItem}>
                    <span className={styles.cardIcon} aria-hidden="true">
                      <Icon size={20} />
                    </span>
                    <div className={styles.cardBody}>
                      <p className={styles.cardTitle}>{title}</p>
                      {highlight ? (
                        <a className={styles.cardMail} href={`mailto:${text}`}>
                          {text}
                        </a>
                      ) : (
                        <p className={styles.cardText}>{text}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </aside>

            <div className={styles.formColumn}>
              <FormContact />
            </div>
          </div>
        </div>
      </main>
      <GlobalFooter />
    </>
  )
}

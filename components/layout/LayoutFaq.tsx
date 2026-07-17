import {getTranslations} from 'next-intl/server'
import {GlobalAppHeader} from '@/components/globals/GlobalAppHeader'
import {GlobalFooter} from '@/components/globals/GlobalFooter'
import {GlobalHeader} from '@/components/globals/GlobalHeader'
import {ItemFaq} from '@/components/items/ItemFaq'
import {Link} from '@/i18n/navigation'
import {getUser} from '@/utility/supabase/user'
import styles from './LayoutFaq.module.css'

type FaqCategory = {
  heading: string
  items: Array<{question: string; answer: string}>
}

// Full FAQ page: an intro plus the questions grouped into categories, each a
// heading over an accordion. All content lives in the `faqPage` message
// namespace so both languages stay in sync.
export async function LayoutFaq() {
  const t = await getTranslations('faqPage')
  const categories = t.raw('categories') as FaqCategory[]

  // Match the chrome to the visitor's state: app header (with account menu) when
  // signed in, marketing header otherwise — same rule as the legal pages.
  const user = await getUser()

  return (
    <>
      {user ? <GlobalAppHeader /> : <GlobalHeader />}
      <main className={styles.root}>
        <article className={styles.article}>
          <header className={styles.header}>
            <p className="eyebrow">{t('eyebrow')}</p>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>
              {t.rich('subtitle', {
                contact: (chunks) => (
                  <Link className={styles.support} href="/contact">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </header>

          {categories.map((category, index) => (
            <section key={index} className={styles.category}>
              <h2 className={styles.categoryTitle}>{category.heading}</h2>
              <div className={styles.accordion}>
                {category.items.map((item, itemIndex) => (
                  <ItemFaq
                    key={itemIndex}
                    question={item.question}
                    answer={item.answer}
                  />
                ))}
              </div>
            </section>
          ))}

          <p className={styles.contactNote}>
            {t.rich('contactNote', {
              support: (chunks) => (
                <Link className={styles.support} href="/contact">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </article>
      </main>
      <GlobalFooter />
    </>
  )
}

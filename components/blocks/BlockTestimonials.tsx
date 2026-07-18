import {getTranslations} from 'next-intl/server'
import {CommonReveal} from '@/components/common/CommonReveal'
import {ItemTestimonial} from '@/components/items/ItemTestimonial'
import styles from './BlockTestimonials.module.css'

type Testimonial = {
  quote: string
  name: string
  role: string
}

// "Stimmen" — social-proof quotes. In-page anchor target for the nav.
export async function BlockTestimonials() {
  const t = await getTranslations('testimonials')
  const items = t.raw('items') as Testimonial[]

  return (
    <section id="voices" className={styles.root} aria-labelledby="testimonials-title">
      <CommonReveal className={styles.header}>
        <p className="eyebrow">{t('eyebrow')}</p>
        <h2 id="testimonials-title" className={styles.title}>
          {t.rich('title', {
            accent: (chunks) => <em className={styles.accent}>{chunks}</em>,
          })}
        </h2>
      </CommonReveal>

      <CommonReveal tag="ul" className={styles.grid} delay={0.1}>
        {items.map((item, index) => (
          <ItemTestimonial
            key={index}
            quote={item.quote}
            name={item.name}
            role={item.role}
          />
        ))}
      </CommonReveal>
    </section>
  )
}

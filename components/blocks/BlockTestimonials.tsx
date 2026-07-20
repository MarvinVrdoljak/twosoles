import {getTranslations} from 'next-intl/server'
import {CommonReveal} from '@/components/common/CommonReveal'
import {CommonTitleReveal} from '@/components/common/CommonTitleReveal'
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
      <div className={styles.header}>
        <CommonReveal tag="p" className="eyebrow">
          {t('eyebrow')}
        </CommonReveal>
        <CommonTitleReveal
          tag="h2"
          id="testimonials-title"
          className={styles.title}
          accentClassName={styles.accent}
          text={t.raw('title') as string}
        />
      </div>

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

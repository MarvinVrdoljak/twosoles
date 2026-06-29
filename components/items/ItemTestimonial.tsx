import {Heart} from 'lucide-react'
import styles from './ItemTestimonial.module.css'

type ItemTestimonialProps = {
  quote: string
  name: string
  role: string
}

// A single testimonial card. Rendered inside the BlockTestimonials list.
export function ItemTestimonial({quote, name, role}: ItemTestimonialProps) {
  return (
    <li className={styles.root}>
      <div className={styles.body}>
        <Heart className={styles.heart} size={20} fill="currentColor" aria-hidden="true" />
        <blockquote className={styles.quote}>{quote}</blockquote>
      </div>
      <div className={styles.head}>
        <p className={styles.name}>{name}</p>
        <p className="eyebrow eyebrowSmall">{role}</p>
      </div>
    </li>
  )
}

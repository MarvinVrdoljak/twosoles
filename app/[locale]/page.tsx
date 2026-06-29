import {setRequestLocale} from 'next-intl/server'
import {redirect} from 'next/navigation'
import {BlockCta} from '@/components/blocks/BlockCta'
import {BlockFaq} from '@/components/blocks/BlockFaq'
import {BlockHero} from '@/components/blocks/BlockHero'
import {BlockPricing} from '@/components/blocks/BlockPricing'
import {BlockQuote} from '@/components/blocks/BlockQuote'
import {BlockSteps} from '@/components/blocks/BlockSteps'
import {BlockTestimonials} from '@/components/blocks/BlockTestimonials'
import {BlockTicker} from '@/components/blocks/BlockTicker'
import {GlobalFooter} from '@/components/globals/GlobalFooter'
import {GlobalHeader} from '@/components/globals/GlobalHeader'
import {getPathname} from '@/i18n/navigation'
import type {Locale} from '@/i18n/routing'
import {getUser} from '@/utility/supabase/user'

type HomeProps = {
  params: Promise<{locale: Locale}>
}

// Public marketing landing page — only for visitors who are NOT signed in.
// Authenticated users are sent straight to the host area.
export default async function Home({params}: HomeProps) {
  const {locale} = await params
  setRequestLocale(locale)

  if (await getUser()) {
    redirect(getPathname({href: '/host', locale}))
  }

  return (
    <>
      <GlobalHeader />
      <main>
        <BlockHero />
        <BlockTicker />
        <BlockSteps />
        <BlockQuote />
        <BlockPricing />
        <BlockTestimonials />
        <BlockFaq />
        <BlockCta />
      </main>
      <GlobalFooter />
    </>
  )
}

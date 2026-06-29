import {createNavigation} from 'next-intl/navigation'
import {routing} from './routing'

// Locale-aware navigation. Import Link/useRouter/usePathname from HERE,
// never from next/link or next/navigation, or locale prefixing breaks.
export const {Link, getPathname, redirect, usePathname, useRouter} = createNavigation(routing)

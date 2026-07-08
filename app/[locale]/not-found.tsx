import {LayoutNotFound} from '@/components/layout/LayoutNotFound'

// Rendered whenever `notFound()` is triggered inside the [locale] segment —
// including the [...rest] catch-all below, so any unknown URL lands here with
// the correct locale chrome.
export default function NotFoundPage() {
  return <LayoutNotFound />
}

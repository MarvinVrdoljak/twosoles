import NextImage, {type ImageProps} from 'next/image'

// Thin wrapper around next/image so image handling stays consistent app-wide.
// `alt` is required (accessibility) — pass an empty string only for purely
// decorative images.
type CommonImageProps = ImageProps & {alt: string}

export function CommonImage({alt, ...props}: CommonImageProps) {
  return <NextImage alt={alt} {...props} />
}

import { cn } from "@/lib/utils"

export function BrandLogo({ className }: { className?: string }) {
  return (
    <span dir="ltr" aria-label="Rasid" className={cn("inline-flex shrink-0 items-center gap-2.5 text-foreground", className)}>
      <svg viewBox="0 0 64 64" className="size-8 shrink-0" aria-hidden="true">
        <path fill="#3459E6" d="M5 5h32c15 0 23 8 23 20 0 10-7 17-18 18H31l-9-9h15c8 0 12-3 12-9s-4-9-12-9H5Z" />
        <path fill="#23C6B8" d="M5 58V37c0-10 7-17 18-17h17c-2 10-8 15-18 15-6 0-11 9-17 23Z" />
        <path fill="#3459E6" d="M22 42h18l23 17H43Z" />
      </svg>
      <span aria-hidden="true" className="font-heading text-2xl font-semibold tracking-[-0.055em]">rasid</span>
    </span>
  )
}

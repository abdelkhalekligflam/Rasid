import { Skeleton } from "@/components/ui/skeleton"

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Chargement" className="space-y-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-7 w-24" />
          </div>
        </div>
      ))}
      <span className="sr-only">Chargement des données...</span>
    </div>
  )
}

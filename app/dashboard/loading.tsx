import { PageSkeleton } from "@/components/shared/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-7">
      <div className="space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-48" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-40 rounded-2xl" />)}
      </div>
      <PageSkeleton rows={2} />
    </div>
  )
}

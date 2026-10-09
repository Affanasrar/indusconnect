export function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-[#DCE5F0] bg-white p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="h-8 w-16 bg-slate-200 rounded" />
        </div>
        <div className="h-11 w-11 bg-slate-100 rounded-lg" />
      </div>
      <div className="mt-4 pt-2.5 border-t border-slate-100">
        <div className="h-2.5 w-32 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 animate-pulse">
      <div className="h-10 bg-slate-100 rounded-lg w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-white border border-[#DCE5F0] rounded-lg w-full" />
      ))}
    </div>
  );
}

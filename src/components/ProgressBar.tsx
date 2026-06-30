export function ProgressBar({ step, total }: { step: number; total: number }) {
  const percent = Math.min(100, Math.max(0, (step / total) * 100));

  return (
    <div className="h-[3px] w-full bg-slate-200">
      <div
        className="h-full bg-blue-600 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

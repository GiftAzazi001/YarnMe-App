type AnimatedCircularProgressBarProps = {
  value: number;
  min?: number;
  max?: number;
  label: string;
  ariaLabel?: string;
  className?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function AnimatedCircularProgressBar({
  value,
  min = 0,
  max = 100,
  label,
  ariaLabel,
  className = "",
}: AnimatedCircularProgressBarProps) {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const boundedValue = clamp(value, safeMin, safeMax);
  const range = safeMax - safeMin || 1;
  const percent = ((boundedValue - safeMin) / range) * 100;
  const displayValue = Math.round(boundedValue);

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel ?? label}
      aria-valuemin={safeMin}
      aria-valuemax={safeMax}
      aria-valuenow={displayValue}
      className={`relative flex aspect-square w-[132px] items-center justify-center sm:w-[148px] lg:w-[156px] ${className}`}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#DDEBDD"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          pathLength={100}
          stroke="#0F6B4F"
          strokeDasharray="100"
          strokeDashoffset={100 - percent}
          strokeLinecap="round"
          strokeWidth="8"
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>

      <div className="relative flex h-[74%] w-[74%] flex-col items-center justify-center rounded-full bg-surface-container-lowest text-center shadow-soft">
        <span className="text-headline-md text-primary">{displayValue}%</span>
        <span className="mt-0.5 max-w-[92px] text-label-sm leading-tight text-on-surface-variant">
          {label}
        </span>
      </div>
    </div>
  );
}

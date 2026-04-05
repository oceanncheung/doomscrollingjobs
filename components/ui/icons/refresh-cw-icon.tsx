interface RefreshCwIconProps {
  className?: string
  height?: number
  width?: number
}

export function RefreshCwIcon({ className, height = 24, width = 24 }: RefreshCwIconProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={height}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.15"
      viewBox="0 0 24 24"
      width={width}
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}

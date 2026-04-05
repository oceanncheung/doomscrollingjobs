interface ChevronDownIconProps {
  className?: string
  height?: number
  width?: number
}

export function ChevronDownIcon({
  className,
  height = 12,
  width = 12,
}: ChevronDownIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={height}
      viewBox="0 0 12 12"
      width={width}
    >
      <path
        d="M3.25 4.5 6 7.25 8.75 4.5"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.2"
      />
    </svg>
  )
}

interface PlusIconProps {
  className?: string
  height?: number
  width?: number
}

export function PlusIcon({ className, height = 14, width = 14 }: PlusIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={height}
      viewBox="0 0 14 14"
      width={width}
    >
      <path d="M7 3V11" stroke="currentColor" strokeLinecap="square" strokeWidth="1.2" />
      <path d="M3 7H11" stroke="currentColor" strokeLinecap="square" strokeWidth="1.2" />
    </svg>
  )
}

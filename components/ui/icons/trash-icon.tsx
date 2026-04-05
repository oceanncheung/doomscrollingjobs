interface TrashIconProps {
  className?: string
  height?: number
  width?: number
}

export function TrashIcon({ className, height = 14, width = 14 }: TrashIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={height}
      viewBox="0 0 14 14"
      width={width}
    >
      <path
        d="M4.25 4.5V10.25M7 4.5V10.25M9.75 4.5V10.25M3 3h8M5 3V2h4v1M4 12h6"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.2"
      />
    </svg>
  )
}

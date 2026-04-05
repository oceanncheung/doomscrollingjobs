interface UploadIconProps {
  className?: string
  height?: number
  width?: number
}

export function UploadIcon({ className, height = 14, width = 14 }: UploadIconProps) {
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
        d="M7 10.5V3.5M4.5 6 7 3.5 9.5 6M3 11.5h8"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.2"
      />
    </svg>
  )
}

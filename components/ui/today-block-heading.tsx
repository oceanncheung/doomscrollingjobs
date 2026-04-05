import { LabeledHeading } from '@/components/ui/labeled-heading'

interface TodayBlockHeadingProps {
  className?: string
  label: string
  title: string
}

export function TodayBlockHeading({ className, label, title }: TodayBlockHeadingProps) {
  return (
    <LabeledHeading
      className={['today-block-heading', className].filter(Boolean).join(' ')}
      label={label}
      title={title}
    />
  )
}

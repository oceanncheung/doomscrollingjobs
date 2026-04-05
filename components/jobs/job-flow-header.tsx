import type { JobFlowHeaderViewModel } from '@/lib/jobs/job-flow-view-model'

interface JobFlowHeaderProps {
  header: JobFlowHeaderViewModel
}

export function JobFlowHeader({ header }: JobFlowHeaderProps) {
  return (
    <section className="page-header flow-header job-flow-header detail-page-header">
      <div className="job-flow-header-stack detail-page-header-stack">
        <div className="page-heading job-flow-heading">
          <div className="job-flow-heading-main">
            <p className="panel-label">{header.pageLabel}</p>
            <h1>{header.title}</h1>
            <p className="job-flow-company">{header.companyName}</p>
            {header.introLines.map((line) => (
              <p className="job-flow-intro" key={line}>
                {line}
              </p>
            ))}
          </div>
        </div>
        <div className="flow-snapshot job-flow-snapshot detail-page-snapshot">
          {header.snapshotItems.map((item) => (
            <div key={item.label}>
              <span className="panel-label">{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

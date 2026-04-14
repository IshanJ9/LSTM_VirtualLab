import type { ReactNode } from 'react'

interface StageCardProps {
  title: string
  intro: string
  children: ReactNode
  className?: string
}

export default function StageCard({ title, intro, children, className = '' }: StageCardProps) {
  return (
    <section className={`stage-card ${className}`.trim()}>
      <header className="stage-top">
        <h2>{title}</h2>
        <p>{intro}</p>
      </header>
      <div className="stage-body">{children}</div>
    </section>
  )
}

import { Link } from 'react-router-dom'
import { Check, ChevronRight } from 'lucide-react'

const STEPS = [
  { id: 'registration', number: '1', label: 'Register', detail: 'Patient details', to: '/patients?action=register' },
  { id: 'queue', number: '2', label: 'Queue', detail: 'Token & doctor', to: '/appointments?action=book' },
  { id: 'consultation', number: '3', label: 'Consult', detail: 'Vitals & prescription', to: '/opd' },
  { id: 'payment', number: '4', label: 'Payment', detail: 'Bill & receipt', to: '/billing' },
]

export default function CareJourney({ current }) {
  const currentIndex = STEPS.findIndex(step => step.id === current)
  return (
    <section className="mca-care-journey" aria-label="Patient care journey">
      <div className="mca-care-journey-title">
        <span>Patient journey</span>
        <small>चार आसान चरण · Four simple steps</small>
      </div>
      <div className="mca-care-steps">
        {STEPS.map((step, index) => {
          const active = step.id === current
          const complete = index < currentIndex
          return <div className="mca-care-step-wrap" key={step.id}>
            <Link to={step.to} className={`mca-care-step ${active ? 'active' : ''} ${complete ? 'complete' : ''}`} aria-current={active ? 'step' : undefined}>
              <span className="mca-care-number">{complete ? <Check/> : step.number}</span>
              <span><strong>{step.label}</strong><small>{step.detail}</small></span>
            </Link>
            {index < STEPS.length - 1 && <ChevronRight className="mca-care-arrow"/>}
          </div>
        })}
      </div>
    </section>
  )
}

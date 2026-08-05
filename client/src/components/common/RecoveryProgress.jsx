import { FiCheck } from 'react-icons/fi'

const steps = ['Email', 'Verify', 'Password']

function RecoveryProgress({ currentStep }) {
  return <ol className="mb-7 grid grid-cols-3" aria-label="Password recovery progress">
    {steps.map((label, index) => {
      const step = index + 1
      const complete = currentStep > step
      const active = currentStep === step
      return <li key={label} className="relative text-center" aria-current={active ? 'step' : undefined}>
        {index > 0 && <span className={`absolute right-1/2 top-[1.1rem] h-px w-full ${complete || active ? 'bg-rosewood/60' : 'bg-gold/20'}`} aria-hidden="true" />}
        <span className={`relative z-10 mx-auto grid h-9 w-9 place-items-center rounded-full border text-xs font-bold transition-colors ${complete ? 'border-rosewood bg-rosewood text-white' : active ? 'border-rosewood bg-pink-light text-rosewood shadow-[0_0_0_5px_rgba(246,184,206,0.18)]' : 'border-gold/25 bg-white text-muted'}`}>{complete ? <FiCheck aria-hidden="true" /> : step}</span>
        <span className={`mt-2 block text-[.65rem] font-semibold sm:text-xs ${active ? 'text-rosewood' : complete ? 'text-ink' : 'text-muted'}`}>{label}</span>
      </li>
    })}
  </ol>
}

export default RecoveryProgress

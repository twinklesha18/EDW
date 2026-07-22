import PageBanner from '../components/common/PageBanner.jsx'
import PageTransition from '../components/common/PageTransition.jsx'
import { policies } from '../data/policies.js'

function PolicyPage({ policyKey }) {
  const policy = policies[policyKey]
  return (
    <PageTransition>
      <PageBanner eyebrow={policy.eyebrow} title={policy.title} description={policy.description} />
      <section className="section-shell py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-7 rounded-2xl border border-gold/20 bg-pink-light/55 p-5 text-sm leading-6 text-muted"><strong className="text-ink">Draft status:</strong> This Phase 2 content is an editable placeholder and does not establish a final business policy.</div>
          <div className="divide-y divide-gold/15 rounded-[1.75rem] border border-gold/15 bg-white px-6 sm:px-8">
            {policy.sections.map((section, index) => (
              <details key={section.title} className="group py-6" open={index === 0}>
                <summary className="cursor-pointer list-none font-serif text-xl font-semibold text-ink marker:hidden">{section.title}</summary>
                <p className="mt-4 text-sm leading-7 text-muted">{section.body}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  )
}

export default PolicyPage

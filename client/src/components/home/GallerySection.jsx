import { FiInstagram } from 'react-icons/fi'
import { galleryImages } from '../../data/gallery.js'
import SectionTitle from '../common/SectionTitle.jsx'

function GallerySection() {
  return (
    <section className="section-shell py-16 sm:py-24">
      <div className="mx-auto flex justify-center"><SectionTitle eyebrow="Behind the beauty" title="Our Creative World" subtitle="A little look at the love and creativity behind our gifts." /></div>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {galleryImages.map((item) => (
          <figure key={item.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-pink-light">
            <img src={item.image} alt={item.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 grid place-items-center bg-ink/0 text-white opacity-0 transition-all group-hover:bg-ink/35 group-hover:opacity-100"><FiInstagram size={24} aria-hidden="true" /></div>
          </figure>
        ))}
      </div>
    </section>
  )
}

export default GallerySection

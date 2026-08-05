import { FiInstagram } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { galleryImages } from '../../data/gallery.js'
import SectionTitle from '../common/SectionTitle.jsx'
import { responsiveImageProps } from '../../utils/imageUrl.js'

function GallerySection() {
  const banners = useSelector((state) => state.catalog.banners)
  const catalogLoaded = useSelector((state) => state.catalog.loaded)
  const managedGallery = banners
    .filter((item) => item.position === 'gallery')
    .map((item) => ({ id: item.id || item._id, image: item.image?.url, alt: item.title }))
  const images = managedGallery.length ? managedGallery : (catalogLoaded ? galleryImages : [])
  return (
    <section className="section-shell py-16 sm:py-24">
      <div className="mx-auto flex justify-center"><SectionTitle eyebrow="Behind the beauty" title="Our Creative World" subtitle="A little look at the love and creativity behind our gifts." /></div>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {images.length ? images.map((item) => (
          <figure key={item.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-pink-light">
            <img {...responsiveImageProps(item.image, [240, 360, 480, 720, 960])} sizes="(min-width: 1024px) 16vw, (min-width: 768px) 33vw, 50vw" alt={item.alt} width="960" height="960" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 grid place-items-center bg-ink/0 text-white opacity-0 transition-all group-hover:bg-ink/35 group-hover:opacity-100"><FiInstagram size={24} aria-hidden="true" /></div>
          </figure>
        )) : Array.from({ length: 6 }, (_value, index) => <div key={index} className="aspect-square animate-pulse rounded-2xl bg-gradient-to-br from-pink-light to-blue-light" aria-hidden="true" />)}
      </div>
    </section>
  )
}

export default GallerySection

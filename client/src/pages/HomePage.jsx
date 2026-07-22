import FeaturedCategories from '../components/home/FeaturedCategories.jsx'
import FeaturedProducts from '../components/home/FeaturedProducts.jsx'
import GallerySection from '../components/home/GallerySection.jsx'
import HeroSection from '../components/home/HeroSection.jsx'
import HowItWorks from '../components/home/HowItWorks.jsx'
import NewArrivals from '../components/home/NewArrivals.jsx'
import Newsletter from '../components/home/Newsletter.jsx'
import OccasionsSection from '../components/home/OccasionsSection.jsx'
import PromoBanner from '../components/home/PromoBanner.jsx'
import TestimonialsSection from '../components/home/TestimonialsSection.jsx'
import WhyChooseUs from '../components/home/WhyChooseUs.jsx'
import PageTransition from '../components/common/PageTransition.jsx'

function HomePage() {
  return (
    <PageTransition>
      <HeroSection />
      <FeaturedCategories />
      <FeaturedProducts />
      <OccasionsSection />
      <PromoBanner />
      <NewArrivals />
      <WhyChooseUs />
      <HowItWorks />
      <TestimonialsSection />
      <GallerySection />
      <Newsletter />
    </PageTransition>
  )
}

export default HomePage

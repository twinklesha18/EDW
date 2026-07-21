import { Link } from 'react-router-dom'
import { brandLogo } from '../../assets/images/index.js'
import { useBrand } from '../../hooks/useBrand.js'

function Logo({ onClick, size = 'default' }) {
  const { name } = useBrand()
  const dimensions = size === 'large' ? 'h-24 w-24 sm:h-28 sm:w-28' : 'h-14 w-14 sm:h-16 sm:w-16'

  return (
    <Link to="/" onClick={onClick} className="block w-fit shrink-0" aria-label={`${name} home`}>
      <img src={brandLogo} alt={`${name} logo`} className={`${dimensions} rounded-full object-contain`} />
    </Link>
  )
}

export default Logo

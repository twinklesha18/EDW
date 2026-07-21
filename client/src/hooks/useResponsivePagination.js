import { useCallback, useEffect, useMemo, useState } from 'react'

export function useResponsivePagination(items, { desktop = 3, tablet = 2, mobile = 1 } = {}) {
  const calculatePageSize = useCallback(() => {
    if (typeof window === 'undefined') return desktop
    if (window.innerWidth >= 1024) return desktop
    if (window.innerWidth >= 520) return tablet
    return mobile
  }, [desktop, mobile, tablet])

  const [page, setPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(calculatePageSize)
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage))

  const visibleItems = useMemo(() => {
    const start = page * itemsPerPage
    return items.slice(start, start + itemsPerPage)
  }, [items, itemsPerPage, page])

  useEffect(() => {
    const updatePageSize = () => setItemsPerPage(calculatePageSize())
    window.addEventListener('resize', updatePageSize, { passive: true })
    return () => window.removeEventListener('resize', updatePageSize)
  }, [calculatePageSize])

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1))
  }, [totalPages])

  const previousPage = () => setPage((current) => (current - 1 + totalPages) % totalPages)
  const nextPage = () => setPage((current) => (current + 1) % totalPages)
  const changeFromSwipe = (_event, info) => {
    if (info.offset.x < -55) nextPage()
    if (info.offset.x > 55) previousPage()
  }

  return {
    page,
    setPage,
    itemsPerPage,
    totalPages,
    visibleItems,
    previousPage,
    nextPage,
    changeFromSwipe,
  }
}

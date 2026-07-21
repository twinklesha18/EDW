import { useCallback, useEffect, useState } from 'react'
import { getApiError } from '../services/api.js'

export function useAdminQuery(fetcher) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const load = useCallback(async () => { setState((current) => ({ ...current, loading: true, error: '' })); try { const data = await fetcher(); setState({ data, loading: false, error: '' }) } catch (error) { setState({ data: null, loading: false, error: getApiError(error).message }) } }, [fetcher])
  useEffect(() => { load() }, [load])
  return { ...state, reload: load, setData: (data) => setState((current) => ({ ...current, data })) }
}

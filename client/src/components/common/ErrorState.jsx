import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi'
function ErrorState({ message = 'Something went wrong.', onRetry }) { return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><FiAlertCircle className="mx-auto text-2xl text-red-500" /><p className="mt-2 text-sm text-red-700">{message}</p>{onRetry && <button type="button" className="secondary-button mt-4 min-h-10" onClick={onRetry}><FiRefreshCw /> Try again</button>}</div> }
export default ErrorState

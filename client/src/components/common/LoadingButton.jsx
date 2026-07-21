function LoadingButton({ loading, children, className = 'primary-button w-full', ...props }) {
  return <button disabled={loading || props.disabled} className={className} {...props}>{loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}{loading ? 'Please wait…' : children}</button>
}
export default LoadingButton

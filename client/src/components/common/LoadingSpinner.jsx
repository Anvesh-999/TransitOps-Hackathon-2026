/**
 * Loading spinner — centered, configurable size.
 * Usage: <LoadingSpinner /> or <LoadingSpinner size="lg" />
 */
const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-primary ${sizes[size]}`}></div>
    </div>
  );
};

export default LoadingSpinner;

// Centralized error handling utilities

export function getErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error_description) {
    return error.error_description;
  }

  return 'An unexpected error occurred. Please try again.';
}

export function isNetworkError(error: any): boolean {
  return (
    error?.code === 'ECONNABORTED' ||
    error?.message?.includes('network') ||
    error?.message?.includes('Network') ||
    error?.message?.includes('fetch')
  );
}

export function shouldRetry(error: any): boolean {
  return isNetworkError(error) || error?.code === 'PGRST301';
}

import { message } from 'antd';

export interface ErrorInfo {
  message: string;
  title?: string;
  duration?: number;
  type?: 'error' | 'warning' | 'info' | 'success';
}

/**
 * Centralized error handling utility
 */
export class ErrorHandler {
  /**
   * Shows a user-friendly error message
   */
  static showError(error: ErrorInfo | string | Error) {
    let errorInfo: ErrorInfo;

    if (typeof error === 'string') {
      errorInfo = { message: error };
    } else if (error instanceof Error) {
      errorInfo = {
        message: error.message || 'An unexpected error occurred',
        title: error.name,
      };
    } else {
      errorInfo = error;
    }

    const { message: msg, duration = 4.5, type = 'error' } = errorInfo;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorHandler]', errorInfo);
    }

    // Show user-friendly message
    message[type](msg, duration);
  }

  /**
   * Shows a warning message
   */
  static showWarning(message: string, duration: number = 4) {
    this.showError({ message, type: 'warning', duration });
  }

  /**
   * Shows an info message
   */
  static showInfo(message: string, duration: number = 3) {
    this.showError({ message, type: 'info', duration });
  }

  /**
   * Shows a success message
   */
  static showSuccess(message: string, duration: number = 3) {
    this.showError({ message, type: 'success', duration });
  }

  /**
   * Handles file operation errors
   */
  static handleFileError(_error: Error, operation: string) {
    const errorMessage = `Failed to ${operation}. Please check file permissions and try again.`;
    this.showError({
      message: errorMessage,
      title: 'File Operation Error',
    });
  }

  /**
   * Handles validation errors
   */
  static handleValidationError(errors: string[]) {
    if (errors.length === 0) return;

    const errorMessage =
      errors.length === 1
        ? errors[0]
        : `Please fix the following errors:\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;

    this.showError({
      message: errorMessage,
      title: 'Validation Error',
      type: 'warning',
    });
  }

  /**
   * Handles network/API errors
   */
  static handleNetworkError(error: Error) {
    this.showError({
      message: 'Network error. Please check your connection and try again.',
      title: 'Connection Error',
    });
  }

  /**
   * Wraps an async function with error handling
   */
  static async wrapAsync<T>(
    fn: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Error) {
        this.showError(errorMessage || error.message);
      } else {
        this.showError(errorMessage || 'An unexpected error occurred');
      }
      return null;
    }
  }
}

export default ErrorHandler;


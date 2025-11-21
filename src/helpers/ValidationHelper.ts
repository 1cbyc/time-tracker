import TaskModel from '../modules/tasks/models/TaskModel';
import ProjectModel from '../modules/projects/models/ProjectModel';
import { ITimeRangeModel } from '../modules/tasks/models/TaskModel';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validation helper for data integrity
 */
export class ValidationHelper {
  /**
   * Validates a task title
   */
  static validateTaskTitle(title: string): ValidationResult {
    const errors: string[] = [];

    if (!title || typeof title !== 'string') {
      errors.push('Task title is required');
    } else {
      const trimmed = title.trim();
      if (trimmed.length === 0) {
        errors.push('Task title cannot be empty');
      } else if (trimmed.length > 500) {
        errors.push('Task title must be 500 characters or less');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a project title
   */
  static validateProjectTitle(title: string): ValidationResult {
    const errors: string[] = [];

    if (!title || typeof title !== 'string') {
      errors.push('Project title is required');
    } else {
      const trimmed = title.trim();
      if (trimmed.length === 0) {
        errors.push('Project title cannot be empty');
      } else if (trimmed.length > 200) {
        errors.push('Project title must be 200 characters or less');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a project color
   */
  static validateProjectColor(color: string | undefined): ValidationResult {
    const errors: string[] = [];

    if (color && typeof color === 'string') {
      // Validate hex color format
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(color)) {
        errors.push('Project color must be a valid hex color (e.g., #FF5733)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a time range
   */
  static validateTimeRange(timeRange: ITimeRangeModel): ValidationResult {
    const errors: string[] = [];

    if (!timeRange.start || !(timeRange.start instanceof Date)) {
      errors.push('Start time is required');
    }

    if (timeRange.end) {
      if (!(timeRange.end instanceof Date)) {
        errors.push('End time must be a valid date');
      } else if (timeRange.start && timeRange.start instanceof Date) {
        if (timeRange.end.getTime() < timeRange.start.getTime()) {
          errors.push('End time must be after start time');
        }
      }
    }

    if (timeRange.description && typeof timeRange.description === 'string') {
      if (timeRange.description.length > 1000) {
        errors.push('Time entry description must be 1000 characters or less');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a complete task
   */
  static validateTask(task: TaskModel): ValidationResult {
    const errors: string[] = [];

    // Validate title
    const titleValidation = this.validateTaskTitle(task.title);
    errors.push(...titleValidation.errors);

    // Validate project ID exists (if provided)
    if (task.projectId && task.projectId.trim().length === 0) {
      errors.push('Project ID cannot be empty if provided');
    }

    // Validate time ranges
    if (task.time && Array.isArray(task.time)) {
      task.time.forEach((timeRange, index) => {
        const timeValidation = this.validateTimeRange(timeRange);
        if (!timeValidation.valid) {
          errors.push(`Time entry ${index + 1}: ${timeValidation.errors.join(', ')}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a complete project
   */
  static validateProject(project: ProjectModel): ValidationResult {
    const errors: string[] = [];

    // Validate title
    const titleValidation = this.validateProjectTitle(project.title);
    errors.push(...titleValidation.errors);

    // Validate color (optional)
    if (project.color) {
      const colorValidation = this.validateProjectColor(project.color);
      errors.push(...colorValidation.errors);
    }

    // Validate key
    if (!project.key || typeof project.key !== 'string' || project.key.trim().length === 0) {
      errors.push('Project key is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitizes a string input (trims and limits length)
   */
  static sanitizeString(input: string, maxLength: number = 500): string {
    if (typeof input !== 'string') {
      return '';
    }
    return input.trim().substring(0, maxLength);
  }

  /**
   * Validates that a date is valid
   */
  static isValidDate(date: any): date is Date {
    return date instanceof Date && !isNaN(date.getTime());
  }
}

export default ValidationHelper;


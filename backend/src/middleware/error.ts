import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

const validationFieldLabels: Record<string, string> = {
  headline: 'Headline',
  location: 'Location',
  university: 'University',
  major: 'Major',
  graduationYear: 'Graduation year',
  gpa: 'GPA',
  careerInterests: 'Career interests',
  courses: 'Courses',
  transcriptName: 'Transcript',
  targetRoleId: 'Target role',
  currentSkills: 'Current skills'
};

export function formatZodValidationMessage(error: ZodError) {
  const issue = error.issues[0];
  if (!issue) return 'Please check the submitted information.';

  const field = typeof issue.path[0] === 'string' ? issue.path[0] : '';
  const label = validationFieldLabels[field] ?? 'Request';
  return `${label}: ${issue.message}`;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, 'NOT_FOUND', 'The requested resource was not found.'));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: formatZodValidationMessage(error),
        details: error.flatten()
      }
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }

  console.error(error);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error.'
    }
  });
}

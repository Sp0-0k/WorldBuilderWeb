import { FastifyReply } from 'fastify'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, message)
    this.name = 'NotFoundError'
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(400, message)
    this.name = 'BadRequestError'
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, message)
    this.name = 'ConflictError'
  }
}

export function sendError(reply: FastifyReply, err: unknown): FastifyReply {
  if (err instanceof AppError) {
    return reply.status(err.statusCode).send({ error: err.message })
  }
  if (err instanceof ZodError) {
    return reply.status(400).send({ error: err.issues[0]?.message ?? 'Validation error' })
  }
  return reply.status(500).send({ error: 'Internal server error' })
}

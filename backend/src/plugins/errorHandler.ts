import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { AppError } from '../lib/errors'

async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((err: any, _request, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.statusCode).send({ error: err.message })
    }

    // Zod validation errors surfaced as 400
    if (err.statusCode === 400) {
      return reply.status(400).send({ error: err.message })
    }

    fastify.log.error(err)
    return reply.status(500).send({ error: 'Internal server error' })
  })
}

export default fp(errorHandlerPlugin, { name: 'errorHandler' })

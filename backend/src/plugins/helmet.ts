import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'
import { FastifyInstance } from 'fastify'

async function helmetPlugin(fastify: FastifyInstance) {
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  })
}

export default fp(helmetPlugin, { name: 'helmet' })

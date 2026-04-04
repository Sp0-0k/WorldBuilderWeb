import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import { FastifyInstance } from 'fastify'
import { env } from '../config/env'

async function corsPlugin(fastify: FastifyInstance) {
  const allowed = env.CORS_ORIGIN.split(',').map(o => o.trim())
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. curl, Postman, same-origin)
      if (!origin || allowed.includes(origin)) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
}

export default fp(corsPlugin, { name: 'cors' })

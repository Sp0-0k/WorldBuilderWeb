import { FastifyInstance } from 'fastify'
import { SearchRepository } from './search.repository'
import { SearchService } from './search.service'
import { SearchController } from './search.controller'

export async function searchRoutes(fastify: FastifyInstance) {
  const repo = new SearchRepository(fastify.prisma)
  const service = new SearchService(repo)
  const controller = new SearchController(service)

  fastify.get('/search', (req, reply) => controller.search(req, reply))
}

import { FastifyRequest, FastifyReply } from 'fastify'
import { SearchService } from './search.service'
import { SearchQuerySchema } from './search.schemas'
import { sendError } from '../../lib/errors'

export class SearchController {
  constructor(private readonly service: SearchService) {}

  async search(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = SearchQuerySchema.parse(req.query)
      const results = await this.service.search(params)
      return reply.send(results)
    } catch (err) {
      return sendError(reply, err)
    }
  }
}

import type { IDataService } from './IDataService';
import { APIService as MockService } from './MockDataService';
import { HttpDataService } from './HttpDataService';

/**
 * Toggle between localStorage (mock) and REST API backends.
 * Set VITE_USE_API=true in .env to use the Fastify backend.
 */
const useApi = import.meta.env.VITE_USE_API === 'true';

export const dataService: IDataService = useApi ? new HttpDataService() : MockService;

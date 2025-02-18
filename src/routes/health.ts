import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';


const router = Router();


/**
 * Health check route
 * @param req - The request object
 * @param res - The response object
 */
router.get('/health', (req: Request, res: Response) => {
    
    // Log the health check route being accessed
    logger.info('Health check route accessed');
    // Respond with a 200 success status
    res.status(200).send('Server is running!');

});

export default router;
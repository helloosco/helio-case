import { Router, Response, Request } from 'express';
import { logger } from '../utils/logger';
import { prepareTransaction } from '../services/moonshotService';

const router = Router();

/**
 * Express route handler for preparing a Moonshot transaction
 * @param req - The request object
 * @param res - The response object
 */
const prepare = async (req: Request, res: Response) => {
  try {
    const requestData = req.body;
    // logger.info("\n\nPrepare endpoint called", { requestData });

    const responseData = await prepareTransaction(requestData);

    res.status(200).json(responseData);

  } catch (error) {
    logger.error('Error in prepare endpoint', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

router.post('/prepare', prepare);

export { router, prepare };
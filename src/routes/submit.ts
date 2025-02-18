import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { submitTransaction } from '../services/submitService';


const router = Router();


/**
 * Submit a signed transaction to the Solana RPC
 * @param req - The request object
 * @param res - The response object
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {

    const requestData = req.body;
    // logger.info("Submit endpoint called", { requestData });

    const responseData = await submitTransaction(requestData);
  
    // return the response object with the transaction signature to the client
    res.status(200).json(responseData);    

  } catch (error) {

    // log the error
    logger.error('Error in submit endpoint', { error });
    // return a 500 error to the client
    res.status(500).json({ error: 'Internal Server Error' });

  }
});

export default router;
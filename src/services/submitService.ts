import { Connection, Transaction, PublicKey, VersionedTransaction, Commitment, VersionedMessage } from '@solana/web3.js';
import { validateBase64Encoding } from '../utils/validation';

export const submitTransaction = async (requestData: any) => {
    // validate and parse required params
    const transactionBase64Signed: string = validateBase64Encoding(requestData.transactionBase64Signed);
    
    // parse optional params, or fall back to default values if not provided
    const rpcUrl: string = requestData.rpcUrl || "https://api.devnet.solana.com";
    const commitment: Commitment = requestData.commitment as Commitment || 'confirmed';
  
    // decode and deserialize the transaction
    const transactionBuffer = Buffer.from(transactionBase64Signed, 'base64');
    const transaction = VersionedTransaction.deserialize(transactionBuffer);
  
    // create a connection to the Solana RPC
    const connection = new Connection(rpcUrl, commitment);

    // send the transaction to the Solana RPC
    const signature = await connection.sendTransaction(transaction, {
      skipPreflight: false,
      maxRetries: 3,
      preflightCommitment: commitment,
    });
    
  return {
    message: "Success",
    signature,
    timestamp: new Date().toISOString(),
  };
}; 
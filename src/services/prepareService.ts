import { prepareMoonshotTransaction, MoonshotConfig } from '../utils/moonshot';
import { validatePublicKeys, validateTradeDirection } from '../utils/validation';
import { createPriorityInstruction, createFeeInstruction } from '../utils/solana';
import { Connection, TransactionMessage, VersionedTransaction, Commitment } from '@solana/web3.js';
import { FixedSide } from '@wen-moon-ser/moonshot-sdk';
import { logger } from '../utils/logger';


export const prepareTransaction = async (requestData: any) => {
  const tradeDirection: "BUY" | "SELL" = validateTradeDirection(requestData.tradeDirection);
  let { signerPublicKey, mintPublicKey } = validatePublicKeys(requestData.signerAddress, requestData.mintAddress);
  const tokenAmount: bigint = BigInt(requestData.amountLamports);

  const rpcUrl: string = requestData.rpcUrl || "https://api.devnet.solana.com";
  const commitment: Commitment = requestData.commitment as Commitment || 'confirmed';
  const slippageBps: number = requestData.slippageBps || 500;
  const fixedSide: FixedSide = requestData.fixedSide || FixedSide.IN;
  const priorityFee: number = requestData.priorityFee || 200_000;

  const moonshotConfig: MoonshotConfig = {
    tradeDirection,
    signerPublicKey,
    mintPublicKey,
    tokenAmount,
    rpcUrl,
    commitment,
    slippageBps,
    fixedSide
  };

  const connection = new Connection(rpcUrl);
  const { ixs: moonshotIxs, collateralAmount } = await prepareMoonshotTransaction(moonshotConfig);
  const priorityFeeIx = createPriorityInstruction(priorityFee);
  const tradeFeeIx = createFeeInstruction(tradeDirection, tokenAmount, collateralAmount, signerPublicKey);

  const blockhash = await connection.getLatestBlockhash(commitment);

  const messageV0 = new TransactionMessage({
    payerKey: signerPublicKey,
    recentBlockhash: blockhash.blockhash,
    instructions: [priorityFeeIx, tradeFeeIx, ...moonshotIxs],
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  const transactionBase64 = Buffer.from(transaction.serialize()).toString('base64');

  return {
    message: "Success",
    transactionBase64,
    timestamp: new Date().toISOString(),
  };
}; 
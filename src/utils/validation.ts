import { PublicKey } from '@solana/web3.js';
import { logger } from './logger';

/**
 * Validate the public keys
 * @param signerAddress - The signer address
 * @param mintAddress - The mint address
 * @returns The signer public key and mint public key
 */
export function validatePublicKeys(signerAddress: string, mintAddress: string): { signerPublicKey: PublicKey, mintPublicKey: PublicKey } {
  try {
    const signerPublicKey = new PublicKey(signerAddress);
    const mintPublicKey = new PublicKey(mintAddress);

    if (!PublicKey.isOnCurve(signerPublicKey) || !PublicKey.isOnCurve(mintPublicKey)) {
      throw new Error("Invalid public key");
    }

    return { signerPublicKey, mintPublicKey };
  } catch (error) {
    logger.warn("Invalid public key provided", { error });
    throw new Error("Invalid public key provided for signer or mint address.");
  }
}

/**
 * Validate the trade direction
 * @param tradeDirection - The trade direction
 * @returns The trade direction
 */
export function validateTradeDirection(tradeDirection: any): "BUY" | "SELL" {
  if (tradeDirection !== "BUY" && tradeDirection !== "SELL") {
    throw new Error("Invalid trade direction. Must be 'BUY' or 'SELL'.");
  }
  return tradeDirection as "BUY" | "SELL";
}

/**
 * Validate the transaction is base64 encoded
 * @param transactionBase64Signed - The base64 encoded transaction
 * @returns The base64 encoded transaction
 */
export const validateBase64Encoding = (transactionBase64Signed: string): string => {
  const isBase64 = (str: string): boolean => {
    try {
      return Buffer.from(str, 'base64').toString('base64') === str;
    } catch (err) {
      return false;
    }
  };

  if (!isBase64(transactionBase64Signed)) {
    logger.error('Invalid Base64 string', { transactionBase64Signed });
    throw new Error('Invalid Base64 string');
  }

  return transactionBase64Signed;
};
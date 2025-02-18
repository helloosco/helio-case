import { ComputeBudgetProgram } from '@solana/web3.js';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { FEE_WALLET } from '../constants';

/**
 * Create a priority fee instruction
 * @param priorityFee - The priority fee in lamports
 * @returns The priority fee instruction
 */
export function createPriorityInstruction(priorityFee: number) {
  return ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: priorityFee,
  });
}

/**
 * Create a trading fee instruction
 * @param tradeDirection - The trade direction (BUY or SELL)
 * @param tokenAmount - The token amount
 * @param collateralAmount - The collateral amount
 * @param signerPublicKey - The signer public key
 */
export function createFeeInstruction(
  tradeDirection: "BUY" | "SELL",
  tokenAmount: bigint,
  collateralAmount: bigint,
  signerPublicKey: PublicKey
): TransactionInstruction {
    
    // Get the fee wallet (pre-determined, hardcoded wallet)
    const feeWallet = FEE_WALLET;
    

    let feeAmount: bigint;

    // Calculate the fee amount based on the trade direction
    if (tradeDirection === "BUY") {
        // 1% fee for BUY trades, collateralAmount is the amount of SOL paid (in lamports)
        feeAmount = collateralAmount / BigInt(100);
    } else if (tradeDirection === "SELL") {
        // 1% fee for SELL trades, tokenAmount is the amount of tokens received (in lamports)
        feeAmount = tokenAmount / BigInt(100);
    } else {
        throw new Error("Invalid trade direction");
    }

    // Create the transfer instruction to send the fee to the fee wallet
    return SystemProgram.transfer({
        fromPubkey: signerPublicKey,
        toPubkey: feeWallet,
        lamports: feeAmount,
    });
}
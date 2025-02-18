import { Environment, FixedSide, Moonshot } from '@wen-moon-ser/moonshot-sdk';
import { PublicKey, Commitment } from '@solana/web3.js';
import { logger } from './logger';

/**
 * Moonshot configuration interface
 */
export interface MoonshotConfig {
    rpcUrl: string;
    commitment: Commitment;
    mintPublicKey: PublicKey;
    tokenAmount: bigint;
    tradeDirection: "BUY" | "SELL";
    signerPublicKey: PublicKey;
    slippageBps: number;
    fixedSide: FixedSide;
}

/**
 * Prepare a Moonshot transaction
 * @param config - The Moonshot configuration object
 * @returns The prepared transaction and collateral amount
 */
export async function prepareMoonshotTransaction(
    config: MoonshotConfig
) {
    // Extract the variables from the config object
    const { rpcUrl, commitment, mintPublicKey, tokenAmount, tradeDirection, signerPublicKey, slippageBps, fixedSide } = config;
    
    // Create a new Moonshot instance
    const moonshot = new Moonshot({
        rpcUrl,
        environment: Environment.DEVNET,
        chainOptions: {
        solana: { confirmOptions: { commitment } },
        },
    });
    
    // Get the token instance
    const token = await moonshot
        .Token({
            mintAddress: mintPublicKey.toBase58(),
        })
        .preload();
        
    // Get the curve position for best pricing
    const curvePos: bigint = await token.getCurvePosition();
    
    // Determine the collateral amount needed for the trade
    const collateralAmount: bigint = token.getCollateralAmountByTokensSync({
        tokenAmount,
        tradeDirection,
        curvePosition: curvePos,
    });

  logger.info("Collateral amount: ", { collateralAmount });

  // Prepare the transaction instructions
  const { ixs } = await token.prepareIxs({
    slippageBps,
    creatorPK: signerPublicKey.toBase58(),
    tokenAmount,
    collateralAmount,
    tradeDirection,
    fixedSide,
  });

  return { ixs, collateralAmount };
}
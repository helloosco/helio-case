import express from "express";
import winston from "winston";
import { Environment, FixedSide, Moonshot } from '@wen-moon-ser/moonshot-sdk';
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
  Commitment,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';

// Create a Winston logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // You can add more transports here, like File transport
  ],
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Health check route
app.get("/", (req: any, res: any) => {
  logger.info("Health check route accessed");
  res.send("Server is running!");
});

/**
 * /prepare endpoint
 * - Expects a JSON payload (if needed)
 * - Returns a response with prepared data
 */
app.post("/prepare", async (req: any, res: any) => {
  const requestData = req.body;
  logger.info("Prepare endpoint accessed", { requestData });

  const tradeDirection: string = requestData.tradeDirection;

  // Check if tradeDirection is either "BUY" or "SELL"
  if (tradeDirection !== "BUY" && tradeDirection !== "SELL") {
    logger.warn("Invalid trade direction provided");
    return res.status(400).json({ error: "Invalid trade direction. Must be 'BUY' or 'SELL'." });
  }

  const signerAddress: string = requestData.signerAddress;
  const mintAddress: string = requestData.mintAddress;
  
  const tokenAmount: bigint = BigInt(requestData.amountLamports);
  const rpcUrl: string = requestData.rpcUrl || "https://api.devnet.solana.com";
  const commitment: Commitment = requestData.commitment as Commitment || 'confirmed';
  const slippageBps: number = requestData.slippageBps || 500;
  const fixedSide: FixedSide = requestData.fixedSide || FixedSide.IN;
  const priorityFee: number = requestData.priorityFee || 200_000;

  // Declare signerPublicKey and mintPublicKey outside the try block
  let signerPublicKey: PublicKey;
  let mintPublicKey: PublicKey;

  // Validate signerAddress and mintAddress
  try {
    signerPublicKey = new PublicKey(signerAddress);
    mintPublicKey = new PublicKey(mintAddress);

    if (!PublicKey.isOnCurve(signerPublicKey) || !PublicKey.isOnCurve(mintPublicKey)) {
      throw new Error("Invalid public key");
    }
  } catch (error) {
    logger.warn("Invalid public key provided", { error });
    return res.status(400).json({ error: "Invalid public key provided for signer or mint address." });
  }

  const connection = new Connection(rpcUrl);

  const moonshot = new Moonshot({
    rpcUrl,
    environment: Environment.DEVNET,
    chainOptions: {
      solana: { confirmOptions: { commitment } },
    },
  });

  const token = await moonshot
    .Token({
      mintAddress,
    })
    .preload();

  const curvePos: bigint = await token.getCurvePosition();

  logger.info("Curve position: ", { curvePos });

  const collateralAmount: bigint = token.getCollateralAmountByTokensSync({
    tokenAmount,
    tradeDirection,
    curvePosition: curvePos,
  });

  logger.info("Collateral amount: ", { collateralAmount });

  const { ixs } = await token.prepareIxs({
    slippageBps,
    creatorPK: signerAddress,
    tokenAmount,
    collateralAmount,
    tradeDirection,
    fixedSide,
  });

  logger.info("Instructions: ", { ixs });

  const priorityIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: priorityFee,
  });


  const feeWallet = new PublicKey(
    "8r6RYxwenmMkuXEVXMkczPfkasWzT1JGt9SbHkUHzzvk"
  );

  let feeAmount: bigint;

  if (tradeDirection === "BUY") {
    feeAmount = tokenAmount / BigInt(100);
  } else if (tradeDirection === "SELL") {
    feeAmount = collateralAmount / BigInt(100);
  } else {
    throw new Error("Invalid trade direction");
  }

  const feeIx = SystemProgram.transfer({
    fromPubkey: signerPublicKey,
    toPubkey: feeWallet,
    lamports: feeAmount,
  });

  const blockhash = await connection.getLatestBlockhash(commitment);
  const messageV0 = new TransactionMessage({
    payerKey: signerPublicKey,
    recentBlockhash: blockhash.blockhash,
    instructions: [priorityIx, ...ixs, feeIx],
  }).compileToV0Message();

  const transaction = new VersionedTransaction(messageV0);

  // Encode the transaction as base64
  const transactionBase64 = Buffer.from(transaction.serialize()).toString('base64');

  // Simulating some processing logic
  const responseData = {
    message: "Success",
    transactionBase64,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(responseData);
});

/**
 * /submit endpoint
 * - Expects a JSON payload with required data
 * - Returns a success message
 */
app.post("/submit", async (req: any, res: any) => {
  const requestData = req.body;
  logger.info("Submit endpoint accessed", { requestData });

  const transactionBase64Signed: string = requestData.transactionBase64Signed;
  const rpcUrl: string = requestData.rpcUrl || "https://api.devnet.solana.com";
  const commitment: Commitment = requestData.commitment as Commitment || 'confirmed';

  const connection = new Connection(rpcUrl, commitment);

  const transaction = VersionedTransaction.deserialize(Buffer.from(transactionBase64Signed, 'base64'));

  const signature = await connection.sendTransaction(transaction, {
    skipPreflight: false,
    maxRetries: 5,
    preflightCommitment: commitment,
  });
  
  const responseData = {
    message: "Success",
    signature,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(responseData);
});

// Define the startServer function
export function startServer() {
  // Start the server
  app.listen(PORT, () => {
    logger.info(`Server is running on http://127.0.0.1:${PORT}`);
  });
}

// Export the app instance for testing
export { app };

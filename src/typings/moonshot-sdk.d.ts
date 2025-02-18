declare module '@wen-moon-ser/moonshot-sdk' {
  // Add specific type declarations here if available
  export class Moonshot {
    constructor(config: any);
    Token(config: any): any;
  }

  export enum Environment {
    DEVNET,
    MAINNET,
  }

  export enum FixedSide {
    IN,
    OUT,
  }
} 
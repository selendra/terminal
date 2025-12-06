// Contract types
export type ContractType = "erc20" | "erc721" | "erc1155" | "defi" | "proxy" | "ink" | "other";
export type VMType = "evm" | "wasm";

export interface Contract {
  address: string;
  name: string;
  compiler: string;
  version: string;
  verified: boolean;
  createdAt: Date;
  creator: string;
  txCount: number;
  balance: string;
  type: ContractType;
  vmType: VMType;
  isProxy?: boolean;
  implementationAddress?: string;
}

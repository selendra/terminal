export type TokenType = "native" | "erc20" | "erc721" | "erc1155" | "psp22" | "psp34" | "psp37" | "substrate";
export type TokenStandard = "ERC-20" | "ERC-721" | "ERC-1155" | "PSP22" | "PSP34" | "PSP37" | "Native" | "Substrate Asset";

export interface Token {
  id: string;
  rank: number;
  name: string;
  symbol: string;
  logo: string;
  address: string;
  price: string;
  priceChange24h: number;
  priceChange7d?: number;
  volume24h: string;
  marketCap: string;
  holders: number;
  totalSupply: string;
  circulatingSupply?: string;
  type: TokenType;
  standard: TokenStandard;
  verified: boolean;
  favorite: boolean;
  priceHistory: number[];
  decimals?: number;
  website?: string;
  twitter?: string;
  telegram?: string;
  contractCreated?: Date;
  // NFT specific
  totalItems?: number;
  floorPrice?: string;
}

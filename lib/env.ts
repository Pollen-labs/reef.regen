export const env = {
  relayerUrl: process.env.RELAYER_URL || "",
  // Default to Optimism mainnet (10) if not provided
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID || 10),
  easAddress: process.env.NEXT_PUBLIC_EAS_ADDRESS || "",
  defaultSchemaUid: process.env.NEXT_PUBLIC_DEFAULT_SCHEMA_UID || "",
  easVersion: process.env.NEXT_PUBLIC_EAS_VERSION || "0.26",
  openMapTilesKey: process.env.NEXT_PUBLIC_OPENMAPTILES_KEY || "",
  blockExplorerAddressPrefix:
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER_ADDRESS_PREFIX ||
    "https://optimistic.etherscan.io/address/",
  easExplorerAddressPrefix:
    process.env.NEXT_PUBLIC_EAS_EXPLORER_ADDRESS_PREFIX ||
    "https://optimism.easscan.org/address/",
};

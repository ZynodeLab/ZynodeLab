export const ROBINHOOD_NETWORKS = Object.freeze({
  mainnet: Object.freeze({
    key: 'mainnet',
    name: 'Robinhood Chain',
    chainId: 4663,
    chainIdHex: '0x1237',
    nativeCurrency: Object.freeze({ name: 'Ether', symbol: 'ETH', decimals: 18 }),
    rpcUrl: 'https://rpc.mainnet.chain.robinhood.com',
    sequencerUrl: 'https://sequencer.mainnet.chain.robinhood.com',
    sequencerFeedUrl: 'wss://feed.mainnet.chain.robinhood.com',
    explorerUrl: 'https://robinhoodchain.blockscout.com',
    docsUrl: 'https://docs.robinhood.com/chain',
  }),
  testnet: Object.freeze({
    key: 'testnet',
    name: 'Robinhood Chain Testnet',
    chainId: 46630,
    chainIdHex: '0xb626',
    nativeCurrency: Object.freeze({ name: 'Ether', symbol: 'ETH', decimals: 18 }),
    rpcUrl: 'https://rpc.testnet.chain.robinhood.com',
    sequencerUrl: 'https://sequencer.testnet.chain.robinhood.com',
    sequencerFeedUrl: 'wss://feed.testnet.chain.robinhood.com',
    explorerUrl: 'https://explorer.testnet.chain.robinhood.com',
    faucetUrl: 'https://faucet.testnet.chain.robinhood.com',
    docsUrl: 'https://docs.robinhood.com/chain',
  }),
});

export function getNetwork(value = 'mainnet') {
  const key = String(value).toLowerCase();
  const network = ROBINHOOD_NETWORKS[key];
  if (!network) throw new Error(`Unknown network: ${value}. Use mainnet or testnet.`);
  return network;
}

export function explorerAddressUrl(address, network = 'mainnet') {
  return `${getNetwork(network).explorerUrl}/address/${address}`;
}

export function explorerTransactionUrl(hash, network = 'mainnet') {
  return `${getNetwork(network).explorerUrl}/tx/${hash}`;
}

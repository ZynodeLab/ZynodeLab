import { getNetwork } from './network.js';

function hexQuantityToBigInt(value, label) {
  if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value)) throw new Error(`Invalid ${label} returned by RPC.`);
  return BigInt(value);
}

export async function rpcCall(url, method, params = [], { timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}.`);
    const payload = await response.json();
    if (payload.error) throw new Error(`RPC ${payload.error.code}: ${payload.error.message}`);
    return payload.result;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`RPC request timed out after ${timeoutMs}ms.`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function probeNetwork({ network = 'mainnet', rpcUrl, timeoutMs = 8000 } = {}) {
  const config = getNetwork(network);
  const url = rpcUrl || config.rpcUrl;
  const started = performance.now();
  const [chainIdRaw, blockRaw, gasRaw] = await Promise.all([
    rpcCall(url, 'eth_chainId', [], { timeoutMs }),
    rpcCall(url, 'eth_blockNumber', [], { timeoutMs }),
    rpcCall(url, 'eth_gasPrice', [], { timeoutMs }),
  ]);
  const latencyMs = Math.round(performance.now() - started);
  const chainId = Number(hexQuantityToBigInt(chainIdRaw, 'chain ID'));
  return {
    network: config.name,
    rpcUrl: url,
    expectedChainId: config.chainId,
    chainId,
    chainIdMatches: chainId === config.chainId,
    latestBlock: hexQuantityToBigInt(blockRaw, 'block number'),
    gasPriceWei: hexQuantityToBigInt(gasRaw, 'gas price'),
    latencyMs,
  };
}

export async function inspectContract(address, { network = 'mainnet', rpcUrl, timeoutMs = 8000 } = {}) {
  const config = getNetwork(network);
  const url = rpcUrl || config.rpcUrl;
  const [code, balanceRaw, nonceRaw] = await Promise.all([
    rpcCall(url, 'eth_getCode', [address, 'latest'], { timeoutMs }),
    rpcCall(url, 'eth_getBalance', [address, 'latest'], { timeoutMs }),
    rpcCall(url, 'eth_getTransactionCount', [address, 'latest'], { timeoutMs }),
  ]);
  const codeBytes = code === '0x' ? 0 : Math.max(0, (code.length - 2) / 2);
  return {
    network: config.name,
    rpcUrl: url,
    address,
    hasCode: code !== '0x' && code !== '0x0',
    codeBytes,
    balanceWei: hexQuantityToBigInt(balanceRaw, 'balance'),
    nonce: hexQuantityToBigInt(nonceRaw, 'nonce'),
  };
}

export type ChainAdapter = 'evm' | 'solana' | 'tron' | 'xrp';

export function getChainAdapter(chain: ChainAdapter) {
  const adapters = {
    evm: { name: 'wagmi/viem approve', supported: true },
    solana: { name: 'wallet adapter approve', supported: true },
    tron: { name: 'TronLink approve', supported: true },
    xrp: { name: 'xrp stub adapter', supported: false },
  } as const;

  return adapters[chain];
}

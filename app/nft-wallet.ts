export type EthereumProvider = {
  request(args: {
    method: string;
    params?: readonly unknown[] | object;
  }): Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export type WalletIdentity = {
  account: string;
  chainId: string;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function provider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No compatible browser wallet was detected.");
  }
  return window.ethereum;
}

export async function connectWallet(): Promise<WalletIdentity> {
  const wallet = provider();
  const [accounts, chainId] = await Promise.all([
    wallet.request({ method: "eth_requestAccounts" }),
    wallet.request({ method: "eth_chainId" }),
  ]);
  const account = Array.isArray(accounts) ? String(accounts[0] ?? "") : "";
  if (!account) throw new Error("The wallet did not return an account.");
  return { account, chainId: String(chainId) };
}

export function shortAddress(address: string) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "NOT CONNECTED";
}

function encodeUint256(value: string) {
  const parsed = BigInt(value);
  if (parsed < 0n) throw new Error("Token ID must be zero or greater.");
  return parsed.toString(16).padStart(64, "0");
}

function decodeAddress(result: unknown) {
  const data = String(result);
  if (!/^0x[0-9a-fA-F]{64}$/.test(data)) {
    throw new Error("The contract did not return a valid ERC-721 owner.");
  }
  return `0x${data.slice(-40)}`.toLowerCase();
}

export async function verifyErc721Owner(args: {
  contract: string;
  tokenId: string;
  account: string;
}) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(args.contract)) {
    throw new Error("Enter a valid ERC-721 contract address.");
  }
  if (!/^\d+$/.test(args.tokenId.trim())) {
    throw new Error("Enter a numeric token ID.");
  }
  const data = `0x6352211e${encodeUint256(args.tokenId.trim())}`;
  const result = await provider().request({
    method: "eth_call",
    params: [{ to: args.contract, data }, "latest"],
  });
  const owner = decodeAddress(result);
  if (owner !== args.account.toLowerCase()) {
    throw new Error(`Connected wallet does not own token #${args.tokenId}.`);
  }
  return owner;
}


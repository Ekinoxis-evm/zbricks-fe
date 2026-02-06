import type { Address, Hex } from "./evm";
import { MAX_UINT256, padHex, toHex } from "./evm";

import {
  CHAINS,
  GATEWAY_MINTER_ADDRESS,
  GATEWAY_WALLET_ADDRESS,
  ZERO_ADDRESS,
  type SupportedChainKey,
} from "./constants";

export type BurnIntentSpec = {
  version: number;
  sourceDomain: number;
  destinationDomain: number;
  sourceContract: Hex;
  destinationContract: Hex;
  sourceToken: Hex;
  destinationToken: Hex;
  sourceDepositor: Hex;
  destinationRecipient: Hex;
  sourceSigner: Hex;
  destinationCaller: Hex;
  value: bigint;
  salt: Hex;
  hookData: Hex;
};

export type BurnIntent = {
  maxBlockHeight: bigint;
  maxFee: bigint;
  spec: BurnIntentSpec;
};

export type BurnIntentTypedData = {
  domain: {
    name: string;
    version: string;
  };
  types: {
    EIP712Domain: { name: string; type: string }[];
    TransferSpec: { name: string; type: string }[];
    BurnIntent: { name: string; type: string }[];
  };
  primaryType: "BurnIntent";
  message: BurnIntent;
};

export type BuildBurnIntentParams = {
  amount: bigint;
  maxFee: bigint;
  sourceChain: SupportedChainKey;
  destinationChain: SupportedChainKey;
  sourceDepositor: Address;
  destinationRecipient: Address;
  sourceSigner: Address;
  destinationCaller?: Address;
  salt?: Hex;
  hookData?: Hex;
};

const padToBytes32 = (value: Hex | Address | string) => padHex(value, 32);

const randomHex = (size: number): Hex => {
  const bytes = new Uint8Array(size);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < size; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return toHex(bytes);
};

export const buildBurnIntentTypedData = ({
  amount,
  maxFee,
  sourceChain,
  destinationChain,
  sourceDepositor,
  destinationRecipient,
  sourceSigner,
  destinationCaller,
  salt,
  hookData,
}: BuildBurnIntentParams) => {
  const source = CHAINS[sourceChain];
  const destination = CHAINS[destinationChain];

  const intent: BurnIntent = {
    maxBlockHeight: MAX_UINT256,
    maxFee,
    spec: {
      version: 1,
      sourceDomain: source.domainId,
      destinationDomain: destination.domainId,
      sourceContract: padToBytes32(GATEWAY_WALLET_ADDRESS),
      destinationContract: padToBytes32(GATEWAY_MINTER_ADDRESS),
      sourceToken: padToBytes32(source.usdcAddress),
      destinationToken: padToBytes32(destination.usdcAddress),
      sourceDepositor: padToBytes32(sourceDepositor),
      destinationRecipient: padToBytes32(destinationRecipient),
      sourceSigner: padToBytes32(sourceSigner),
      destinationCaller: padToBytes32(destinationCaller ?? ZERO_ADDRESS),
      value: amount,
      salt: salt ?? randomHex(32),
      hookData: hookData ?? "0x",
    },
  };

  const typedData: BurnIntentTypedData = {
    domain: {
      name: "GatewayWallet",
      version: "1",
    },
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
      ],
      TransferSpec: [
        { name: "version", type: "uint32" },
        { name: "sourceDomain", type: "uint32" },
        { name: "destinationDomain", type: "uint32" },
        { name: "sourceContract", type: "bytes32" },
        { name: "destinationContract", type: "bytes32" },
        { name: "sourceToken", type: "bytes32" },
        { name: "destinationToken", type: "bytes32" },
        { name: "sourceDepositor", type: "bytes32" },
        { name: "destinationRecipient", type: "bytes32" },
        { name: "sourceSigner", type: "bytes32" },
        { name: "destinationCaller", type: "bytes32" },
        { name: "value", type: "uint256" },
        { name: "salt", type: "bytes32" },
        { name: "hookData", type: "bytes" },
      ],
      BurnIntent: [
        { name: "maxBlockHeight", type: "uint256" },
        { name: "maxFee", type: "uint256" },
        { name: "spec", type: "TransferSpec" },
      ],
    },
    primaryType: "BurnIntent",
    message: intent,
  };

  return { typedData, burnIntent: intent };
};

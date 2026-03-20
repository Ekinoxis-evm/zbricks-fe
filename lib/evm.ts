export {
  isAddress,
  parseUnits,
  formatUnits,
  toHex,
  pad,
  maxUint256,
  zeroAddress,
} from "viem";

export type { Address } from "viem";

export type Hex = `0x${string}`;

export const MAX_UINT256 = maxUint256;

import { maxUint256 } from "viem";

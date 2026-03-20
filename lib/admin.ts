export const ADMIN_ADDRESSES: string[] = (
  process.env.NEXT_PUBLIC_ADMIN_ADDRESSES ?? ""
)
  .split(",")
  .map((a) => a.trim().toLowerCase())
  .filter(Boolean);

export function isAdminWallet(address: string | undefined): boolean {
  if (!address || ADMIN_ADDRESSES.length === 0) return false;
  return ADMIN_ADDRESSES.includes(address.toLowerCase());
}

Plan: Verify and fix ABI-Contract connections
Your contract ABIs have 3 critical mismatches between the TypeScript definitions in lib/contracts.ts and the actual contract ABIs in deploymnets/abi/. These are causing or will cause runtime failures when calling contract functions.

Steps
Fix minBidIncrement → minBidIncrementPercent mismatch in contracts.ts:193 and page.tsx:224 - This is the most critical issue affecting auction bidding logic

Correct AuctionFactory.createAuction parameters in contracts.ts:475-486 - Remove _paymentToken and _nftContract params (they're immutable), rename _owner → _admin, fix to match CONTRACT-REFERENCE.md

Fix hasPaidFee → hasPaid function name in contracts.ts:249 - Minor issue since biddings page is currently disabled

Verify the duplicate advancePhase functions in HouseNFT.json - ABI shows 2 signatures but CONTRACT-REFERENCE.md documents only one; determine which is correct

Further Considerations
Replace minimal ABIs with full ABIs? Currently maintaining simplified ABIs in lib/contracts.ts - consider importing complete ABIs directly from deploymnets/abi/*.json to avoid future mismatches

Re-enable biddings page? app/biddings/page.tsx.bak has full implementation but is currently disabled - decide whether to restore or remove permanently

Add real-time event watching? No components use useWatchContractEvent for live auction updates - would improve UX for bid notifications and phase changes
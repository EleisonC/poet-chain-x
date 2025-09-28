# Poet-chain-x
Auction your original poetry online on the Polkadot blockchain

## Overview
`poet-chain-x` allows users to auction their original poetry on a blockchain. Each auction involves a single poem, a seller, and multiple buyers placing bids. The highest bidder at the end of the auction wins, and funds are automatically transferred to the seller.

---

## Use Case

- **Auction Item:** A piece of poetry (stored as text in the MVP).
- **Seller:** The account that creates the auction.
- **Buyers:** Users who place bids on the poetry.
- **Auction Rules (MVP simplifications):**
    - Only one poetry item per auction.
    - Auction has a defined start and end block.
    - The highest bidder at the end wins the auction.
    - Funds are transferred to the seller.

---

## Constraints / Checks

- Only allow bids higher than the current highest bid.
- Refund the previous highest bidder automatically when a new highest bid is placed.
- Prevent bids if the auction has expired (current block > end block).
- Ensure the auction can only be ended once.

---

## High-Level Flow (Optional)

1. **Create Auction**
    - Seller submits poem text and auction duration (in blocks).
    - Contract stores the seller, poem, highest bid (0), h

2. **Place Bid**
    - Buyer sends funds to the contract.
    - Contract checks:
        - Auction is still active.
        - Bid is higher than current highest bid.
    - Refund previous highest bidder.
    - Update highest bid and bidder.  


## Notes
- That’s the “one contract = one auction instance” pattern.
So when Alice wants to auction a poem, she instantiates the contract. If Bob also wants to auction, he instantiates another copy from the same Wasm code. Each instance is independent and lives at its own contract address.

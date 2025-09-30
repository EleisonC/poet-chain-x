#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod poet_chain_x {
    use ink::env::hash::{Keccak256, HashOutput};
    use ink::prelude::string::String;
    use ink::U256;

    #[ink(storage)]
    pub struct PoetChainX {
        poem_id: [u8; 32],
        /// Seller (poet who deploys the contract)
        seller: Address,
        /// The actual poem
        poem: String,
        /// Stores a hashed Poem.
        // poem_id: [u8; 32],
        /// Block when the auction ends
        end_block: BlockNumber,
        /// Simple approach lets us only record the highest.
        /// Nothing below the current is accepted.
        highest_bid: U256,
        /// When Auction closes, they will be,
        /// the new sole owner of auction || poem
        highest_bidder: Option<Address>,
        /// simple approach whether auction is still ongoing.
        /// To avoid high CU, no need to cal if active using
        /// end block
        pub active: bool,


    }

    #[ink(event)]
    pub struct AuctionCreated {
        #[ink(topic)]
        seller: Address,
        #[ink(topic)]
        poem_id: [u8; 32], // hash of the poem
    }

    #[ink(event)]
    pub struct BidPlaced {
        #[ink(topic)]
        bidder: Address,
        amount: U256,
    }

    #[ink(event)]
    pub struct BidRefunded {
        #[ink(topic)]
        previous_bidder: Address,
        amount: U256,
    }

    #[ink(event)]
    pub struct AuctionEnded {
        #[ink(topic)]
        winner: Option<Address>,
        amount: U256,
    }

    /// Errors that can occur upon calling this contract.
    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        AuctionNotActive,
        AuctionExpired,
        BidTooLow,
        TransferFailed,
        AuctionAlreadyEnded,
        AuctionStillRunning,
        SomethingWentWrong,
        UnAuthorized
    }

    /// Type alias for the contract's `Result` type.
    pub type Result<T> = core::result::Result<T, Error>;

    impl PoetChainX {
        /// Constructor: initializes seller, poem, and duration
        #[ink(constructor)]
        pub fn new(poem: String, duration: BlockNumber) -> Self {
            let current_block = Self::env().block_number();
            let res_hash = Self::hash_poem(poem.as_bytes());

            let end_block = current_block
                .checked_add(duration)
                .unwrap_or(current_block);

            Self::env().emit_event(AuctionCreated {
                seller: Self::env().caller(),
                poem_id: res_hash,
            });
            Self {
                poem_id: res_hash,
                seller: Self::env().caller(),
                poem,
                end_block,
                highest_bid: U256::zero(),
                highest_bidder: None,
                active: true,
            }
        }
        
       /// Get auction status info ie Self current_block_number, auction.end_block, auction.active
        #[ink(message)]
        pub fn get_auction_info(&self) -> (BlockNumber, BlockNumber, bool) {
           let result = (Self::env().block_number(), self.end_block, self.active);
            result
        }
        
        /// Place a bid on the poetry auction
        /// This is a payable function - callers must send tokens with the transaction
        #[ink(message, payable)]
        pub fn bid(&mut self) -> Result<()> {
            // STEP 1: Check if auction is still accepting bids
            if !self.active {
                return Err(Error::AuctionNotActive);
            }

            // STEP 2: Check if auction time hasn't expired yet
            // Get the current blockchain block number
            let current_block = Self::env().block_number();

            // If we're PAST the end_block, auction time is over
            // Note: current_block > end_block means expired
            if current_block > self.end_block {
                return Err(Error::AuctionExpired);
            }

            // STEP 3: Get bidder info and bid amount
            // caller() returns the AccountId of whoever called this function
            let bidder = Self::env().caller();

            // transferred_value() returns how many tokens were sent with this transaction
            // This is the bid amount
            let value = Self::env().transferred_value();

            // STEP 4: Validate bid is higher than current highest
            // We only accept bids that are STRICTLY GREATER than current highest
            // Equal bids are rejected (first bidder wins ties)
            if value <= self.highest_bid {
                return Err(Error::BidTooLow);
            }

            // STEP 5: Refund the previous highest bidder
            // If there was a previous bidder (Some), give them their money back
            if let Some(prev_bidder) = self.highest_bidder {
                // Only refund if there's actually money to refund
                if self.highest_bid > U256::zero() {
                    // Transfer the old highest_bid back to the previous bidder
                   if  !Self::env().transfer(prev_bidder, self.highest_bid).is_ok() {
                       return Err(Error::TransferFailed);
                   }

                    // Emit an event so off-chain systems know about the refund
                    Self::env().emit_event(BidRefunded {
                        previous_bidder: prev_bidder,
                        amount: self.highest_bid,
                    });
                }
            }

            // STEP 6: Update contract state with new highest bid
            // Store the new bid amount
            self.highest_bid = value;

            // Store who placed this bid
            self.highest_bidder = Some(bidder);

            // STEP 7: Emit event about the new bid
            // This allows off-chain systems (like a UI) to update in real-time
            Self::env().emit_event(BidPlaced {
                bidder,
                amount: value,
            });

            // STEP 8: Return success
            Ok(())
        }

        /// End auction and transfer funds to poet
        #[ink(message, payable)]
        pub fn end_auction(&mut self) -> Result<()>{
            if !self.active {
                return Err(Error::AuctionAlreadyEnded);
            }
            
            if self.seller != Self::env().caller() {
                return Err(Error::UnAuthorized);
            }
            
            let current_block = Self::env().block_number();
            if current_block <= self.end_block {
                return Err(Error::AuctionStillRunning);
            }

            self.active = false;
            if let Some(winner) = self.highest_bidder {
                if !Self::env().transfer(self.seller, self.highest_bid).is_ok() {
                    return Err(Error::TransferFailed);
                }
                Self::env().emit_event(AuctionEnded { winner: Some(winner), amount: self.highest_bid});
            } else {
                Self::env().emit_event(AuctionEnded { winner: None, amount: self.highest_bid});
            }
            Ok(())
        }

        /// Message: returns the stored poem
        #[ink(message)]
        pub fn get_poem(&self) -> String {
            self.poem.clone()
        }

        /// Get winner info
        #[ink(message)]
        pub fn get_winner(&self) -> (Option<Address>, U256) {
            (self.highest_bidder, self.highest_bid)
        }

        fn hash_poem(poem: &[u8]) -> [u8; 32] {
            let mut output = <Keccak256 as HashOutput>::Type::default();
            ink::env::hash_bytes::<Keccak256>(poem, &mut output);
            output
        }
    }

    // --- Unit Tests ---
    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::test;

        /// Happy path test - complete auction flow
        #[ink::test]
        fn happy_path_auction_flow() {
            // Create contract with a poem and 100 block duration
            let poem = "Roses are red, violets are blue".to_owned();
            // Get test accounts
            let accounts = test::default_accounts();
            // SET THE CALLER BEFORE CALLING THE CONSTRUCTOR
            test::set_caller(accounts.alice);
            let mut contract = PoetChainX::new(poem.clone(), 100);
    
            // Verify poem storage
            assert_eq!(contract.get_poem(), poem);
            assert!(contract.active);
    
            // Place a bid of 1000
            let accounts = test::default_accounts();
            test::set_caller(accounts.bob);
            test::set_value_transferred(U256::from(1000));
            assert!(contract.bid().is_ok());
    
            // Check winner info
            let (winner, amount) = contract.get_winner();
            assert_eq!(winner, Some(accounts.bob));
            assert_eq!(amount, U256::from(1000));

            test::set_caller(accounts.alice);
            // Advance past end block and end auction
            test::set_block_number::<ink::env::DefaultEnvironment>(150);
            contract.end_auction().expect("Expected to end contract");
            assert!(!contract.active);
        }

        #[ink::test]
        fn constructor_and_get_poem_work() {
            let poem = "Roses are red, violets are blue".to_owned();
            let duration = 50;

            // Get test accounts
            let accounts = test::default_accounts();

            // SET THE CALLER BEFORE CALLING THE CONSTRUCTOR
            test::set_caller(accounts.alice);

            let contract = PoetChainX::new(poem.clone(), duration);

            // Verify stored poem
            assert_eq!(contract.get_poem(), poem);

            // Verify seller matches caller
            let accounts = test::default_accounts();
            println!("{}", contract.get_poem());
            assert_eq!(contract.seller, accounts.alice);
        }

        /// Unhappy path 3: Bid too low
        #[ink::test]
        fn bid_too_low() {
            let poem = "Test poem".to_owned();
            let mut contract = PoetChainX::new(poem, 100);
            // Contract starts with active = true

            let accounts = test::default_accounts();

            // First bid
            test::set_caller(accounts.bob);
            test::set_value_transferred(U256::from(1000));
            assert!(contract.bid().is_ok());

            // Second bid with lower amount
            test::set_caller(accounts.charlie);
            test::set_value_transferred(U256::from(500));

            let result = contract.bid();
            assert_eq!(result, Err(Error::BidTooLow));
        }

        /// Unhappy path 2: Bid after auction expired
        #[ink::test]
        fn bid_after_expiry() {
            let poem = "Test poem".to_owned();
            let mut contract = PoetChainX::new(poem, 100);

            // Set block number past end_block
            test::set_block_number::<ink::env::DefaultEnvironment>(150);

            let accounts = test::default_accounts();
            test::set_caller(accounts.bob);
            test::set_value_transferred(U256::from(1000));

            let result = contract.bid();
            assert_eq!(result, Err(Error::AuctionExpired));
        }

        /// Unhappy path 4: End auction while still running
        #[ink::test]
        fn end_auction_early() {
            let poem = "Test poem".to_owned();
            let mut contract = PoetChainX::new(poem, 100);

            // Current block is 0, end block is 100, so auction is still running
            let result = contract.end_auction();
            assert_eq!(result, Err(Error::AuctionStillRunning));
        }
        
        
    }
}

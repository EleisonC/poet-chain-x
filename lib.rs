#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod poet_chain_x {
    use ink::primitives::{U256};
    use ink::env::hash::{Blake2x256, HashOutput};
    use ink::env::hash_bytes;

    /// Defines the PoetChainX contract storage.
    #[ink(storage)] // this macro marks the struct that represents your persistent storage on-chain.
    pub struct PoetChainX {
        /// Stores a single `bool` value on the storage.
        poem_id: [u8; 32],
        /// Stores a single `bool` value on the storage.
        poem: String,
        /// The poet that is selling their piece
        seller: Address,
        /// Simple approach lets us only record the highest.
        /// Nothing below the current is accepted.
        highest_bid: U256,
        /// When Auction closes, this will be,
        /// the new sole owner of auction || poem
        highest_bidder: Option<Address>,
        /// when auction ends. Determined using,the duration
        /// provided by the poet aka seller
        end_block: BlockNumber,
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
        poem_text: String,  // optional, may be big in storage but cheap in event
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

    impl PoetChainX {
        /// BlockNumber is whatever type the chain defines as its block number in its environment
        /// On Substrate-based chains, BlockNumber is usually just a u32 or u64.
        #[ink(constructor)]
        pub fn new(poem: String, duration: BlockNumber) -> Self {
            let initiator = Self::env().caller();
            let current_block = Self::env().block_number();
            let res_hash = Self::hash_poem(&poem.as_bytes());
            Self::env().emit_event(AuctionCreated {
                seller: initiator,
                poem_id: res_hash,
                poem_text: poem.clone()
            });
            Self {
                poem_id: res_hash,
                poem,
                seller: initiator,
                highest_bid: U256::from(0),
                highest_bidder: None,
                end_block: current_block + duration,
                active: true,
            }
        }

        /// messages are callable poet_chain_x methods.
        /// Place a bid
        #[ink(message, payable)]
        pub fn bid(&mut self) {
            assert!(self.active, "Auction not active");
            let current_block = Self::env().block_number();
            // You can only place a bid if the current block is, less than or equal to the auction’s end block.
            assert!(current_block <= self.end_block, "Auction expired");

            let bidder = Self::env().caller();
            let value = Self::env().transferred_value();
            assert!(value > self.highest_bid, "Bid too low");

            // refund previous bidder
            if let Some(prev) = self.highest_bidder {
                if self.highest_bid > U256::from(0) {
                    Self::env().transfer(prev, self.highest_bid).expect("Refund failed");
                    Self::env().emit_event(BidRefunded { previous_bidder: prev, amount: self.highest_bid})
                }
            }

            // update the highest bid & bidder
            self.highest_bid = value;
            self.highest_bidder = Some(bidder);
            Self::env().emit_event(BidPlaced { bidder, amount: value })
        }

        /// End auction and transfer funds to poet
        #[ink(message)]
        pub fn end_auction(&mut self) {
            assert!(self.active, "Auction already ended");
            let current_block = Self::env().block_number();
            assert!(current_block > self.end_block, "Auction still running");

            self.active = false;
            if let Some(winner) = self.highest_bidder {
                Self::env().transfer(self.seller, self.highest_bid)
                    .expect("Payout failed");
                Self::env().emit_event(AuctionEnded { winner: Some(winner), amount: self.highest_bid})
            } else {
                Self::env().emit_event(AuctionEnded { winner: None, amount: self.highest_bid})
            }
        }

        /// Get winner info
        #[ink(message)]
        pub fn get_winner(&self) -> (Option<Address>, U256) {
            (self.highest_bidder, self.highest_bid)
        }

        /// Get poem
        #[ink(message)]
        pub fn get_poem(&self) -> String {
            self.poem.clone()
        }

        fn hash_poem(poem: &[u8]) -> [u8; 32] {
            let mut result = <Blake2x256 as HashOutput>::Type::default();
            hash_bytes::<Blake2x256>(poem, &mut result);
            result
        }
    }

    // Unit tests in Rust are normally defined within such a `#[cfg(test)]`
    /// module and test functions are marked with a `#[test]` attribute.
    /// The below code is technically just normal Rust code.
    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;
        use ink::env::test;

        /// Happy path test - complete auction flow
        #[ink::test]
        fn happy_path_auction_flow() {
            // Create contract with a poem and 100 block duration
            let poem = "Roses are red, violets are blue".to_owned();
            let mut contract = PoetChainX::new(poem.clone(), 100);


            // Get the poem back
            assert_eq!(contract.get_poem(), poem);

            // Place a bid of 1000
            let accounts = test::default_accounts();
            test::set_caller(accounts.bob);
            test::set_value_transferred(U256::from(1000));
            contract.bid();

            // Check winner info
            let (winner, amount) = contract.get_winner();
            assert_eq!(winner, Some(accounts.bob));
            assert_eq!(amount, U256::from(1000));

            // Advance past end block and end auction
            test::set_block_number::<ink::env::DefaultEnvironment>(150);
            contract.end_auction();

            assert!(!contract.active);
        }

        /// Unhappy path 1: Bid on inactive auction (after ending)
        #[ink::test]
        #[should_panic(expected = "Auction not active")]
        fn bid_on_inactive_auction() {
            let poem = "Test poem".to_owned();
            let mut contract = PoetChainX::new(poem, 100);

            // End the auction first to make it inactive
            test::set_block_number::<ink::env::DefaultEnvironment>(150);
            contract.end_auction();

            // Now try to bid on ended auction

            let accounts = test::default_accounts();
            test::set_caller(accounts.bob);
            test::set_value_transferred(U256::from(1000));

            // Create mutable reference for bidding
            let mut contract = contract;
            contract.bid(); // Should panic
        }

        /// Unhappy path 2: Bid after auction expired
        #[ink::test]
        #[should_panic(expected = "Auction expired")]
        fn bid_after_expiry() {
            let poem = "Test poem".to_owned();
            let mut contract = PoetChainX::new(poem, 100);
            // Contract starts with active = true

            // Set block number past end_block
            test::set_block_number::<ink::env::DefaultEnvironment>(150);

            let accounts = test::default_accounts();
            test::set_caller(accounts.bob);
            test::set_value_transferred(U256::from(1000));

            contract.bid(); // Should panic
        }

        /// Unhappy path 3: Bid too low
        #[ink::test]
        #[should_panic(expected = "Bid too low")]
        fn bid_too_low() {
            let poem = "Test poem".to_owned();
            let mut contract = PoetChainX::new(poem, 100);
            // Contract starts with active = true

            let accounts = test::default_accounts();

            // First bid
            test::set_caller(accounts.bob);
            test::set_value_transferred(U256::from(1000));
            contract.bid();

            // Second bid with lower amount
            test::set_caller(accounts.charlie);
            test::set_value_transferred(U256::from(500));

            contract.bid(); // Should panic
        }

        /// Unhappy path 4: End auction while still running
        #[ink::test]
        #[should_panic(expected = "Auction still running")]
        fn end_auction_early() {
            let poem = "Test poem".to_owned();
            let mut contract = PoetChainX::new(poem, 100);

            // Current block is 0, end block is 100, so auction is still running
            contract.end_auction(); // Should panic
        }
    }


    /// This is how you'd write end-to-end (E2E) or integration tests for ink! contracts.
    ///
    /// When running these you need to make sure that you:
    /// - Compile the tests with the `e2e-tests` feature flag enabled (`--features e2e-tests`)
    /// - Are running a Substrate node which contains `pallet-contracts` in the background
    #[cfg(all(test, feature = "e2e-tests"))]
    mod e2e_tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /// A helper function used for calling contract messages.
        use ink_e2e::ContractsBackend;

        /// The End-to-End test `Result` type.
        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        /// We test that we can read and write a value from the on-chain contract.
        #[ink_e2e::test]
        async fn it_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            // Given
            let mut constructor = PoetChainXRef::new(false);
            let contract = client
                .instantiate("poet_chain_x", &ink_e2e::bob(), &mut constructor)
                .submit()
                .await
                .expect("instantiate failed");
            let mut call_builder = contract.call_builder::<PoetChainX>();

            let get = call_builder.get();
            let get_result = client.call(&ink_e2e::bob(), &get).dry_run().await?;
            assert!(matches!(get_result.return_value(), false));

            // When
            let flip = call_builder.flip();
            let _flip_result = client
                .call(&ink_e2e::bob(), &flip)
                .submit()
                .await
                .expect("flip failed");

            // Then
            let get = call_builder.get();
            let get_result = client.call(&ink_e2e::bob(), &get).dry_run().await?;
            assert!(matches!(get_result.return_value(), true));

            Ok(())
        }
    }
}

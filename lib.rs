#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod poet_chain_x {
    use ink::primitives::{U256};

    /// Defines the PoetChainX contract storage.
    #[ink(storage)] // this macro marks the struct that represents your persistent storage on-chain.
    pub struct PoetChainX {
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
        active: bool,
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
        amount: Balance,
    }

    #[ink(event)]
    pub struct BidRefunded {
        #[ink(topic)]
        previous_bidder: Address,
        amount: Balance,
    }

    #[ink(event)]
    pub struct AuctionEnded {
        #[ink(topic)]
        winner: Option<AccountId>,
        amount: Balance,
    }

    impl PoetChainX {
        /// BlockNumber is whatever type the chain defines as its block number in its environment
        /// On Substrate-based chains, BlockNumber is usually just a u32 or u64.
        #[ink(constructor)]
        pub fn new(poem: String, duration: BlockNumber) -> Self {
            let initiator = Self::env().caller();
            let current_block = Self::env().block_number();
            Self {
                poem,
                seller: initiator,
                highest_bid: U256::from(0),
                highest_bidder: None,
                end_block: current_block + duration,
                active: false,
            }
        }

        /// messages are callable poet_chain_x methods.
        /// Place a bid
        #[ink(message, payable)]
        pub fn bid(&mut self) {
            assert!(self.active, "Auction not active");
            let current_block = Self::env().block_number();
            /// You can only place a bid if the current block is,
            /// less than or equal to the auction’s end block.
            assert!(current_block <= self.end_block, "Auction expired");

            let bidder = Self::env().caller();
            let value = Self::env().transferred_value();
            assert!(value > self.highest_bid, "Bid too low");

            // refund previous bidder
            if let Some(prev) = self.highest_bidder {
                if self.highest_bid > U256::from(0) {
                    Self::env().transfer(prev, self.highest_bid)
                        .expect("Refund failed");
                }
            }

            // update the highest bid & bidder
            self.highest_bid = value;
            self.highest_bidder = Some(bidder);
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
    }

    /// Unit tests in Rust are normally defined within such a `#[cfg(test)]`
    /// module and test functions are marked with a `#[test]` attribute.
    /// The below code is technically just normal Rust code.
    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /// We test a simple use case of our contract.
        #[ink::test]
        fn it_works() {
            let mut poet_chain_x = PoetChainX::new(false);
            assert_eq!(poet_chain_x.get(), false);
            poet_chain_x.flip();
            assert_eq!(poet_chain_x.get(), true);
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

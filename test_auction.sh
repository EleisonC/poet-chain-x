#!/bin/bash

# change the contract address before executing this file 
CONTRACT="0x922b36bf2d76ffea91ada82c2459a34a4bd2298f"

echo "=========================================="
echo "POET CHAIN X - AUCTION TESTING SCRIPT"
echo "=========================================="
echo ""

echo "1. Get the poem"
echo "-------------------------------------------"
cargo contract call \
  --contract $CONTRACT \
  --message get_poem \
  --suri //Alice
echo ""

echo "2. Check auction info (blocks and status)"
echo "-------------------------------------------"
cargo contract call \
  --contract $CONTRACT \
  --message get_auction_info \
  --suri //Alice
echo ""

echo "3. Check current winner (before any bids)"
echo "-------------------------------------------"
cargo contract call \
  --contract $CONTRACT \
  --message get_winner \
  --suri //Alice
echo ""

echo "4. Bob places first bid (1000 tokens)"
echo "-------------------------------------------"
cargo contract call \
  --contract $CONTRACT \
  --message bid \
  --suri //Bob \
  --value 1000000000000 \
  --execute \
  --skip-confirm
echo ""

echo "5. Check winner after Bob's bid"
echo "-------------------------------------------"
cargo contract call \
  --contract $CONTRACT \
  --message get_winner \
  --suri //Alice
echo ""

echo "6. Charlie places higher bid (5000 tokens)"
echo "-------------------------------------------"
cargo contract call \
  --contract $CONTRACT \
  --message bid \
  --suri //Charlie \
  --value 5000000000000 \
  --execute \
  --skip-confirm
echo ""

echo "7. Check winner after Charlie's bid"
echo "-------------------------------------------"
cargo contract call \
  --contract $CONTRACT \
  --message get_winner \
  --suri //Alice
echo ""

echo "8. Check auction info again"
echo "-------------------------------------------"
cargo contract call \
  --contract $CONTRACT \
  --message get_auction_info \
  --suri //Alice
echo ""

echo "9. Waiting for auction to end..."
echo "(If this fails, you need to wait for more blocks)"
echo "-------------------------------------------"
sleep 20
echo ""

echo "10. Try to end auction"
echo "-------------------------------------------"
cargo contract call \
  --contract $CONTRACT \
  --message end_auction \
  --gas 500000000000 \
  --suri //Alice \
  --execute
echo ""

echo "11. Final winner check"
echo "-------------------------------------------"
cargo contract call \
  --contract $CONTRACT \
  --message get_winner \
  --suri //Alice
echo ""

echo "=========================================="
echo "TESTING COMPLETE!"
echo "=========================================="
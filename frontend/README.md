# Poem Chain X

A decentralized auction platform for poetry NFTs built on the Polkadot ecosystem. Poem Chain X enables users to deploy smart contracts, create poetry auctions, and participate in bidding using PAS tokens on the Paseo testnet.

## Features

- **Wallet Integration** - Seamless connection with Polkadot.js extension
- **Smart Contract Deployment** - Deploy poetry auction contracts directly from the UI
- **Auction Management** - Create, bid on, and manage poetry auctions
- **PAS Token Support** - Native integration with PAS tokens (Paseo testnet)
- **Real-time Updates** - Live auction status and bid tracking
- **Modern UI/UX** - Built with shadcn/ui components and Tailwind CSS

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Blockchain**: [Polkadot API (PAPI)](https://papi.how/)
- **Smart Contracts**: ink! contracts on Paseo testnet
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **TypeScript**: Full type safety with PAPI descriptors

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Polkadot.js Extension** ([Chrome](https://chrome.google.com/webstore/detail/polkadot%7Bjs%7D-extension/mopnmbcafieddcagagdcbnhejhlodfdd) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-extension/))

## Installation

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/yourusername/poem-chain-x.git
cd poem-chain-x
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Generate PAPI Descriptors

The project uses Polkadot API (PAPI) for type-safe contract interactions. You need to generate the contract descriptors:

\`\`\`bash
# Add your contract to PAPI (replace with your contract metadata path)
npx papi add poet_chain_x -n paseo

# Or if you have a metadata JSON file:
npx papi add path/to/your/contract-metadata.json

# Generate the TypeScript descriptors
npx papi
\`\`\`

This will create the `.papi/descriptors/dist.ts` file with typed contract interfaces.

### 4. Configure Environment Variables (Optional)

Create a `.env.local` file in the root directory if you need custom configuration:

\`\`\`env
# Polkadot Network Configuration
NEXT_PUBLIC_WS_ENDPOINT=wss://paseo.rpc.amforc.com

# Contract Addresses (optional - can be set in UI)
NEXT_PUBLIC_DEFAULT_CONTRACT_ADDRESS=your_contract_address_here
\`\`\`

## Running the Project

### Development Mode

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

\`\`\`bash
npm run build
npm start
# or
yarn build
yarn start
\`\`\`

## Project Structure

\`\`\`
poem-chain-x/
├── .papi/                    # Generated PAPI descriptors
│   └── descriptors/
│       └── dist.ts          # Contract type definitions
├── app/
│   ├── layout.tsx           # Root layout with fonts
│   ├── page.tsx             # Main application page
│   └── globals.css          # Global styles & design tokens
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── wallet-connect.tsx   # Wallet connection component
│   ├── contract-deployer.tsx # Contract deployment UI
│   └── auction-manager.tsx  # Auction management interface
├── lib/
│   └── utils.ts             # Utility functions
└── public/                  # Static assets
\`\`\`

## Usage Guide

### 1. Connect Your Wallet

1. Click the **"Connect Wallet"** button in the top-right corner
2. Select an account from your Polkadot.js extension
3. Your account address and balance will be displayed

**Demo Mode**: If the Polkadot.js extension is not detected, the app will automatically enter demo mode with mock accounts for testing the UI.

### 2. Deploy a Contract (Optional)

If you need to deploy a new poetry auction contract:

1. Navigate to the **"Deploy Contract"** tab
2. Upload your compiled `.wasm` contract file
3. Upload the contract metadata JSON file
4. Set the initial parameters (endowment, gas limit, etc.)
5. Click **"Deploy Contract"**

### 3. Manage Auctions

#### Load an Existing Auction

1. Enter the contract address in the **"Contract Address"** field
2. Click **"Load Auction"**
3. View auction details: current bid, blocks remaining, poem content

#### Place a Bid

1. Ensure the auction is loaded and active
2. Enter your bid amount (must be higher than current bid + minimum increment)
3. Click **"Place Bid"**
4. Confirm the transaction in your wallet

#### End an Auction

1. Wait until the auction period expires (blocks remaining = 0)
2. Click **"End Auction"**
3. The highest bidder will receive the poetry NFT

### 4. Token Display

- **PAS tokens** are displayed with 4 decimal places (e.g., `1,234.5678 PAS`)
- All amounts are automatically converted from Planck units (10^12)
- Minimum bid increments are clearly shown in the UI

## Troubleshooting

### PAPI Descriptors Not Found

**Error**: `Module not found: Can't resolve '../.papi/descriptors/dist'`

**Solution**: Generate the PAPI descriptors:
\`\`\`bash
npx papi add poet_chain_x -n paseo
npx papi
\`\`\`

### Wallet Not Connecting

**Issue**: Polkadot.js extension not detected

**Solutions**:
- Ensure the extension is installed and enabled
- Refresh the page after installing the extension
- Check that you have at least one account created in the extension
- The app will automatically enter demo mode if the extension is unavailable

### Garbled Address Display

**Issue**: Highest bidder shows as garbled characters

**Solution**: This has been fixed in the latest version. The address is now properly decoded to hex format. If you still see this, ensure you're running the latest code.

### Transaction Failures

**Common causes**:
- Insufficient balance for gas fees
- Bid amount too low (must exceed current bid + minimum increment)
- Auction has already ended
- Network connectivity issues

**Solution**: Check the browser console for detailed error messages with `[v0]` prefix.

## Network Information

- **Network**: Paseo Testnet
- **RPC Endpoint**: `wss://paseo.rpc.amforc.com`
- **Token**: PAS (Paseo testnet token)
- **Decimals**: 12 (1 PAS = 10^12 Planck)

### Getting Testnet Tokens

Visit the [Paseo Faucet](https://faucet.polkadot.io/) to receive free PAS tokens for testing.

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Polkadot API (PAPI)](https://papi.how/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by the [Polkadot](https://polkadot.network/) ecosystem

## Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/yourusername/poem-chain-x/issues)
- Join our community discussions

---

Made for the Polkadot ecosystem

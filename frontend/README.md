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

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Polkadot.js Extension** ([Chrome](https://chrome.google.com/webstore/detail/polkadot%7Bjs%7D-extension/mopnmbcafieddcagagdcbnhejhlodfdd) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/polkadot-js-extension/))

## Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd poem-chain-x
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate PAPI Descriptors

```bash
# Add your contract to PAPI
npx papi add poet_chain_x -n paseo

# Generate the TypeScript descriptors
npx papi
```

This creates the `.papi/descriptors/dist.ts` file with typed contract interfaces.

### 4. Configure Environment (Optional)

Create a `.env.local` file:

```env
NEXT_PUBLIC_WS_ENDPOINT=wss://paseo.rpc.amforc.com
```

## Running the Project

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Usage Guide

### 1. Connect Your Wallet

Click **"Connect Wallet"** and select an account from your Polkadot.js extension.

**Demo Mode**: If the extension is not detected, the app enters demo mode with mock accounts.

### 2. Deploy a Contract (Optional)

1. Navigate to the **"Deploy Contract"** tab
2. Upload your `.polkavm` contract file and metadata JSON
3. Set parameters and click **"Deploy Contract"**

### 3. Manage Auctions

#### Load an Existing Auction

1. Enter the contract address
2. Click **"Load Auction"**

#### Place a Bid

1. Enter your bid amount (must exceed current bid + minimum increment)
2. Click **"Place Bid"**
3. Confirm in your wallet

#### End an Auction

Once the auction expires, click **"End Auction"** to finalize.

## Troubleshooting

### PAPI Descriptors Not Found

```bash
npx papi add poet_chain_x -n paseo
npx papi
```

### Wallet Not Connecting

- Ensure Polkadot.js extension is installed and enabled
- Refresh the page
- Demo mode activates automatically if extension is unavailable

### Transaction Failures

Check the browser console for error messages. Common causes:
- Insufficient balance for gas fees
- Bid amount too low
- Auction already ended
- AccountUnmapped

## Network Information

- **Network**: Paseo Testnet
- **RPC Endpoint**: `wss://paseo.rpc.amforc.com`
- **Token**: PAS (Paseo testnet token)
- **Decimals**: 12 (1 PAS = 10^12 Planck)

Get testnet tokens at the [Paseo Faucet](https://faucet.polkadot.io/).

## License

MIT License

## Acknowledgments

- Built with [Polkadot API (PAPI)](https://papi.how/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Polkadot](https://polkadot.network/)

---

Built for the Polkadot ecosystem

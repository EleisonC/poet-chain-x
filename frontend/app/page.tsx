"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContractDeployer } from "@/components/contract-deployer"
import { AuctionManager } from "@/components/auction-manager"
import { WalletConnect } from "@/components/wallet-connect"

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<string>("")

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Poet Chain X</h1>
          <p className="text-muted-foreground text-lg">Auction your original poetry on the Polkadot blockchain (Paseo testnet Passet Hub)</p>
        </header>

        <div className="mb-6 flex justify-center">
          <WalletConnect
            isConnected={isConnected}
            account={account}
            onConnect={(acc) => {
              setIsConnected(true)
              setAccount(acc)
            }}
            onDisconnect={() => {
              setIsConnected(false)
              setAccount("")
            }}
          />
        </div>

        {isConnected ? (
          <Tabs defaultValue="deploy" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deploy">Deploy Contract</TabsTrigger>
              <TabsTrigger value="manage">Manage Auctions</TabsTrigger>
            </TabsList>
            <TabsContent value="deploy">
              <ContractDeployer account={account} />
            </TabsContent>
            <TabsContent value="manage">
              <AuctionManager account={account} />
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Welcome to Poem Chain X</CardTitle>
              <CardDescription>Connect your wallet to start auctioning poetry on the blockchain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">How it works:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Deploy a new auction contract with your poem</li>
                  <li>Set auction duration in blocks</li>
                  <li>Buyers place bids (must be higher than current highest)</li>
                  <li>Previous highest bidder gets refunded automatically</li>
                  <li>Winner is determined when auction ends</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

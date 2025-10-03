"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gavel, Eye, Send, Coins, Clock, User, ChevronDown, ChevronUp } from "lucide-react"
import { createInkSdk } from "@polkadot-api/sdk-ink"
import { createClient } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider"
import { contracts } from "../.papi/descriptors/dist"
import {
  getInjectedExtensions,
  connectInjectedExtension,
  type InjectedExtension,
  type InjectedPolkadotAccount,
} from "polkadot-api/pjs-signer"

interface AuctionManagerProps {
  account: string
}

function formatPAS(amount: string | number): string {
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
  if (isNaN(num)) return "0.0000"
  // Convert from Planck (smallest unit) to PAS tokens
  const pasAmount = num / 1_000_000_000_000
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(pasAmount)
}

export function AuctionManager({ account }: AuctionManagerProps) {
  const [contractAddress, setContractAddress] = useState("")
  const [bidAmount, setBidAmount] = useState("")
  const [isLoadingContract, setIsLoadingContract] = useState(false)
  const [isPlacingBid, setIsPlacingBid] = useState(false)
  const [isEndingAuction, setIsEndingAuction] = useState(false)
  const [poemText, setPoemText] = useState("")
  const [currentBid, setCurrentBid] = useState("")
  const [highestBidder, setHighestBidder] = useState("")
  const [endBlock, setEndBlock] = useState(0)
  const [currentBlock, setCurrentBlock] = useState(0)
  const [auctionIsActive, setAuctionIsActive] = useState(Boolean)
  const [showHighestBidder, setShowHighestBidder] = useState(true)

  const handlePlaceBid = async () => {
    if (!contractAddress || !bidAmount) return
    const bidInPlanck = Number.parseFloat(bidAmount) * 1_000_000_000_000
    const currentBidNum = Number.parseFloat(currentBid)
    if (bidInPlanck <= currentBidNum) {
      alert("Bid must be higher than current bid")
      return
    }

    setIsPlacingBid(true)
    try {
      const client = createClient(
        withPolkadotSdkCompat(
          getWsProvider(["wss://testnet-passet-hub.polkadot.io", "wss://passet-hub-paseo.ibp.network"]),
        ),
      )
      const poetChainInkSdk = createInkSdk(client)
      console.log("Your account is mapped?", await poetChainInkSdk.addressIsMapped(account))

      const poetChainXContract = poetChainInkSdk.getContract(contracts.poet_chain_x, contractAddress)
      console.log("Here is what we need to see", poetChainXContract)

      const extensions: string[] = getInjectedExtensions()
      const selectedExtension: InjectedExtension = await connectInjectedExtension(extensions[0])
      const accounts: InjectedPolkadotAccount[] = selectedExtension.getAccounts()
      const matching = accounts.find((acc) => acc.address === account)
      const polkadotSigner = matching ? matching.polkadotSigner : accounts[0].polkadotSigner

      const poetBidResult = await poetChainXContract
        .send("bid", {
          origin: account,
          value: BigInt(Math.floor(bidInPlanck)),
        })
        .signAndSubmit(polkadotSigner)

      if (poetBidResult.ok) {
        console.log("block", poetBidResult.block)
        console.log("events", poetChainXContract.filterEvents(poetBidResult.events))
        alert("Bid placed successfully!")
        // Reload contract data after successful bid
        await handleGetContract()
      } else {
        console.log("error", poetBidResult.dispatchError)
        alert("Failed to place bid")
      }
    } catch (error) {
      console.error("Failed to place bid:", error)
      alert("Error placing bid")
    } finally {
      setIsPlacingBid(false)
    }
  }

  const handleEndAuction = async () => {
    if (!contractAddress) return
    if (!auctionIsActive) return

    setIsEndingAuction(true)
    try {
      const client = createClient(
        withPolkadotSdkCompat(
          getWsProvider(["wss://testnet-passet-hub.polkadot.io", "wss://passet-hub-paseo.ibp.network"]),
        ),
      )
      const poetChainInkSdk = createInkSdk(client)
      console.log("Your account is mapped?", await poetChainInkSdk.addressIsMapped(account))

      const poetChainXContract = poetChainInkSdk.getContract(contracts.poet_chain_x, contractAddress)
      console.log("Here End Auction", poetChainXContract)

      const extensions: string[] = getInjectedExtensions()
      const selectedExtension: InjectedExtension = await connectInjectedExtension(extensions[0])
      const accounts: InjectedPolkadotAccount[] = selectedExtension.getAccounts()
      const matching = accounts.find((acc) => acc.address === account)
      const polkadotSigner = matching ? matching.polkadotSigner : accounts[0].polkadotSigner

      const poetBidResult = await poetChainXContract
        .send("end_auction", {
          origin: account,
        })
        .signAndSubmit(polkadotSigner)
      alert("Auction ended successfully!")
      // Reload contract data after ending auction
      await handleGetContract()
    } catch (error) {
      console.error("Failed to end auction:", error)
      alert("Error ending auction")
    } finally {
      setIsEndingAuction(false)
    }
  }

  const handleGetContract = async () => {
    if (!contractAddress) return

    setIsLoadingContract(true)
    try {
      const client = createClient(
        withPolkadotSdkCompat(
          getWsProvider(["wss://testnet-passet-hub.polkadot.io", "wss://passet-hub-paseo.ibp.network"]),
        ),
      )
      const poetChainInkSdk = createInkSdk(client)
      console.log("Your account is mapped?", await poetChainInkSdk.addressIsMapped(account))

      const poetChainXContract = poetChainInkSdk.getContract(contracts.poet_chain_x, contractAddress)
      console.log("Here is what we need to see", poetChainXContract)

      const peomInfo = await poetChainXContract.query("get_poem", {
        origin: account,
      })

      if (peomInfo.success) {
        setPoemText(peomInfo.value.response)
      }

      const highBidder = await poetChainXContract.query("get_winner", {
        origin: account,
      })
      if (highBidder.success) {
        const bidderAddress = highBidder.value.response[0]
        if (bidderAddress) {
          // If it's an object with address property, use that; otherwise convert to string
          const addressStr = bidderAddress.asHex()
          setHighestBidder(addressStr)
        } else {
          setHighestBidder("")
        }
        setCurrentBid(highBidder.value.response[1].toString())
      }

      const auction_info = await poetChainXContract.query("get_auction_info", {
        origin: account,
      })
      if (auction_info.success) {
        setEndBlock(auction_info.value.response[1])
        setAuctionIsActive(auction_info.value.response[2])
        setCurrentBlock(auction_info.value.response[0])
      }
    } catch (error) {
      console.error("Failed to load auction:", error)
      alert("Error loading auction contract")
    } finally {
      setIsLoadingContract(false)
    }
  }

  const currentBidInPAS = currentBid ? Number.parseFloat(currentBid) / 1_000_000_000_000 : 0
  const minimumBid = currentBidInPAS + 0.0001

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Load Auction Contract
          </CardTitle>
          <CardDescription>Enter a contract address to view and interact with the poetry auction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract-address" className="text-base">
              Contract Address
            </Label>
            <div className="flex gap-2">
              <Input
                id="contract-address"
                placeholder="5F69jP7VwzCp6pGZ93mv9FkAhwnwz4scR4J9asNeSgFPUGLq"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="font-mono text-sm"
              />
              <Button
                onClick={handleGetContract}
                disabled={!contractAddress || isLoadingContract}
                variant="default"
                className="gap-2 min-w-24"
              >
                <Eye className="h-4 w-4" />
                {isLoadingContract ? "Loading..." : "Load"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {contractAddress && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl">Poetry Auction</CardTitle>
                <CardDescription>View details and place your bid</CardDescription>
              </div>
              <Badge variant={auctionIsActive ? "default" : "secondary"} className="text-sm px-3 py-1">
                {auctionIsActive ? "Active Auction" : "Auction Ended"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-br from-muted/50 to-muted border rounded-lg p-6">
              <p className="text-sm whitespace-pre-line leading-relaxed text-pretty">{poemText || "Loading poem..."}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Coins className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Current Highest Bid</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold tracking-tight">{formatPAS(currentBid)}</p>
                        <span className="text-lg font-semibold text-muted-foreground">PAS</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Blocks Remaining</p>
                      <p className="text-3xl font-bold tracking-tight">{Math.max(0, endBlock - currentBlock)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {highestBidder && (
              <Card className="border">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Highest Bidder</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHighestBidder(!showHighestBidder)}
                        className="gap-1"
                      >
                        {showHighestBidder ? (
                          <>
                            Hide <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Show <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                    {showHighestBidder && (
                      <p className="font-mono text-sm break-all pl-11">
                        {highestBidder}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="bid" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-11">
                <TabsTrigger value="bid" className="gap-2">
                  <Gavel className="h-4 w-4" />
                  Place Bid
                </TabsTrigger>
                <TabsTrigger value="end" className="gap-2">
                  <Send className="h-4 w-4" />
                  End Auction
                </TabsTrigger>
              </TabsList>
              <TabsContent value="bid" className="space-y-4 mt-6">
                <div className="space-y-3">
                  <Label htmlFor="bid-amount" className="text-base">
                    Bid Amount
                  </Label>
                  <div className="relative">
                    <Input
                      id="bid-amount"
                      type="number"
                      placeholder="0.0000"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      min={minimumBid}
                      step="0.0001"
                      className="text-lg pr-16 h-12"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      PAS
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    Minimum bid: {formatPAS(minimumBid * 1_000_000_000_000)} PAS
                  </p>
                </div>
                <Button
                  onClick={handlePlaceBid}
                  disabled={!bidAmount || isPlacingBid || !auctionIsActive}
                  className="w-full gap-2 h-11"
                  size="lg"
                >
                  <Gavel className="h-4 w-4" />
                  {isPlacingBid ? "Placing Bid..." : "Place Bid"}
                </Button>
              </TabsContent>
              <TabsContent value="end" className="space-y-4 mt-6">
                <Card className="border-2 bg-muted/50">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      <p className="font-semibold">End Auction</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Only available after block {endBlock}. This will transfer the highest bid to the seller and mark
                      the auction as complete.
                    </p>
                    {currentBlock < endBlock && (
                      <p className="text-sm font-medium text-primary">
                        {endBlock - currentBlock} blocks remaining until auction can be ended
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Button
                  onClick={handleEndAuction}
                  disabled={currentBlock < endBlock || isEndingAuction || !auctionIsActive}
                  variant="secondary"
                  className="w-full gap-2 h-11"
                  size="lg"
                >
                  <Send className="h-4 w-4" />
                  {isEndingAuction ? "Ending Auction..." : "End Auction"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

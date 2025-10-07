'use client'

import { useState } from "react"
import { web3Enable, web3Accounts } from "@polkadot/extension-dapp"
import { ApiPromise, WsProvider } from "@polkadot/api"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Wallet, LogOut, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// papi spec
import { passet } from "../.papi/descriptors/"

interface WalletConnectProps {
  isConnected: boolean
  account: string
  onConnect: (account: string, api: any) => void
  onDisconnect: () => void
}

export function WalletConnect({ isConnected, account, onConnect, onDisconnect }: WalletConnectProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<any[]>([])

  const handleConnect = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Enable the extension
      const extensions = await web3Enable("Poem Chain")
      console.log("[wallet] web3Enable: Enabled", extensions.length, "extensions:", extensions)

      if (extensions.length === 0) {
        throw new Error("No extension found. Please install Polkadot.js extension.")
      }

      // Get all accounts
      const allAccounts = await web3Accounts()
      console.log("[wallet] Found accounts:", allAccounts)

      if (allAccounts.length === 0) {
        throw new Error("No accounts found. Please create an account in your Polkadot.js extension.")
      }

      setAccounts(allAccounts)

      onConnect(allAccounts[0].address, null)
      setIsLoading(false)

      // Connect to the chain
      const provider = new WsProvider("wss://testnet-passet-hub.polkadot.io")
      const api = await ApiPromise.create({
        provider,
       })

      // Update with API once connected
      // Use the first account by default
      onConnect(allAccounts[0].address, api)
    } catch (err) {
      console.error("[wallet] Failed to connect wallet:", err)
      setError(err instanceof Error ? err.message : "Failed to connect wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAccount = (address: string) => {
    onConnect(address, null)
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleConnect} disabled={isLoading} className="gap-2">
          <Wallet className="h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    )
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4" />
        <Select
          value={account}
          onValueChange={(val) => handleSelectAccount(val)}
        >
          <SelectTrigger className="w-[260px]">
            <SelectValue
              placeholder="Select Account"
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Connected Accounts</SelectLabel>
              {accounts.map((acc) => (
                <SelectItem key={acc.address} value={acc.address}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">
                      {acc.address.slice(0, 8)}...{acc.address.slice(-6)}
                    </span>
                    {acc.address === account && (
                      <Check className="h-4 w-4 text-green-500 ml-2" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <Button onClick={handleConnect} disabled={isLoading} className="gap-2">
      <Wallet className="h-4 w-4" />
      {isLoading ? "Connecting..." : "Connect Wallet"}
    </Button>
  )
}

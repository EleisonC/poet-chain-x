"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { createInkSdk } from "@polkadot-api/sdk-ink"
import { createClient } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider"
import { contracts } from '../.papi/descriptors'
import { Binary } from "polkadot-api";
import { blake2AsU8a } from "@polkadot/util-crypto"
import {
  getInjectedExtensions,
  connectInjectedExtension,
  InjectedExtension,
  InjectedPolkadotAccount,
} from "polkadot-api/pjs-signer"
 

interface ContractDeployerProps {
  account: string
}

export function ContractDeployer({ account }: ContractDeployerProps) {
  const [poemText, setPoemText] = useState("")
  const [durationBlocks, setDurationBlocks] = useState(100)
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<{
    success: boolean
    address?: string
    error?: string
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContractFile(e.target.files[0])
    }
  }

const handleDeploy = async () => {
  if ( !contractFile || !poemText || !durationBlocks) {
    setDeploymentResult({
      success: false,
      error: "Please fill in all fields and upload a contract file",
    })
    return
  }

  if (durationBlocks <= 0) {
    setDeploymentResult({
      success: false,
      error: "Auction duration must be greater than 0",
    })
    return
  }

  setIsDeploying(true)
  setDeploymentResult(null)

  try {
  
    const arrayBuffer = await contractFile.arrayBuffer();
    const codeBlob = new Uint8Array(arrayBuffer)
    const code = Binary.fromBytes(codeBlob)

    const client = createClient(
      withPolkadotSdkCompat(
        getWsProvider([
          "wss://testnet-passet-hub.polkadot.io",
          "wss://passet-hub-paseo.ibp.network",
        ]),
      ),
    )
    const poetChainInkSdk = createInkSdk(client) // poetChainInkSdk
     // Read the contract file
    console.log("Your account is mapped?", await poetChainInkSdk.addressIsMapped(account))
    
    // Get deployer for PoetChainX contract
    const poetChainXDeployer = poetChainInkSdk.getDeployer(contracts.poet_chain_x, code)

    const hash = blake2AsU8a(poemText)  // gives Uint8Array
    const salt = Binary.fromBytes(hash)

    const estimatedAddress = await poetChainXDeployer.estimateAddress("new", {
      origin: account,
      salt: salt,
      data: {
        poem: poemText,
        duration: durationBlocks,
      },
    })

    

    console.log("estimated address", estimatedAddress)

    // Dry run first (recommended)
    const dryRunResult = await poetChainXDeployer.dryRun("new", {
      origin: account,
      data: {
        poem: poemText,
        duration: durationBlocks,
      },
    })

    if (!dryRunResult.success) {
      console.log("Here is everything not good deploy", dryRunResult);
      setDeploymentResult({
        success: false,
        error: "Dry run failed. Check constructor params.",
      })
      
      client.destroy()
      return
    }

    // Connect to polkadot.js extension
    const extensions: string[] = getInjectedExtensions()
    const selectedExtension: InjectedExtension = await connectInjectedExtension(extensions[0])
    const accounts: InjectedPolkadotAccount[] = selectedExtension.getAccounts()
    const matching = accounts.find((acc) => acc.address === account)
    const polkadotSigner = matching
      ? matching.polkadotSigner
      : accounts[0].polkadotSigner


    // Perform actual deployment using dry-run result
    const result = await dryRunResult.value.deploy().signAndSubmit(polkadotSigner)

    // // Parse deployment events
    const data: Array<{
      address: string
      contractEvents: any[],
    }> = poetChainInkSdk.readDeploymentEvents(contracts.poet_chain_x, result.events)

    setDeploymentResult({
      success: true,
      address: data[0]?.address,
    })
  } catch (error) {
    console.log("Here is everything. 44", error);
    setDeploymentResult({
      success: false,
      error: error instanceof Error ? error.message : "Deployment failed",
    })
  } finally {
    setIsDeploying(false)
  }
}


  return (
    <Card>
      <CardHeader>
        <CardTitle>Deploy Poetry Auction Contract</CardTitle>
        <CardDescription>Upload your contract file and set auction parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          {/* since we are using inkV6 we shall use the .polkavm file */}
          <Label htmlFor="contract-file">Contract File (.polkavm)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="contract-file"
              type="file"
              accept=".polkavm"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {contractFile && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">Upload the compiled contract blob</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="poem-text">Poem Text</Label>
          <Textarea
            id="poem-text"
            placeholder="Enter your original poetry here..."
            value={poemText}
            onChange={(e) => setPoemText(e.target.value)}
            rows={6}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Auction Duration (blocks)</Label>
          <Input
            id="duration"
            type="number"
            placeholder="100"
            value={durationBlocks}
            onChange={(e) => setDurationBlocks(parseInt(e.target.value))}
            min="1"
          />
          <p className="text-xs text-muted-foreground">Number of blocks the auction will run (~6 seconds per block)</p>
        </div>

        {deploymentResult && (
          <Alert variant={deploymentResult.success ? "default" : "destructive"}>
            {deploymentResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>
              {deploymentResult.success ? (
                <div className="space-y-1">
                  <p className="font-semibold">Contract deployed successfully!</p>
                  <p className="text-sm font-mono break-all">Address: {deploymentResult.address}</p>
                </div>
              ) : (
                <p>{deploymentResult.error}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleDeploy}
          disabled={!contractFile || !poemText || !durationBlocks || isDeploying}
          className="w-full gap-2"
        >
          {isDeploying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deploying Contract...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Deploy Auction Contract
            </>
          )}
        </Button>

        <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
          <p className="font-semibold">Deployment Process:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Contract is uploaded to the chain</li>
            <li>Constructor is called with poem and duration</li>
            <li>Unique contract instance is created at new address</li>
            <li>Auction becomes active and ready for bids</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}


import { Injectable } from "@nestjs/common";
import { ethers } from "ethers";

@Injectable()
export class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL
    );
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
  }

  getProvider() {
    return this.provider;
  }

  getWallet() {
    return this.wallet;
  }
}

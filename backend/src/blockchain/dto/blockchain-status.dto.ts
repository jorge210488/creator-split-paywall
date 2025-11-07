export class BlockchainStatusDto {
  network: string;
  contractAddress: string;
  rpcConnected: boolean;
  lastProcessedBlock: number;
  currentBlock: number;
  confirmations: number;
  polling: boolean;
  pollInterval: number;
  eventsProcessed: number;
}

import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ethers } from "ethers";
import { Wallet } from "../entities/wallet.entity";
import { Subscription } from "../entities/subscription.entity";
import { Payment } from "../entities/payment.entity";
import { ProcessedEvent } from "../entities/processed-event.entity";
import { Contract } from "../entities/contract.entity";
import { Payout } from "../entities/payout.entity";
import { ConfigChange, ConfigChangeType } from "../entities/config-change.entity";
import subscriptionAbi from "./abi/subscription.abi.json";
import { BlockchainStatusDto } from "./dto/blockchain-status.dto";

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private contractEntity: Contract;
  private isProcessing = false;
  private pollInterval: NodeJS.Timeout;
  private eventsProcessedCount = 0;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(ProcessedEvent)
    private processedEventRepository: Repository<ProcessedEvent>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Payout)
    private payoutRepository: Repository<Payout>,
    @InjectRepository(ConfigChange)
    private configChangeRepository: Repository<ConfigChange>,
  ) {}

  private initPromise: Promise<void> | null = null;
  private initialized = false;

  async onModuleInit() {
    this.initPromise = this.initialize()
      .then(() => {
        this.initialized = true;
      })
      .catch((err) => {
        this.logger.error(`Initialization error: ${err.message}`);
      });
    await this.initPromise;
  }

  private async initialize() {
    try {
      const rpcUrl = this.configService.get<string>("blockchain.rpcUrl");
      const contractAddress = this.configService.get<string>(
        "blockchain.contractAddress"
      );
      const network =
        this.configService.get<string>("blockchain.contractNetwork") ||
        "sepolia";

      if (!rpcUrl || !contractAddress) {
        this.logger.warn(
          "Blockchain configuration missing. Skipping initialization."
        );
        return;
      }

      this.logger.log(`Initializing blockchain service for ${network}...`);

      // Connect to provider
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Initialize contract
      this.contract = new ethers.Contract(
        contractAddress,
        subscriptionAbi,
        this.provider
      );

      // Get or create contract entity
      this.contractEntity = await this.getOrCreateContract(
        contractAddress,
        network
      );

      // Perform initial backfill
      await this.backfillEvents();

      // Start polling for new events
      this.startPolling();

      this.logger.log("Blockchain service initialized successfully");
    } catch (error) {
      this.logger.error(
        `Failed to initialize blockchain service: ${error.message}`,
        error.stack
      );
    }
  }

  private async getOrCreateContract(
    address: string,
    network: string
  ): Promise<Contract> {
    let contract = await this.contractRepository.findOne({
      where: { address: address.toLowerCase(), network },
    });

    if (!contract) {
      const startBlock = this.configService.get<number>(
        "blockchain.startBlock"
      );
      contract = this.contractRepository.create({
        address: address.toLowerCase(),
        network,
        startBlock,
        lastProcessedBlock: startBlock || 0,
        active: true,
      });
      await this.contractRepository.save(contract);
      this.logger.log(`Created new contract entity: ${address}`);
    }

    return contract;
  }

  private async backfillEvents() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const confirmations =
        this.configService.get<number>("blockchain.confirmations") || 3;
      const safeBlock = currentBlock - confirmations;

      let fromBlock = this.contractEntity.lastProcessedBlock + 1;

      if (fromBlock === 1 && !this.contractEntity.startBlock) {
        const lookbackBlocks =
          this.configService.get<number>("blockchain.lookbackBlocks") || 2000;
        fromBlock = Math.max(0, currentBlock - lookbackBlocks);
        this.logger.log(
          `No start block configured. Looking back ${lookbackBlocks} blocks from current.`
        );
      }

      if (fromBlock > safeBlock) {
        this.logger.log(
          `Already up to date. Last processed: ${this.contractEntity.lastProcessedBlock}, Safe block: ${safeBlock}`
        );
        return;
      }

      this.logger.log(
        `Backfilling events from block ${fromBlock} to ${safeBlock}`
      );

      // Process in chunks to avoid RPC limits
      const chunkSize = 2000;
      for (let start = fromBlock; start <= safeBlock; start += chunkSize) {
        const end = Math.min(start + chunkSize - 1, safeBlock);
        await this.processBlockRange(start, end);
      }

      this.logger.log(`Backfill complete. Processed up to block ${safeBlock}`);
    } catch (error) {
      this.logger.error(`Backfill failed: ${error.message}`, error.stack);
    }
  }

  private async processBlockRange(fromBlock: number, toBlock: number) {
    try {
      // Query all event types
      const [
        subscriptionEvents,
        paymentReleasedEvents,
        priceUpdatedEvents,
        durationUpdatedEvents,
      ] = await Promise.all([
        this.contract.queryFilter(
          this.contract.filters.SubscriptionStarted(),
          fromBlock,
          toBlock
        ),
        this.contract.queryFilter(
          this.contract.filters.PaymentReleased(),
          fromBlock,
          toBlock
        ),
        this.contract.queryFilter(
          this.contract.filters.PriceUpdated(),
          fromBlock,
          toBlock
        ),
        this.contract.queryFilter(
          this.contract.filters.DurationUpdated(),
          fromBlock,
          toBlock
        ),
      ]);

      this.logger.log(
        `Found events in blocks ${fromBlock}-${toBlock}: ${subscriptionEvents.length} subscriptions, ${paymentReleasedEvents.length} payments, ${priceUpdatedEvents.length} price changes, ${durationUpdatedEvents.length} duration changes`
      );

      // Process each event type
      for (const event of subscriptionEvents) {
        await this.processSubscriptionEvent(event as ethers.EventLog);
      }

      for (const event of paymentReleasedEvents) {
        await this.processPaymentReleasedEvent(event as ethers.EventLog);
      }

      for (const event of priceUpdatedEvents) {
        await this.processPriceUpdatedEvent(event as ethers.EventLog);
      }

      for (const event of durationUpdatedEvents) {
        await this.processDurationUpdatedEvent(event as ethers.EventLog);
      }

      // Update last processed block
      this.contractEntity.lastProcessedBlock = toBlock;
      await this.contractRepository.save(this.contractEntity);
    } catch (error) {
      this.logger.error(
        `Error processing block range ${fromBlock}-${toBlock}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private async processSubscriptionEvent(event: ethers.EventLog) {
    try {
      const { subscriber, expiry, amount } = event.args as any;
      const txHash = event.transactionHash;
      const logIndex = event.index;
      const blockNumber = event.blockNumber;

      // Check if already processed (idempotency)
      const existingEvent = await this.processedEventRepository.findOne({
        where: { txHash, logIndex },
      });

      if (existingEvent) {
        this.logger.debug(`Event already processed: ${txHash}:${logIndex}`);
        return;
      }

      // Get block for timestamp
      const block = await event.getBlock();
      const timestamp = new Date(Number(block.timestamp) * 1000);

      // Normalize address
      const normalizedAddress = subscriber.toLowerCase();

      // Get or create wallet
      let wallet = await this.walletRepository.findOne({
        where: { address: normalizedAddress },
      });

      if (!wallet) {
        wallet = this.walletRepository.create({ address: normalizedAddress });
        await this.walletRepository.save(wallet);
      }

      // Create payment record
      const payment = this.paymentRepository.create({
        wallet,
        amount: amount.toString(),
        txHash,
        blockNumber,
        logIndex,
        timestamp,
      });
      await this.paymentRepository.save(payment);

      // Create subscription record
      const subscription = this.subscriptionRepository.create({
        wallet,
        expiryTimestamp: expiry.toString(),
        activatedAt: timestamp,
        amountPaid: amount.toString(),
        txHash,
        blockNumber,
        logIndex,
      });
      await this.subscriptionRepository.save(subscription);

      // Mark event as processed
      const processedEvent = this.processedEventRepository.create({
        txHash,
        logIndex,
        blockNumber,
        eventName: "SubscriptionStarted",
        eventData: {
          subscriber: normalizedAddress,
          expiry: expiry.toString(),
          amount: amount.toString(),
        },
      });
      await this.processedEventRepository.save(processedEvent);

      this.eventsProcessedCount++;
      this.logger.log(
        `Processed subscription: ${normalizedAddress} (tx: ${txHash})`
      );
    } catch (error) {
      this.logger.error(
        `Error processing subscription event: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private async processPaymentReleasedEvent(event: ethers.EventLog) {
    try {
      const { to, amount } = event.args as any;
      const txHash = event.transactionHash;
      const logIndex = event.index;
      const blockNumber = event.blockNumber;

      // Check if already processed (idempotency)
      const existingEvent = await this.processedEventRepository.findOne({
        where: { txHash, logIndex },
      });

      if (existingEvent) {
        this.logger.debug(`Event already processed: ${txHash}:${logIndex}`);
        return;
      }

      // Get block for timestamp
      const block = await event.getBlock();
      const timestamp = new Date(Number(block.timestamp) * 1000);

      // Normalize address
      const normalizedPayee = to.toLowerCase();

      // Create payout record
      const payout = this.payoutRepository.create({
        payeeAddress: normalizedPayee,
        amount: amount.toString(),
        txHash,
        blockNumber,
        logIndex,
        timestamp,
      });
      await this.payoutRepository.save(payout);

      // Mark event as processed
      const processedEvent = this.processedEventRepository.create({
        txHash,
        logIndex,
        blockNumber,
        eventName: "PaymentReleased",
        eventData: {
          to: normalizedPayee,
          amount: amount.toString(),
        },
      });
      await this.processedEventRepository.save(processedEvent);

      this.eventsProcessedCount++;
      this.logger.log(
        `Processed payment release: ${normalizedPayee} received ${ethers.formatEther(amount)} ETH (tx: ${txHash})`
      );
    } catch (error) {
      this.logger.error(
        `Error processing payment released event: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private async processPriceUpdatedEvent(event: ethers.EventLog) {
    try {
      const { oldPrice, newPrice } = event.args as any;
      const txHash = event.transactionHash;
      const logIndex = event.index;
      const blockNumber = event.blockNumber;

      // Check if already processed (idempotency)
      const existingEvent = await this.processedEventRepository.findOne({
        where: { txHash, logIndex },
      });

      if (existingEvent) {
        this.logger.debug(`Event already processed: ${txHash}:${logIndex}`);
        return;
      }

      // Get block for timestamp
      const block = await event.getBlock();
      const timestamp = new Date(Number(block.timestamp) * 1000);

      // Create config change record
      const configChange = this.configChangeRepository.create({
        changeType: ConfigChangeType.PRICE_UPDATED,
        oldValue: oldPrice.toString(),
        newValue: newPrice.toString(),
        txHash,
        blockNumber,
        logIndex,
        timestamp,
      });
      await this.configChangeRepository.save(configChange);

      // Mark event as processed
      const processedEvent = this.processedEventRepository.create({
        txHash,
        logIndex,
        blockNumber,
        eventName: "PriceUpdated",
        eventData: {
          oldPrice: oldPrice.toString(),
          newPrice: newPrice.toString(),
        },
      });
      await this.processedEventRepository.save(processedEvent);

      this.eventsProcessedCount++;
      this.logger.log(
        `Processed price update: ${ethers.formatEther(oldPrice)} ETH → ${ethers.formatEther(newPrice)} ETH (tx: ${txHash})`
      );
    } catch (error) {
      this.logger.error(
        `Error processing price updated event: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private async processDurationUpdatedEvent(event: ethers.EventLog) {
    try {
      const { oldDuration, newDuration } = event.args as any;
      const txHash = event.transactionHash;
      const logIndex = event.index;
      const blockNumber = event.blockNumber;

      // Check if already processed (idempotency)
      const existingEvent = await this.processedEventRepository.findOne({
        where: { txHash, logIndex },
      });

      if (existingEvent) {
        this.logger.debug(`Event already processed: ${txHash}:${logIndex}`);
        return;
      }

      // Get block for timestamp
      const block = await event.getBlock();
      const timestamp = new Date(Number(block.timestamp) * 1000);

      // Create config change record
      const configChange = this.configChangeRepository.create({
        changeType: ConfigChangeType.DURATION_UPDATED,
        oldValue: oldDuration.toString(),
        newValue: newDuration.toString(),
        txHash,
        blockNumber,
        logIndex,
        timestamp,
      });
      await this.configChangeRepository.save(configChange);

      // Mark event as processed
      const processedEvent = this.processedEventRepository.create({
        txHash,
        logIndex,
        blockNumber,
        eventName: "DurationUpdated",
        eventData: {
          oldDuration: oldDuration.toString(),
          newDuration: newDuration.toString(),
        },
      });
      await this.processedEventRepository.save(processedEvent);

      this.eventsProcessedCount++;
      const oldDays = Number(oldDuration) / 86400;
      const newDays = Number(newDuration) / 86400;
      this.logger.log(
        `Processed duration update: ${oldDays} days → ${newDays} days (tx: ${txHash})`
      );
    } catch (error) {
      this.logger.error(
        `Error processing duration updated event: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private startPolling() {
    const pollIntervalMs =
      this.configService.get<number>("blockchain.pollInterval") || 15000;

    this.pollInterval = setInterval(async () => {
      if (this.isProcessing) {
        this.logger.debug("Previous poll still processing, skipping...");
        return;
      }

      this.isProcessing = true;
      try {
        const currentBlock = await this.provider.getBlockNumber();
        const confirmations =
          this.configService.get<number>("blockchain.confirmations") || 3;
        const safeBlock = currentBlock - confirmations;

        const fromBlock = this.contractEntity.lastProcessedBlock + 1;

        if (fromBlock <= safeBlock) {
          this.logger.debug(
            `Polling: processing blocks ${fromBlock} to ${safeBlock}`
          );
          await this.processBlockRange(fromBlock, safeBlock);
        }
      } catch (error) {
        this.logger.error(`Polling error: ${error.message}`, error.stack);
      } finally {
        this.isProcessing = false;
      }
    }, pollIntervalMs);

    this.logger.log(`Started polling with interval ${pollIntervalMs}ms`);
  }

  async getSubscriptionStatus(address: string) {
    const normalizedAddress = address.toLowerCase();

    if (!this.contract) {
      this.logger.warn("Contract not initialized yet");
      throw new ServiceUnavailableException("Blockchain contract not ready");
    }

    try {
      // Use try/catch around call; if contract doesn't expose mapping for address yet, treat as inactive
      const expiry = await this.contract.subscriptionExpiry(normalizedAddress);
      const expiryTimestamp = Number(expiry);
      const now = Math.floor(Date.now() / 1000);
      const isActive = expiryTimestamp > now;

      return {
        address: normalizedAddress,
        active: isActive,
        expiresAt:
          expiryTimestamp > 0 ? new Date(expiryTimestamp * 1000) : null,
        expiryTimestamp: expiryTimestamp.toString(),
      };
    } catch (error) {
      this.logger.error(`Error getting subscription status: ${error.message}`);
      // Graceful fallback: if read fails, return inactive status instead of throwing raw TypeError
      return {
        address: normalizedAddress,
        active: false,
        expiresAt: null,
        expiryTimestamp: "0",
      };
    }
  }

  async getIngestionStatus(): Promise<BlockchainStatusDto> {
    if (!this.initialized || !this.provider || !this.contract) {
      return {
        network:
          this.configService.get<string>("blockchain.contractNetwork") ||
          "unknown",
        contractAddress:
          this.configService.get<string>("blockchain.contractAddress") ||
          "not configured",
        rpcConnected: false,
        lastProcessedBlock: 0,
        currentBlock: 0,
        confirmations:
          this.configService.get<number>("blockchain.confirmations") || 3,
        polling: false,
        pollInterval:
          this.configService.get<number>("blockchain.pollInterval") || 15000,
        eventsProcessed: this.eventsProcessedCount,
      };
    }

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const confirmations =
        this.configService.get<number>("blockchain.confirmations") || 3;
      const pollInterval =
        this.configService.get<number>("blockchain.pollInterval") || 15000;

      return {
        network:
          this.configService.get<string>("blockchain.contractNetwork") ||
          "sepolia",
        contractAddress: this.contract.target as string,
        rpcConnected: true,
        lastProcessedBlock: this.contractEntity?.lastProcessedBlock || 0,
        currentBlock,
        confirmations,
        polling: !!this.pollInterval,
        pollInterval,
        eventsProcessed: this.eventsProcessedCount,
      };
    } catch (error) {
      this.logger.error(`Error getting ingestion status: ${error.message}`);
      return {
        network:
          this.configService.get<string>("blockchain.contractNetwork") ||
          "unknown",
        contractAddress: this.contract.target as string,
        rpcConnected: false,
        lastProcessedBlock: this.contractEntity?.lastProcessedBlock || 0,
        currentBlock: 0,
        confirmations:
          this.configService.get<number>("blockchain.confirmations") || 3,
        polling: !!this.pollInterval,
        pollInterval:
          this.configService.get<number>("blockchain.pollInterval") || 15000,
        eventsProcessed: this.eventsProcessedCount,
      };
    }
  }

  onModuleDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.logger.log("Stopped polling");
    }
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Wallet } from "../entities/wallet.entity";
import { Subscription } from "../entities/subscription.entity";
import { Payment } from "../entities/payment.entity";
import { BlockchainService } from "../blockchain/blockchain.service";

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private blockchainService: BlockchainService
  ) {}

  async getStatus(address: string) {
    const normalizedAddress = address.toLowerCase();

    // Get on-chain status (most authoritative)
    const onChainStatus = await this.blockchainService.getSubscriptionStatus(
      normalizedAddress
    );

    // Get last payment from DB
    const wallet = await this.walletRepository.findOne({
      where: { address: normalizedAddress },
    });

    let lastPayment = null;
    if (wallet) {
      const payment = await this.paymentRepository.findOne({
        where: { wallet: { id: wallet.id } },
        order: { timestamp: "DESC" },
      });

      if (payment) {
        lastPayment = {
          amount: payment.amount,
          txHash: payment.txHash,
          timestamp: payment.timestamp,
        };
      }
    }

    return {
      ...onChainStatus,
      lastPayment,
    };
  }

  async getHistory(address: string, page: number = 1, limit: number = 10) {
    const normalizedAddress = address.toLowerCase();

    const wallet = await this.walletRepository.findOne({
      where: { address: normalizedAddress },
    });

    if (!wallet) {
      return {
        address: normalizedAddress,
        subscriptions: [],
        payments: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const [subscriptions, subsTotal] =
      await this.subscriptionRepository.findAndCount({
        where: { wallet: { id: wallet.id } },
        order: { activatedAt: "DESC" },
        skip: (page - 1) * limit,
        take: limit,
      });

    const [payments, paymentsTotal] = await this.paymentRepository.findAndCount(
      {
        where: { wallet: { id: wallet.id } },
        order: { timestamp: "DESC" },
        skip: (page - 1) * limit,
        take: limit,
      }
    );

    return {
      address: normalizedAddress,
      subscriptions: subscriptions.map((sub) => ({
        expiryTimestamp: sub.expiryTimestamp,
        activatedAt: sub.activatedAt,
        amountPaid: sub.amountPaid,
        txHash: sub.txHash,
        blockNumber: sub.blockNumber,
      })),
      payments: payments.map((payment) => ({
        amount: payment.amount,
        txHash: payment.txHash,
        blockNumber: payment.blockNumber,
        timestamp: payment.timestamp,
      })),
      pagination: {
        page,
        limit,
        totalSubscriptions: subsTotal,
        totalPayments: paymentsTotal,
        totalPages: Math.ceil(Math.max(subsTotal, paymentsTotal) / limit),
      },
    };
  }

  async getCreatorMetrics(creatorId: string) {
    // Placeholder for future implementation
    // This would aggregate subscriptions and payments for a specific creator
    return {
      creatorId,
      totalSubscribers: 0,
      activeSubscribers: 0,
      totalRevenue: "0",
      message: "Creator metrics endpoint - coming soon",
    };
  }
}

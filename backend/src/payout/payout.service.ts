import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payout } from '../entities/payout.entity';
import { ethers } from 'ethers';

@Injectable()
export class PayoutService {
  constructor(
    @InjectRepository(Payout)
    private payoutRepository: Repository<Payout>,
  ) {}

  async getPayoutHistory(address: string, page: number = 1, limit: number = 10) {
    const normalizedAddress = address.toLowerCase();
    limit = Math.min(limit, 100); // Cap at 100

    const [payouts, total] = await this.payoutRepository.findAndCount({
      where: { payeeAddress: normalizedAddress },
      order: { timestamp: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      address: normalizedAddress,
      payouts: payouts.map(payout => ({
        id: payout.id,
        amount: payout.amount,
        amountEth: ethers.formatEther(payout.amount),
        txHash: payout.txHash,
        blockNumber: payout.blockNumber,
        timestamp: payout.timestamp,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllPayouts(page: number = 1, limit: number = 10) {
    limit = Math.min(limit, 100);

    const [payouts, total] = await this.payoutRepository.findAndCount({
      order: { timestamp: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      payouts: payouts.map(payout => ({
        id: payout.id,
        payeeAddress: payout.payeeAddress,
        amount: payout.amount,
        amountEth: ethers.formatEther(payout.amount),
        txHash: payout.txHash,
        blockNumber: payout.blockNumber,
        timestamp: payout.timestamp,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

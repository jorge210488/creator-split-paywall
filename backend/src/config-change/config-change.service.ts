import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ConfigChange, ConfigChangeType } from '../entities/config-change.entity';
import { ethers } from 'ethers';

@Injectable()
export class ConfigChangeService {
  constructor(
    @InjectRepository(ConfigChange)
    private configChangeRepository: Repository<ConfigChange>,
  ) {}

  async getConfigChanges(page: number = 1, limit: number = 10, type?: string) {
    limit = Math.min(limit, 100); // Cap at 100

    const where: FindOptionsWhere<ConfigChange> = {};
    if (type && Object.values(ConfigChangeType).includes(type as ConfigChangeType)) {
      where.changeType = type as ConfigChangeType;
    }

    const [changes, total] = await this.configChangeRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      changes: changes.map(change => {
        const baseChange = {
          id: change.id,
          changeType: change.changeType,
          txHash: change.txHash,
          blockNumber: change.blockNumber,
          timestamp: change.timestamp,
        };

        if (change.changeType === ConfigChangeType.PRICE_UPDATED) {
          return {
            ...baseChange,
            oldPrice: change.oldValue,
            newPrice: change.newValue,
            oldPriceEth: ethers.formatEther(change.oldValue),
            newPriceEth: ethers.formatEther(change.newValue),
          };
        } else {
          // Duration in seconds, convert to days for readability
          const oldDays = Number(change.oldValue) / 86400;
          const newDays = Number(change.newValue) / 86400;
          return {
            ...baseChange,
            oldDuration: change.oldValue,
            newDuration: change.newValue,
            oldDurationDays: oldDays,
            newDurationDays: newDays,
          };
        }
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

// src/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../users/entities/user.entity';
import { Account, AccountStatus } from '../accounts/entities/account.entity';
import { GetUsersDto } from './dto/get-users.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  async getUsers(dto: GetUsersDto) {
    const { page = 1, limit = 10, status, role, search } = dto;

    const qb = this.userRepo
      .createQueryBuilder('user')
      // Join account để trả thêm account_number và balance
      .leftJoinAndSelect('user.accounts', 'account')
      .select([
        'user.id',
        'user.full_name',
        'user.email',
        'user.role',
        'user.status',
        'user.created_at',
        // Không select password_hash
        'account.account_number',
        'account.balance',
        'account.status',
      ])
      .orderBy('user.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      qb.andWhere('user.status = :status', { status });
    }

    if (role) {
      qb.andWhere('user.role = :role', { role });
    }

    // Tìm kiếm theo tên hoặc email (case-insensitive)
    if (search?.trim()) {
      qb.andWhere(
        '(LOWER(user.full_name) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: `%${search.trim().toLowerCase()}%` },
      );
    }

    const [users, total] = await qb.getManyAndCount();

    return {
      data: users.map((user) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        account: user.accounts?.[0]
          ? {
              account_number: user.accounts[0].account_number,
              balance: user.accounts[0].balance,
              status: user.accounts[0].status,
            }
          : null,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async updateUserStatus(id: string, status: UserStatus) {
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) throw new NotFoundException('User not found');

    user.status = status;
    await this.userRepo.save(user);

    // Đồng bộ trạng thái account theo user
    await this.accountRepo.update(
      { user_id: id },
      { status: status === UserStatus.ACTIVE ? AccountStatus.ACTIVE : AccountStatus.LOCKED },
    );

    return {
      message: `This account has been ${status === UserStatus.ACTIVE ? 'activated' : 'locked'}`,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        status: user.status,
      },
    };
  }
}

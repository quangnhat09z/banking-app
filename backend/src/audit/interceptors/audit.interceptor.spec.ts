import { Test, TestingModule } from '@nestjs/testing';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from '../audit.service';
import { Reflector } from '@nestjs/core';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;

  beforeEach(async () => {
    // 1. Tạo mock (bản giả) cho các dependencies
    const mockAuditService = {
      log: jest.fn(), // Giả lập hàm log
    };

    const mockReflector = {
      get: jest.fn(), // Giả lập hàm get metadata
    };

    // 2. Build Testing Module chuẩn của NestJS
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditInterceptor,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    interceptor = module.get<AuditInterceptor>(AuditInterceptor);
  });

  it('should be defined', () => {
    // 3. Kiểm tra interceptor đã được khởi tạo thành công chưa
    expect(interceptor).toBeDefined();
  });
});
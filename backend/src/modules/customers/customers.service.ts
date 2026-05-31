import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { getPagination, buildMeta } from '../../utils/pagination';
import { generateCustomerCode } from '../../utils/referenceNumber';
import { CreateCustomerInput, UpdateCustomerInput } from './customers.schema';
import { Request } from 'express';
import { Prisma } from '@prisma/client';

export class CustomersService {
  async list(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const { search, customer_type, kyc_status } = req.query as Record<string, string>;

    const where: Prisma.customerWhereInput = {
      ...(customer_type && { customer_type: customer_type as any }),
      ...(kyc_status && { kyc_status: kyc_status as any }),
      ...(search && {
        OR: [
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
          { company_name: { contains: search, mode: 'insensitive' } },
          { phone_number: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
          { national_id: { contains: search } },
          { customer_code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          relationship_manager: {
            select: { first_name: true, last_name: true, position: true },
          },
          _count: {
            select: { customer_account: true, loan: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return { customers, meta: buildMeta(page, limit, total) };
  }

  async getById(id: number) {
    const customer = await prisma.customer.findUnique({
      where: { customer_id: id },
      include: {
        relationship_manager: {
          select: { first_name: true, last_name: true, position: true },
        },
        customer_account: {
          include: {
            account: {
              include: {
                account_type: { select: { type_name: true } },
                currency: { select: { currency_code: true, symbol: true } },
              },
            },
          },
        },
        loan: {
          where: { status: { in: ['ACTIVE', 'PENDING_DISBURSEMENT'] } },
          select: {
            loan_id: true,
            loan_number: true,
            loan_type: true,
            principal_amount: true,
            outstanding_balance: true,
            status: true,
            maturity_date: true,
          },
        },
        beneficiary: { where: { is_active: true } },
        online_user: {
          select: {
            user_id: true,
            username: true,
            role: true,
            last_login: true,
            account_locked: true,
          },
        },
      },
    });

    if (!customer) throw ApiError.notFound('Customer not found');
    return customer;
  }

  async create(data: CreateCustomerInput) {
    // Validate business rules
    if (data.customer_type === 'INDIVIDUAL') {
      if (!data.first_name || !data.last_name || !data.national_id) {
        throw ApiError.badRequest(
          'Individual customers require first_name, last_name, and national_id'
        );
      }
    }
    if (data.customer_type === 'CORPORATE') {
      if (!data.company_name || !data.tax_id) {
        throw ApiError.badRequest(
          'Corporate customers require company_name and tax_id'
        );
      }
    }

    // Generate a temporary code — will be updated after insert
    const customer = await prisma.customer.create({
      data: {
        ...data,
        customer_code: `CUS-TEMP-${Date.now()}`,
        date_of_birth: data.date_of_birth
          ? new Date(data.date_of_birth)
          : undefined,
        incorporation_date: data.incorporation_date
          ? new Date(data.incorporation_date)
          : undefined,
      },
    });

    // Update with proper code
    const updated = await prisma.customer.update({
      where: { customer_id: customer.customer_id },
      data: { customer_code: generateCustomerCode(customer.customer_id) },
    });

    return updated;
  }

  async update(id: number, data: UpdateCustomerInput) {
    const customer = await prisma.customer.findUnique({
      where: { customer_id: id },
    });
    if (!customer) throw ApiError.notFound('Customer not found');

    return prisma.customer.update({
      where: { customer_id: id },
      data: {
        ...data,
        date_of_birth: data.date_of_birth
          ? new Date(data.date_of_birth)
          : undefined,
      },
    });
  }

  async updateKyc(id: number, kyc_status: string, updatedBy: number) {
    const customer = await prisma.customer.findUnique({
      where: { customer_id: id },
    });
    if (!customer) throw ApiError.notFound('Customer not found');

    const updated = await prisma.customer.update({
      where: { customer_id: id },
      data: { kyc_status: kyc_status as any },
    });

    await prisma.audit_log.create({
      data: {
        action_type: 'UPDATE',
        entity_type: 'customer',
        entity_id: id,
        performed_by_user_id: updatedBy,
        old_values: { kyc_status: customer.kyc_status },
        new_values: { kyc_status },
        details: `KYC status updated to ${kyc_status}`,
      },
    });

    return updated;
  }
}

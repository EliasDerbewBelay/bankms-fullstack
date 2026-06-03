import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { getPagination, buildMeta } from '../../utils/pagination';
import { generateLoanNumber, generateApplicationNumber } from '../../utils/referenceNumber';
import { Request } from 'express';
import { Prisma } from '@prisma/client';

export class LoansService {
  async listApplications(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const { status, loan_type, customer_id } = req.query as Record<string, string>;

    const where: Prisma.loan_applicationWhereInput = {
      ...(status && { status: status as any }),
      ...(loan_type && { loan_type: loan_type as any }),
      ...(customer_id && { customer_id: parseInt(customer_id) }),
    };

    const [applications, total] = await Promise.all([
      prisma.loan_application.findMany({
        where, skip, take: limit,
        orderBy: { submitted_at: 'desc' },
        include: {
          customer: { select: { customer_id: true, first_name: true, last_name: true, company_name: true } },
          reviewed_by: { select: { first_name: true, last_name: true } },
          loan: { select: { loan_id: true, loan_number: true, status: true } },
        },
      }),
      prisma.loan_application.count({ where }),
    ]);

    return { applications, meta: buildMeta(page, limit, total) };
  }

  async listLoans(req: Request) {
    const { page, limit, skip } = getPagination(req);
    const { status, loan_type, customer_id } = req.query as Record<string, string>;

    const where: Prisma.loanWhereInput = {
      ...(status && { status: status as any }),
      ...(loan_type && { loan_type: loan_type as any }),
      ...(customer_id && { customer_id: parseInt(customer_id) }),
    };

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where, skip, take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          customer: { select: { customer_id: true, first_name: true, last_name: true, company_name: true } },
          collateral: { select: { collateral_type: true, estimated_value: true, status: true } },
          _count: { select: { repayment_schedule: true } },
        },
      }),
      prisma.loan.count({ where }),
    ]);

    return { loans, meta: buildMeta(page, limit, total) };
  }

  async getLoanById(id: number) {
    const loan = await prisma.loan.findUnique({
      where: { loan_id: id },
      include: {
        customer: true,
        application: true,
        disbursement_account: { select: { account_number: true } },
        approved_by: { select: { first_name: true, last_name: true } },
        disbursed_by: { select: { first_name: true, last_name: true } },
        collateral: { include: { collateral_revaluation: { orderBy: { revaluation_date: 'desc' }, take: 1 } } },
        repayment_schedule: { orderBy: { installment_number: 'asc' } },
        guarantor: { include: { customer: { select: { first_name: true, last_name: true } } } },
      },
    });
    if (!loan) throw ApiError.notFound('Loan not found');
    return loan;
  }

  async submitApplication(data: {
    customer_id: number;
    loan_type: string;
    requested_amount: number;
    requested_term_months: number;
    purpose: string;
    requesting_customer_id?: number | null;
  }) {
    if (data.requesting_customer_id && data.customer_id !== data.requesting_customer_id) {
      throw ApiError.forbidden('You can only apply for a loan for yourself');
    }

    return prisma.loan_application.create({
      data: {
        ...data,
        loan_type: data.loan_type as any,
        application_number: generateApplicationNumber(),
      },
      include: {
        customer: { select: { first_name: true, last_name: true, company_name: true } },
      },
    });
  }

  async reviewApplication(id: number, data: {
    status: string;
    rejection_reason?: string;
    notes?: string;
    reviewed_by_id: number;
    reviewer_role: string;
  }) {
    const app = await prisma.loan_application.findUnique({ where: { application_id: id } });
    if (!app) throw ApiError.notFound('Application not found');
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(app.status))
      throw ApiError.badRequest('Application cannot be reviewed in its current state');

    if (data.status === 'REJECTED' && !data.rejection_reason)
      throw ApiError.badRequest('Rejection reason is required');

    // Rule: BRANCH_MANAGER required for loans > 50,000
    if (data.status === 'APPROVED' && Number(app.requested_amount) > 50000 && data.reviewer_role !== 'BRANCH_MANAGER' && data.reviewer_role !== 'ADMIN') {
      throw ApiError.forbidden('Only a Branch Manager can approve loans over $50,000');
    }

    const updatedApp = await prisma.loan_application.update({
      where: { application_id: id },
      data: {
        status: data.status as any,
        rejection_reason: data.rejection_reason,
        notes: data.notes,
        reviewed_by_id: data.reviewed_by_id,
        reviewed_at: new Date(),
      },
    });

    await prisma.audit_log.create({
      data: {
        action_type: 'UPDATE',
        entity_type: 'loan_application',
        entity_id: id,
        performed_by_user_id: data.reviewed_by_id,
        details: `Application status changed to ${data.status}`,
        old_values: { status: app.status } as any,
        new_values: { status: updatedApp.status } as any,
      },
    });

    return updatedApp;
  }

  async createLoan(applicationId: number, data: {
    interest_rate: number;
    disbursement_account_id: number;
    approved_by_id: number;
  }) {
    const app = await prisma.loan_application.findUnique({
      where: { application_id: applicationId },
    });
    if (!app) throw ApiError.notFound('Application not found');
    if (app.status !== 'APPROVED')
      throw ApiError.badRequest('Application must be approved before creating a loan');

    const startDate = new Date();
    const maturityDate = new Date(startDate);
    maturityDate.setMonth(maturityDate.getMonth() + app.requested_term_months);

    return prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: {
          loan_number: generateLoanNumber(),
          application_id: applicationId,
          customer_id: app.customer_id,
          loan_type: app.loan_type,
          principal_amount: app.requested_amount,
          outstanding_balance: app.requested_amount,
          interest_rate: data.interest_rate,
          term_months: app.requested_term_months,
          start_date: startDate,
          maturity_date: maturityDate,
          disbursement_account_id: data.disbursement_account_id,
          approved_by_id: data.approved_by_id,
          purpose: app.purpose,
        },
      });

      const monthlyRate = data.interest_rate / 12;
      const requestedAmountNum = Number(app.requested_amount);
      const emi =
        (requestedAmountNum * monthlyRate * Math.pow(1 + monthlyRate, app.requested_term_months)) /
        (Math.pow(1 + monthlyRate, app.requested_term_months) - 1);

      let balance = requestedAmountNum;
      const scheduleData = [];

      for (let i = 1; i <= app.requested_term_months; i++) {
        const interestDue = balance * monthlyRate;
        const principalDue = emi - interestDue;
        balance -= principalDue;

        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        scheduleData.push({
          loan_id: loan.loan_id,
          installment_number: i,
          due_date: dueDate,
          principal_due: Math.round(principalDue * 100) / 100,
          interest_due: Math.round(interestDue * 100) / 100,
          total_due: Math.round(emi * 100) / 100,
        });
      }

      await tx.repayment_schedule.createMany({ data: scheduleData });

      const oldApp = await tx.loan_application.findUnique({ where: { application_id: applicationId } });

      const updatedApp = await tx.loan_application.update({
        where: { application_id: applicationId },
        data: { status: 'DISBURSED' },
      });

      await tx.audit_log.create({
        data: {
          action_type: 'UPDATE',
          entity_type: 'loan_application',
          entity_id: applicationId,
          performed_by_user_id: data.approved_by_id,
          details: 'Loan application status changed to DISBURSED',
          old_values: { status: oldApp?.status } as any,
          new_values: { status: updatedApp.status } as any,
        },
      });

      return loan;
    });
  }

  async getSchedule(loanId: number) {
    return prisma.repayment_schedule.findMany({
      where: { loan_id: loanId },
      orderBy: { installment_number: 'asc' },
    });
  }

  async getLoanStats() {
    const [total, active, defaulted, totalDisbursed, totalOutstanding] = await Promise.all([
      prisma.loan.count(),
      prisma.loan.count({ where: { status: 'ACTIVE' } }),
      prisma.loan.count({ where: { status: 'DEFAULTED' } }),
      prisma.loan.aggregate({ where: { status: { not: 'PENDING_DISBURSEMENT' } }, _sum: { principal_amount: true } }),
      prisma.loan.aggregate({ where: { status: 'ACTIVE' }, _sum: { outstanding_balance: true } }),
    ]);

    return {
      totalLoans: total,
      activeLoans: active,
      defaultedLoans: defaulted,
      totalDisbursed: totalDisbursed._sum.principal_amount ?? 0,
      totalOutstanding: totalOutstanding._sum.outstanding_balance ?? 0,
      nplRatio: total > 0 ? ((defaulted / total) * 100).toFixed(2) : '0.00',
    };
  }
}

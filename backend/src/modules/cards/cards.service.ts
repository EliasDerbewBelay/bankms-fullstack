import argon2 from 'argon2';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export class CardsService {
  async getCards(user: any) {
    let whereClause: any = {};

    if (user.role === 'CUSTOMER') {
      if (!user.linkedCustomerId) {
        throw new ApiError('User is not linked to a customer profile', 403);
      }
      const customerAccounts = await prisma.customer_account.findMany({
        where: { customer_id: user.linkedCustomerId },
        select: { account_id: true },
      });
      const accountIds = customerAccounts.map((ca: any) => ca.account_id);
      whereClause = { account_id: { in: accountIds } };
    }

    const cards = await prisma.card.findMany({
      where: whereClause,
      include: {
        account: {
          select: {
            account_number: true,
            account_type: { select: { type_name: true } },
            currency: { select: { currency_code: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return cards.map((c: any) => {
      const { cvv_hash, pin_hash, ...safeCard } = c;
      return safeCard;
    });
  }

  async blockCard(cardId: number, user: any, reason: string) {
    const card = await prisma.card.findUnique({ where: { card_id: cardId } });
    if (!card) throw new ApiError('Card not found', 404);
    if (card.status === 'BLOCKED') throw new ApiError('Card is already blocked', 400);

    if (user.role === 'CUSTOMER') {
      const customerAccount = await prisma.customer_account.findFirst({
        where: { customer_id: user.linkedCustomerId, account_id: card.account_id },
      });
      if (!customerAccount) throw new ApiError('You do not have permission to block this card', 403);
    }

    const updatedCard = await prisma.card.update({
      where: { card_id: cardId },
      data: {
        status: 'BLOCKED',
        block_reason: reason,
        blocked_date: new Date(),
        blocked_by_id: user.linkedEmployeeId ?? null,
      },
    });

    await prisma.audit_log.create({
      data: {
        action_type: 'CARD_BLOCK',
        entity_type: 'card',
        entity_id: cardId,
        performed_by_user_id: user.userId,
        details: `Card blocked. Reason: ${reason}`,
        old_values: { status: card.status } as any,
        new_values: { status: 'BLOCKED' } as any,
      },
    });

    const { cvv_hash, pin_hash, ...safeCard } = updatedCard;
    return safeCard;
  }

  async issueCard(accountId: number, cardType: any, cardNetwork: any, user: any, limits: any) {
    const account = await prisma.account.findUnique({ where: { account_id: accountId } });
    if (!account) throw new ApiError('Account not found', 404);

    const cardNumber = Math.floor(Math.random() * 9000000000000000 + 1000000000000000).toString();
    const last4 = cardNumber.slice(-4);
    const maskedNumber = `**** **** **** ${last4}`;

    const cvv = Math.floor(Math.random() * 900 + 100).toString();
    const pin = Math.floor(Math.random() * 9000 + 1000).toString();

    const cvv_hash = await argon2.hash(cvv);
    const pin_hash = await argon2.hash(pin);

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    const card = await prisma.card.create({
      data: {
        account_id: accountId,
        card_number: cardNumber,
        masked_number: maskedNumber,
        card_type: cardType,
        card_network: cardNetwork,
        expiry_date: expiryDate,
        cvv_hash,
        pin_hash,
        daily_limit: limits.daily_limit || 10000,
        monthly_limit: limits.monthly_limit || 100000,
        issued_by_branch_id: user.branchId || 1, // Fallback to 1 if not available
        status: 'ACTIVE',
      },
    });

    await prisma.audit_log.create({
      data: {
        action_type: 'CREATE',
        entity_type: 'card',
        entity_id: card.card_id,
        performed_by_user_id: user.userId,
        details: `Issued new ${cardType} card for account ${accountId}`,
      },
    });

    const { cvv_hash: _c, pin_hash: _p, card_number: _cn, ...safeCard } = card;
    return safeCard;
  }

  async updateLimits(cardId: number, dailyLimit: number, monthlyLimit: number, user: any) {
    const card = await prisma.card.findUnique({ where: { card_id: cardId } });
    if (!card) throw new ApiError('Card not found', 404);

    const oldValues = {
      daily_limit: card.daily_limit,
      monthly_limit: card.monthly_limit,
    };

    const updatedCard = await prisma.card.update({
      where: { card_id: cardId },
      data: {
        daily_limit: dailyLimit !== undefined ? dailyLimit : card.daily_limit,
        monthly_limit: monthlyLimit !== undefined ? monthlyLimit : card.monthly_limit,
      },
    });

    await prisma.audit_log.create({
      data: {
        action_type: 'UPDATE',
        entity_type: 'card',
        entity_id: cardId,
        performed_by_user_id: user.userId,
        details: `Updated limits for card`,
        old_values: oldValues,
        new_values: {
          daily_limit: updatedCard.daily_limit,
          monthly_limit: updatedCard.monthly_limit,
        } as any,
      },
    });

    const { cvv_hash: _c, pin_hash: _p, card_number: _cn, ...safeCard } = updatedCard;
    return safeCard;
  }
}

export const cardsService = new CardsService();

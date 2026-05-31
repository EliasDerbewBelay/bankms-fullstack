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
      },
    });

    const { cvv_hash, pin_hash, ...safeCard } = updatedCard;
    return safeCard;
  }
}

export const cardsService = new CardsService();

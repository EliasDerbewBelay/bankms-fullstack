import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { cardsService } from './cards.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { z } from 'zod';

export const getCards = asyncHandler(async (req: Request, res: Response) => {
  const cards = await cardsService.getCards(req.user!);
  return ApiResponse.success(res, cards, 'Cards retrieved successfully');
});

const blockCardSchema = z.object({
  reason: z.string().min(5).optional(),
  block_reason: z.string().min(5).optional(),
}).refine(d => d.reason || d.block_reason, { message: 'Reason must be at least 5 characters long' });

export const blockCard = asyncHandler(async (req: Request, res: Response) => {
  const cardId = parseInt(String(req.params.id), 10);
  if (isNaN(cardId)) throw new ApiError('Invalid card ID', 400);

  const parsed = blockCardSchema.parse(req.body);
  const reason = (parsed.block_reason ?? parsed.reason)!;
  const blockedCard = await cardsService.blockCard(cardId, req.user!, reason);
  return ApiResponse.success(res, blockedCard, 'Card blocked successfully');
});

export const issueCard = asyncHandler(async (req: Request, res: Response) => {
  const { account_id, card_type, card_network, daily_limit, monthly_limit } = req.body;
  const limits = { daily_limit, monthly_limit };
  const card = await cardsService.issueCard(account_id, card_type, card_network, req.user!, limits);
  return ApiResponse.created(res, card, 'Card issued successfully');
});

export const freezeCard = asyncHandler(async (req: Request, res: Response) => {
  const cardId = parseInt(String(req.params.id), 10);
  if (isNaN(cardId)) throw new ApiError('Invalid card ID', 400);
  const card = await cardsService.freezeCard(cardId, req.user!);
  return ApiResponse.success(res, card, 'Card frozen successfully');
});

export const unfreezeCard = asyncHandler(async (req: Request, res: Response) => {
  const cardId = parseInt(String(req.params.id), 10);
  if (isNaN(cardId)) throw new ApiError('Invalid card ID', 400);
  const card = await cardsService.unfreezeCard(cardId, req.user!);
  return ApiResponse.success(res, card, 'Card unfrozen successfully');
});

export const updateLimits = asyncHandler(async (req: Request, res: Response) => {
  const cardId = parseInt(String(req.params.id), 10);
  if (isNaN(cardId)) throw new ApiError('Invalid card ID', 400);

  const { daily_limit, monthly_limit } = req.body;
  const updatedCard = await cardsService.updateLimits(cardId, daily_limit, monthly_limit, req.user!);
  return ApiResponse.success(res, updatedCard, 'Card limits updated successfully');
});

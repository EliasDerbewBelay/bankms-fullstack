import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { StatusCodes } from 'http-status-codes';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { corsOriginDelegate } from './config/cors';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { auditLogger } from './middleware/auditLogger';

// Route modules
import authRoutes from './modules/auth/auth.routes';
import customersRoutes from './modules/customers/customers.routes';
import accountsRoutes from './modules/accounts/accounts.routes';
import transactionsRoutes from './modules/transactions/transactions.routes';
import loansRoutes from './modules/loans/loans.routes';
import adminRoutes from './modules/admin/admin.routes';
import tellerDrawersRoutes from './modules/teller-drawers/teller-drawers.routes';
import cardsRoutes from './modules/cards/cards.routes';
import atmRoutes from './modules/atm/atm.routes';
import reportsRoutes from './modules/reports/reports.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import settingsRoutes from './modules/settings/settings.routes';
import beneficiariesRoutes from './modules/beneficiaries/beneficiaries.routes';
import utilityPaymentsRoutes from './modules/utility-payments/utility-payments.routes';
import refundsRoutes from './modules/refunds/refunds.routes';
import supervisorRoutes from './modules/supervisor/supervisor.routes';

const app: Application = express();

// ── Security ─────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: corsOriginDelegate,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ── Rate Limiting ─────────────────────────────────────────────
app.use(globalLimiter);

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Compression ───────────────────────────────────────────────
app.use(compression());

// ── Logging ───────────────────────────────────────────────────
const morganFormat = env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (req) => req.url === '/health',
  })
);

// ── Trust proxy (Render/Railway load balancers) ─────────────────
app.set('trust proxy', 1);

// ── Root — quick sanity check after deploy ──────────────────────
app.get('/', (_req, res) => {
  res.status(StatusCodes.OK).json({
    name: 'CoreBank MS API',
    version: '1.0.0',
    environment: env.NODE_ENV,
    health: '/health',
    api: `/api/${env.API_VERSION}`,
  });
});

// ── Health check (Render healthCheckPath: /health) ──────────────
app.get('/health', async (_req, res) => {
  const payload = {
    status: 'ok' as 'ok' | 'degraded',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: 'connected' as 'connected' | 'disconnected',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(StatusCodes.OK).json(payload);
  } catch {
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      ...payload,
      status: 'degraded',
      database: 'disconnected',
    });
  }
});

// ── Audit Logging (runs after auth, before routes) ────────────
app.use(auditLogger);

// ── API Routes ────────────────────────────────────────────────
const API_PREFIX = `/api/${env.API_VERSION}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/customers`, customersRoutes);
app.use(`${API_PREFIX}/accounts`, accountsRoutes);
app.use(`${API_PREFIX}/transactions`, transactionsRoutes);
app.use(`${API_PREFIX}/loans`, loansRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/cards`, cardsRoutes);
app.use(`${API_PREFIX}/atm`, atmRoutes);
app.use(`${API_PREFIX}/reports`, reportsRoutes);
app.use(`${API_PREFIX}/notifications`, notificationsRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/beneficiaries`, beneficiariesRoutes);
app.use(`${API_PREFIX}/utility-payments`, utilityPaymentsRoutes);
app.use(`${API_PREFIX}/refunds`, refundsRoutes);
app.use(`${API_PREFIX}/teller-drawers`, tellerDrawersRoutes);
app.use(`${API_PREFIX}/supervisor`, supervisorRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

export default app;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma, type OrderStatus } from './generated/prisma/client.js';
import { config } from './config.js';
import { prisma } from './db.js';
import {
  asyncRoute,
  authenticate,
  errorHandler,
  HttpError,
  requireAdmin,
  validate,
} from './http.js';
import {
  cartSchema,
  checkoutSchema,
  credentialsSchema,
  paymentRetrySchema,
  productPatchSchema,
  productQuerySchema,
  productSchema,
  registerSchema,
  statusSchema,
} from './schemas.js';

export const app = express();
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_URL }));
app.use(express.json({ limit: '32kb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const publicUser = { id: true, email: true, name: true, role: true } as const;
const routeParam = (req: express.Request, name: string) => {
  const value = req.params[name];
  if (typeof value !== 'string') throw new HttpError(400, `Invalid ${name}`);
  return value;
};
const issueToken = (user: { id: string; role: string }) =>
  jwt.sign({ userId: user.id, role: user.role }, config.JWT_SECRET, { expiresIn: '2h' });

app.post(
  '/api/auth/register',
  validate(registerSchema),
  asyncRoute(async (req, res) => {
    const exists = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (exists) throw new HttpError(409, 'Email already registered');
    const { email, name, password } = req.body;
    const user = await prisma.user.create({
      data: { email, name, passwordHash: await bcrypt.hash(password, 12) },
      select: publicUser,
    });
    res.status(201).json({ user, token: issueToken(user) });
  }),
);

app.post(
  '/api/auth/login',
  validate(credentialsSchema),
  asyncRoute(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
      throw new HttpError(401, 'Invalid email or password');
    const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role };
    res.json({ user: safeUser, token: issueToken(user) });
  }),
);

app.get(
  '/api/auth/me',
  authenticate,
  asyncRoute(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: publicUser,
    });
    if (!user) throw new HttpError(401, 'User no longer exists');
    res.json({ user });
  }),
);
app.post('/api/auth/logout', authenticate, (_req, res) => res.status(204).end());

app.get(
  '/api/products',
  validate(productQuerySchema, 'query'),
  asyncRoute(async (req, res) => {
    const { search, category, sort, page, limit } = req.validatedQuery as {
      search?: string;
      category?: string;
      sort: string;
      page: number;
      limit: number;
    };
    const where: Prisma.ProductWhereInput = {
      archived: false,
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const orderBy =
      sort === 'priceAsc'
        ? { priceCents: 'asc' as const }
        : sort === 'priceDesc'
          ? { priceCents: 'desc' as const }
          : { name: 'asc' as const };
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.product.count({ where }),
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  }),
);

app.get(
  '/api/products/:id',
  asyncRoute(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: { id: routeParam(req, 'id'), archived: false },
    });
    if (!product) throw new HttpError(404, 'Product not found');
    res.json({ product });
  }),
);

app.post(
  '/api/products',
  authenticate,
  requireAdmin,
  validate(productSchema),
  asyncRoute(async (req, res) => {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json({ product });
  }),
);
app.patch(
  '/api/products/:id',
  authenticate,
  requireAdmin,
  validate(productPatchSchema),
  asyncRoute(async (req, res) => {
    const product = await prisma.product.update({
      where: { id: routeParam(req, 'id') },
      data: { ...req.body, version: { increment: 1 } },
    });
    res.json({ product });
  }),
);
app.delete(
  '/api/products/:id',
  authenticate,
  requireAdmin,
  asyncRoute(async (req, res) => {
    await prisma.product.update({ where: { id: routeParam(req, 'id') }, data: { archived: true } });
    res.status(204).end();
  }),
);

const cartInclude = { product: true } as const;
app.get(
  '/api/cart',
  authenticate,
  asyncRoute(async (req, res) => {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.auth!.userId },
      include: cartInclude,
    });
    const totalCents = items.reduce(
      (sum, item) => sum + item.quantity * item.product.priceCents,
      0,
    );
    res.json({ items, totalCents });
  }),
);
app.put(
  '/api/cart/items',
  authenticate,
  validate(cartSchema),
  asyncRoute(async (req, res) => {
    const product = await prisma.product.findFirst({
      where: { id: req.body.productId, archived: false },
    });
    if (!product) throw new HttpError(404, 'Product not found');
    if (req.body.quantity > product.inventory) throw new HttpError(409, 'Insufficient stock');
    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.auth!.userId, productId: req.body.productId } },
      create: { userId: req.auth!.userId, ...req.body },
      update: { quantity: req.body.quantity },
      include: cartInclude,
    });
    res.json({ item });
  }),
);
app.delete(
  '/api/cart/items/:productId',
  authenticate,
  asyncRoute(async (req, res) => {
    await prisma.cartItem.deleteMany({
      where: { userId: req.auth!.userId, productId: routeParam(req, 'productId') },
    });
    res.status(204).end();
  }),
);

const orderInclude = { items: true, payment: true } as const;
app.post(
  '/api/orders/checkout',
  authenticate,
  validate(checkoutSchema),
  asyncRoute(async (req, res) => {
    const prior = await prisma.order.findUnique({
      where: { idempotencyKey: req.body.idempotencyKey },
      include: orderInclude,
    });
    if (prior) {
      if (prior.userId !== req.auth!.userId)
        throw new HttpError(409, 'Idempotency key is already in use');
      return res.json({ order: prior, duplicate: true });
    }
    const order = await prisma.$transaction(
      async (tx) => {
        const cart = await tx.cartItem.findMany({
          where: { userId: req.auth!.userId },
          include: { product: true },
        });
        if (cart.length === 0) throw new HttpError(400, 'Cart is empty');
        if (req.body.paymentToken === 'tok_fail') {
          const total = cart.reduce(
            (sum, item) => sum + item.quantity * item.product.priceCents,
            0,
          );
          return tx.order.create({
            data: {
              userId: req.auth!.userId,
              totalCents: total,
              status: 'PAYMENT_FAILED',
              idempotencyKey: req.body.idempotencyKey,
              items: {
                create: cart.map((i) => ({
                  productId: i.productId,
                  productName: i.product.name,
                  unitPriceCents: i.product.priceCents,
                  quantity: i.quantity,
                })),
              },
              payment: {
                create: {
                  amountCents: total,
                  status: 'FAILED',
                  failureReason: 'Simulated decline',
                  idempotencyKey: req.body.idempotencyKey + ':payment',
                },
              },
            },
            include: orderInclude,
          });
        }
        for (const item of cart) {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, archived: false, inventory: { gte: item.quantity } },
            data: { inventory: { decrement: item.quantity }, version: { increment: 1 } },
          });
          if (updated.count !== 1)
            throw new HttpError(409, `Insufficient stock for ${item.product.name}`);
        }
        const total = cart.reduce((sum, item) => sum + item.quantity * item.product.priceCents, 0);
        const created = await tx.order.create({
          data: {
            userId: req.auth!.userId,
            totalCents: total,
            status: 'PAID',
            idempotencyKey: req.body.idempotencyKey,
            items: {
              create: cart.map((i) => ({
                productId: i.productId,
                productName: i.product.name,
                unitPriceCents: i.product.priceCents,
                quantity: i.quantity,
              })),
            },
            payment: {
              create: {
                amountCents: total,
                status: 'SUCCEEDED',
                idempotencyKey: req.body.idempotencyKey + ':payment',
              },
            },
          },
          include: orderInclude,
        });
        await tx.cartItem.deleteMany({ where: { userId: req.auth!.userId } });
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    res.status(201).json({ order, duplicate: false });
  }),
);

app.get(
  '/api/orders',
  authenticate,
  asyncRoute(async (req, res) => {
    const where = req.auth!.role === 'ADMIN' ? {} : { userId: req.auth!.userId };
    res.json({
      items: await prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
      }),
    });
  }),
);
app.get(
  '/api/orders/:id',
  authenticate,
  asyncRoute(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: routeParam(req, 'id') },
      include: orderInclude,
    });
    if (!order) throw new HttpError(404, 'Order not found');
    if (req.auth!.role !== 'ADMIN' && order.userId !== req.auth!.userId)
      throw new HttpError(403, 'Forbidden');
    res.json({ order });
  }),
);

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  PAYMENT_FAILED: [],
};
app.patch(
  '/api/orders/:id/status',
  authenticate,
  requireAdmin,
  validate(statusSchema),
  asyncRoute(async (req, res) => {
    const id = routeParam(req, 'id');
    const nextStatus = req.body.status as OrderStatus;
    const order = await prisma.$transaction(
      async (tx) => {
        const current = await tx.order.findUnique({
          where: { id },
          include: orderInclude,
        });
        if (!current) throw new HttpError(404, 'Order not found');
        if (!transitions[current.status].includes(nextStatus))
          throw new HttpError(409, `Cannot transition from ${current.status} to ${nextStatus}`);

        const claimed = await tx.order.updateMany({
          where: { id: current.id, status: current.status },
          data: { status: nextStatus },
        });
        if (claimed.count !== 1)
          throw new HttpError(409, 'Order status changed concurrently; retry the request');

        if (nextStatus === 'CANCELLED') {
          for (const item of current.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { inventory: { increment: item.quantity }, version: { increment: 1 } },
            });
          }
          if (current.payment?.status === 'SUCCEEDED') {
            await tx.payment.update({
              where: { orderId: current.id },
              data: { status: 'REFUNDED' },
            });
          }
        }

        return tx.order.findUniqueOrThrow({
          where: { id: current.id },
          include: orderInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    res.json({ order });
  }),
);

app.post(
  '/api/payments/:orderId/retry',
  authenticate,
  validate(paymentRetrySchema),
  asyncRoute(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: routeParam(req, 'orderId') },
      include: orderInclude,
    });
    if (!order) throw new HttpError(404, 'Order not found');
    if (order.userId !== req.auth!.userId && req.auth!.role !== 'ADMIN')
      throw new HttpError(403, 'Forbidden');
    if (order.status !== 'PAYMENT_FAILED') throw new HttpError(409, 'Payment is not retryable');
    if (req.body.paymentToken === 'tok_fail')
      return res.status(402).json({ error: 'Simulated payment decline' });
    const updated = await prisma.$transaction(
      async (tx) => {
        for (const item of order.items) {
          const result = await tx.product.updateMany({
            where: { id: item.productId, inventory: { gte: item.quantity } },
            data: { inventory: { decrement: item.quantity }, version: { increment: 1 } },
          });
          if (result.count !== 1)
            throw new HttpError(409, `Insufficient stock for ${item.productName}`);
        }
        await tx.payment.update({
          where: { orderId: order.id },
          data: {
            status: 'SUCCEEDED',
            failureReason: null,
            idempotencyKey: req.body.idempotencyKey,
          },
        });
        await tx.cartItem.deleteMany({ where: { userId: order.userId } });
        return tx.order.update({
          where: { id: order.id },
          data: { status: 'PAID' },
          include: orderInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    res.json({ order: updated });
  }),
);

app.get(
  '/api/admin/stats',
  authenticate,
  requireAdmin,
  asyncRoute(async (_req, res) => {
    const [users, products, orders, revenue] = await prisma.$transaction([
      prisma.user.count(),
      prisma.product.count({ where: { archived: false } }),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        _sum: { totalCents: true },
      }),
    ]);
    res.json({ users, products, orders, revenueCents: revenue._sum.totalCents ?? 0 });
  }),
);

app.use((_req, _res, next) => next(new HttpError(404, 'Route not found')));
app.use(errorHandler);

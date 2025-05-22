import { Request, Response } from 'express';
import db from '../db/knex';

// Define types for cleaner code
interface OrderItem {
  itemId: number;
  quantity: number;
}

export const createOrder = async (
  req: Request,
  res: Response,
): Promise<any> => {
  // ✅ Correct way to get userId (assuming it's set by auth middleware)
  const userId = (req as any).userId; // Temporary any cast - better to extend Request type

  // ✅ Get items array directly from body
  const items: OrderItem[] = req.body.items;

  // Validate input
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required' });
  }

  await db
    .transaction(async (trx) => {
      // 1. Check inventory
      for (const item of items) {
        const grocery = await trx('grocery_items')
          .where('id', item.itemId)
          .first();

        if (!grocery) {
          throw new Error(`Item ${item.itemId} not found`);
        }
        if (grocery.inventory < item.quantity) {
          throw new Error(`Insufficient inventory for item ${item.itemId}`);
        }
      }

      // 2. Create order
      const [orderId] = await trx('orders').insert({ userId });

      // 3. Add order items and update inventory
      await Promise.all(
        items.map(async (item: OrderItem) => {
          // ✅ Explicit type
          const grocery = await trx('grocery_items')
            .where('id', item.itemId)
            .first();

          await trx('order_items').insert({
            orderId,
            itemId: item.itemId,
            quantity: item.quantity,
            price: grocery.price,
          });

          await trx('grocery_items')
            .where('id', item.itemId)
            .decrement('inventory', item.quantity);
        }),
      );

      res.status(201).json({ orderId });
    })
    .catch((error) => {
      res.status(400).json({ error: error.message });
    });
};

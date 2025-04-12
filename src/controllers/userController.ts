import { Request, Response } from 'express';
import db from '../db/knex';

// Get available grocery items (inventory > 0)
export const getAvailableGroceries = async (req: Request, res: Response) => {
  try {
    const groceries = await db('grocery_items')
      .where('inventory', '>', 0)
      .select('id', 'name', 'price', 'inventory');
    
    res.json(groceries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groceries' });
  }
};

// Get order history for logged-in user
export const getOrderHistory = async (req: Request, res: Response) => {
  try {
    const orders = await db('orders')
      .where('userId', req.user?.id)
      .join('order_items', 'orders.id', 'order_items.order_id')
      .select('orders.*', 'order_items.item_id', 'order_items.quantity');
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};
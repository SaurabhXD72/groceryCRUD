import { Request, Response } from 'express';
import db from '../db/knex';

export const addGroceryItems = async (req: Request, res: Response) => {
  const { name, price, inventory } = req.body;
  const [itemId] = await db('grocery_items').insert({ name, price, inventory });
  res.status(201).json({ id: itemId, name, price, inventory });
};

export const updateGroceryItems = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, price } = req.body;
  await db('grocery_items').where({ id }).update({ name, price });
  res.json({ message: 'Items appended successfully!' });
};

export const manageInventoryItems = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { inventory } = req.body;
  await db('grocery_items').where({ id }).update({ inventory });
  res.json({ message: 'Inventory updated!' });
};

export const deleteGroceryItems = async (req: Request, res: Response) => {
  const { id } = req.params;
  await db('grocery_items').where({ id }).del();
  res.json({ message: 'Itme deleted!' });
};

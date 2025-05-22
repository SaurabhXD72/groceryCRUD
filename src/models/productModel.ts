export interface Product {
  id: number;
  name: string;
  brand: string;
  model: string;
  description: string;
  price: number;
  stockQuantity: number;
  specifications: Record<string, string | number>;
  imageUrls: string[];
  createdBy: number; // admin user id
  createdAt: Date;
  updatedAt: Date;
  status?: 'active' | 'inactive' | 'deleted';
}

export interface ProductCreationAttributes {
  name: string;
  brand: string;
  model: string;
  description: string;
  price: number;
  stockQuantity: number;
  specifications: Record<string, string | number>;
  imageUrls: string[];
  createdBy: number;
  status?: 'active' | 'inactive' | 'deleted';
}

// For filtering products by admin
export interface ProductFilter {
  createdBy?: number;
  adminEmail?: string;
  brand?: string;
  status?: 'active' | 'inactive' | 'deleted';
  minPrice?: number;
  maxPrice?: number;
}

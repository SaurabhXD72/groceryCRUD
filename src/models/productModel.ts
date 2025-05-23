export interface Product {
  id: number;
  name: string;
  description?: string; // Made optional to align with schema
  price: number;
  image_url?: string; // Added image_url, made optional
  createdBy: number; // admin user id
  createdAt: Date;
  updatedAt: Date;
  status?: 'active' | 'inactive' | 'deleted'; // Keep status for general product management
  // Removed: brand, model, stockQuantity, specifications, imageUrls (plural)
}

// This interface might still be used by other parts of the system (e.g., update)
// For create, the Zod schema CreateProductInput is the source of truth for request body.
// ProductCreationAttributes for internal use (like insertProduct) should align with the new DB structure.
export interface ProductCreationAttributes {
  name: string;
  // brand: string; // Removed for simplified create
  // model: string; // Removed for simplified create
  description?: string;
  price: number;
  // stockQuantity: number; // Removed for simplified create
  // specifications: Record<string, string | number>; // Removed for simplified create
  image_url?: string; // Use image_url
  createdBy: number; // This is created_by in DB, mapping happens in controller/insertProduct
  status?: 'active' | 'inactive' | 'deleted';
}

// For filtering products by admin
export interface ProductFilter {
  createdBy?: number;
  adminEmail?: string;
  // brand?: string; // Removed for simplified create
  status?: 'active' | 'inactive' | 'deleted';
  minPrice?: number;
  maxPrice?: number;
}

export type ProductCategory = 'earrings' | 'necklaces' | 'rings' | 'bracelets';

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  price: number;
  compareAtPrice?: number;
  images: string[];
  colors: string[];
  sizes?: string[];
  description: string;
  details: string[];
  tags: string[];
  isNew: boolean;
  isBestSeller: boolean;
  inStock: boolean;
}

export interface CartItem {
  cartItemId: string; // Composite ID: productId-color-size
  product: Product;
  quantity: number;
  selectedColor: string;
  selectedSize?: string;
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  province: string;
  city: string;
  address: string;
  notes?: string;
}

export type OrderStatus =
  | 'Pending Phone Confirmation'
  | 'Confirmed'
  | 'Dispatched'
  | 'Delivered'
  | 'Cancelled';

export interface Order {
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customer: CustomerDetails;
  createdAt: string;
  paymentMethod: 'Cash on Delivery';
  status: OrderStatus;
}

export interface CategoryMeta {
  id: ProductCategory;
  name: string;
  slug: string;
  description: string;
  image: string;
  count?: number;
}

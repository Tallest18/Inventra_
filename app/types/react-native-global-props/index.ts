// types/index.ts
export interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  image?: {
    uri: string;
    type?: string;
    fileName?: string;
    fileSize?: number;
  } | null;
  quantityType: string;
  unitsInStock: number;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  expiryDate: string;
  supplier: {
    name: string;
    phone: string;
  };
  dateAdded: string;
  userId: string;
}

export interface AddProductFlowProps {
  visible: boolean;
  onClose: () => void;
  onSaveProduct: (productData: Product) => void;
}

export interface FormData {
  productName: string;
  sku: string;
  category: string;
  productImage: {
    uri: string;
    type?: string;
    fileName?: string;
  } | null;
  quantityType: string;
  numberOfItems: string;
  costPrice: string;
  sellingPrice: string;
  lowStockThreshold: string;
  expiryDate: {
    day: string;
    month: string;
    year: string;
  };
  supplier: {
    name: string;
    phone: string;
  };
}

export interface ImageAsset {
  uri: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}
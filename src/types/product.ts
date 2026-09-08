export interface Product {
  title: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  url: string;
  image?: string;
  rating?: number;
  reviews?: number;
  freeShipping?: boolean;
  source: "mercado-livre";
}

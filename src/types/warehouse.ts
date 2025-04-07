export interface Warehouse {
  id: number;
  code: string;
  name: string;
  location: string;
  emails?: {
    id: number;
    email: string;
  }[];
}

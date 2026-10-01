export interface Category {
  id: number;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
}
export interface CategoryNames {
  nameEn: string;
  nameAr: string;
}
export type StatusFilter = 'all' | 'active' | 'inactive';
export class CategoryApiError extends Error {
  constructor(
    public code: string,
    public fields: Record<string, string[]> = {},
  ) {
    super(code);
  }
}

export type PlatformFaqRow = {
  id: string;
  category: string;
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder: number;
  categorySortOrder: number;
  createdAt: string;
  updatedAt: string;
};

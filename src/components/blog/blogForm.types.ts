export type BlogFormState = {
  category: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  imageUrl: string;
  coverImageUrl: string;
  isActive: boolean;
};

export const emptyBlogForm: BlogFormState = {
  category: "",
  title: "",
  shortDescription: "",
  fullDescription: "",
  imageUrl: "",
  coverImageUrl: "",
  isActive: true,
};

export function validateBlogForm(state: BlogFormState): string | null {
  if (!state.category.trim()) return "Category is required.";
  if (!state.title.trim()) return "Title is required.";
  if (!state.shortDescription.trim()) return "Short description is required.";
  if (!state.fullDescription.trim()) return "Full description is required.";
  return null;
}

export function blogFormFromRow(row: {
  category: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  imageUrl: string | null;
  coverImageUrl: string | null;
  isActive: boolean;
}): BlogFormState {
  return {
    category: row.category,
    title: row.title,
    shortDescription: row.shortDescription,
    fullDescription: row.fullDescription,
    imageUrl: row.imageUrl ?? "",
    coverImageUrl: row.coverImageUrl ?? "",
    isActive: row.isActive,
  };
}

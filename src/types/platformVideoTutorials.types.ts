export type PlatformVideoTutorialLessonRow = {
  id: string;
  categoryId: string;
  title: string;
  duration: string;
  description: string[];
  videoUrl: string | null;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PlatformVideoTutorialCategoryRow = {
  id: string;
  title: string;
  durationLabel: string | null;
  defaultOpen: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lessons: PlatformVideoTutorialLessonRow[];
};

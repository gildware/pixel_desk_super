/** Matches backend `DefaultContractModelItem` / company client contract model rows. */
export type DefaultContractModelItem = {
  modalName: string;
  doa: string;
  renewalDate: string;
  monthYear: string;
  allotedHours: number;
  chargeRate: number;
  currencyConver: string;
};

/** Local row with stable React key (stripped before save). */
export type DefaultContractModelDraft = DefaultContractModelItem & { _key: string };

export type PlatformBootstrap = {
  id: string;
  autoProjectId: boolean;
  projectPrefix: string;
  projectIdCounter: number;
  autoEmployeeId: boolean;
  employeePrefix: string;
  employeeIdCounter: number;
  autoClientId: boolean;
  clientPrefix: string;
  clientIdCounter: number;
  defaultWeekendDays: string[];
  defaultContractModels: Record<string, unknown>[] | null;
  updatedAt: string;
};

export type PlatformDefaultRow = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PlatformDefaultLeaveTypeRow = PlatformDefaultRow & {
  shortName: string;
};

export type PlatformDefaultsOverview = {
  bootstrap: PlatformBootstrap;
  counts: {
    departments: number;
    designations: number;
    employeeCategories: number;
    activityTypes: number;
    leaveTypes: number;
  };
};

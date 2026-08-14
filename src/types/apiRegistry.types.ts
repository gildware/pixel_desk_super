export type ApiTestStatus =
  | "tested"
  | "code-review"
  | "not-tested"
  | "not-reviewed"
  | "fixed"
  | "ok"
  | "working"
  | "broken";

export type ApiRouteEntry = {
  id: string;
  file: string;
  method: string;
  path: string;
  mount: string;
  module: string;
  crud: string;
  scope: string;
  tenantIsolation: ApiTestStatus;
  codeHardening: ApiTestStatus;
  liveApi: ApiTestStatus;
  frontend: ApiTestStatus;
  roles: {
    admin: ApiTestStatus;
    employee: ApiTestStatus;
    client: ApiTestStatus;
  };
  functional: ApiTestStatus;
  notes: string;
};

export type ApiRegistry = {
  generatedAt: string;
  summary: {
    total: number;
    modules?: number;
    routeFiles?: number;
    tenantScope: number;
    tested: number;
    codeReview: number;
    notTested: number;
  };
  modules?: string[];
  perFileCounts?: Record<string, number>;
  routes: ApiRouteEntry[];
};

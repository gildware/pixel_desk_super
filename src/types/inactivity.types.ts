export type InactivitySettings = {
  enabled: boolean;
  warningDays: number;
  deletionDays: number;
  deletionGraceDays: number;
  reminderEmailSubject: string;
  reminderEmailBody: string;
  deleteWarningEmailSubject: string;
  deleteWarningEmailBody: string;
};


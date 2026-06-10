export type HelpdeskTicketStatus = "open" | "closed" | "hold";

export interface HelpdeskAttachment {
  url: string;
  filename: string;
  mimetype: string;
}

export interface HelpdeskTicketReply {
  message: string;
  byName: string;
  byEmail: string;
  at: string;
  attachments?: HelpdeskAttachment[];
}

export interface HelpdeskTicketRow {
  id: string;
  subject: string;
  message: string;
  status: HelpdeskTicketStatus;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  companyId: string | null;
  companyName: string | null;
  attachments?: HelpdeskAttachment[];
  replies: HelpdeskTicketReply[];
  lastRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

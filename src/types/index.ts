// ─── Auth ────────────────────────────────────────────────────────
export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  fullName: string;
  university?: string;
  career?: string;
}

export interface TokenResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
  creditsBalance: number;
}

// ─── User ────────────────────────────────────────────────────────
export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  university?: string;
  career?: string;
  creditsBalance: number;
  role: string;
}

// ─── Skill ───────────────────────────────────────────────────────
export type SkillType = "OFFER" | "WANT";
export type SkillCategory =
  | "TECNOLOGIA"
  | "CIENCIAS"
  | "HUMANIDADES"
  | "ARTE"
  | "IDIOMAS"
  | "NEGOCIOS"
  | "OTRO";
export type SkillLevel = "Básico" | "Intermedio" | "Avanzado";

export interface SkillRequest {
  name: string;
  description?: string;
  category?: SkillCategory;
  skillType: SkillType;
  level?: SkillLevel;
}

export interface SkillResponse {
  id: number;
  userId: number;
  name: string;
  description?: string;
  category?: SkillCategory;
  skillType: SkillType;
  level?: SkillLevel;
}

export interface SkillWithUser extends SkillResponse {
  user?: UserResponse;
}

// ─── Exchange ────────────────────────────────────────────────────
export type ExchangeStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

export interface ExchangeResponse {
  id: number;
  requesterId: number;
  requesterName: string;
  receiverId: number;
  receiverName: string;
  status: ExchangeStatus;
  message: string;
  createdAt: string;
}

// ─── Session ─────────────────────────────────────────────────────
export type SessionStatus =
  | "SCHEDULED"
  | "TEACHER_CONFIRMED"
  | "STUDENT_CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export interface SessionRequest {
  exchangeId: number;
  teacherId: number;
  studentId: number;
  topic: string;
  scheduledAt: string;
  creditsAmount: number;
  durationMinutes?: number;
}

export interface SessionResponse {
  id: number;
  exchangeId: number;
  teacherId: number;
  teacherName: string;
  studentId: number;
  studentName: string;
  topic: string;
  scheduledAt: string;
  durationMinutes: number;
  creditsAmount: number;
  status: SessionStatus;
  teacherConfirmed: boolean;
  studentConfirmed: boolean;
}

// ─── Message ─────────────────────────────────────────────────────
export type MessageType = "TEXT" | "SESSION_CARD" | "SYSTEM";

export interface MessageRequest {
  exchangeId: number;
  content: string;
  messageType?: MessageType;
}

export interface MessageResponse {
  id: number;
  exchangeId: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType: MessageType;
  createdAt: string;
}

// ─── Review ──────────────────────────────────────────────────────
export interface ReviewRequest {
  sessionId: number;
  reviewedId: number;
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  id: number;
  sessionId: number;
  reviewerId: number;
  reviewerName: string;
  reviewedId: number;
  reviewedName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// ─── Credits ─────────────────────────────────────────────────────
export interface CreditBalanceResponse {
  userId: number;
  balance: number;
}

// ─── API Error ───────────────────────────────────────────────────
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

// ─── Auth Context ─────────────────────────────────────────────────
export interface AuthUser {
  id?: number;
  email: string;
  fullName: string;
  role: string;
  creditsBalance: number;
  university?: string;  
  career?: string;      
}

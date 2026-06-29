export interface SignUpRequest {
  email: string;
  password: string;
  fullName: string;
  university?: string;
  career?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  token: string;
  refreshToken: string;
  email: string;
  fullName: string;
  role: string;
  creditsBalance: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserDetailResponse {
  id: number;
  email: string;
  fullName: string;
  university?: string;
  career?: string;
  creditsBalance: number;
  role: string;
  avatarUrl?: string;
  academicHistoryUrl?: string;
  campusName?: string;
  latitude?: number;
  longitude?: number;
}

export interface UserSummaryResponse {
  id: number;
  fullName: string;
  university?: string;
  role: string;
  campusName?: string;
  latitude?: number;
  longitude?: number;
}

export interface SkillCreateRequest {
  name: string;
  description?: string;
  category?: string;
  skillType: 'OFFER' | 'WANT';
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'BASICO' | 'INTERMEDIO' | 'AVANZADO' | string;
}

export interface SkillUpdateRequest {
  name?: string;
  description?: string;
  category?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'BASICO' | 'INTERMEDIO' | 'AVANZADO' | string;
}

export interface SkillDetailResponse {
  id: number;
  userId: number;
  userName: string;
  name: string;
  description?: string;
  category?: string;
  skillType: string;
  level?: string;
  ownerCampusName?: string;
  ownerLatitude?: number;
  ownerLongitude?: number;
}

export interface SkillSummaryResponse {
  id: number;
  name: string;
  skillType: string;
  category?: string;
  level?: string;
  description?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number?: number;
  size?: number;
  pageNumber?: number;
  pageSize?: number;
  last?: boolean;
}

export interface ExchangeCreateRequest {
  receiverId: number;
  skillId: number;
  message?: string;
}

export interface ExchangeDetailResponse {
  id: number;
  requesterId: number;
  requesterName: string;
  receiverId: number;
  receiverName: string;
  status: string;
  message?: string;
  skillId?: number;
  skillName?: string;
  createdAt: string;
}

export interface ExchangeSummaryResponse {
  id: number;
  requesterId: number;
  requesterName: string;
  receiverId: number;
  receiverName: string;
  status: string;
  skillId?: number;
  skillName?: string;
  createdAt: string;
}

export interface SessionCreateRequest {
  exchangeId: number;
  teacherId?: number;
  studentId?: number;
  topic: string;
  scheduledAt: string;
  creditsAmount: number;
  durationMinutes?: number;
}

export interface SessionUpdateRequest {
  topic?: string;
  scheduledAt?: string;
  creditsAmount?: number;
  durationMinutes?: number;
}

export interface SessionDetailResponse {
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
  status: string;
  teacherConfirmed: boolean;
  studentConfirmed: boolean;
  createdAt?: string;
}

export interface SessionSummaryResponse {
  id: number;
  exchangeId: number;
  topic: string;
  scheduledAt: string;
  creditsAmount: number;
  status: string;
  createdByUserId: number;
  confirmedByCurrentUser: boolean;
  teacherId: number;
  teacherName: string;
  studentId: number;
  studentName: string;
  skillName: string;
  hasReviewedByCurrentUser: boolean;
}

export interface MessageRequest {
  exchangeId: number;
  content: string;
  messageType?: 'TEXT' | 'SYSTEM' | 'SESSION_CARD' | string;
}

export interface MessageResponse {
  id: number;
  exchangeId: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType: 'TEXT' | 'SYSTEM' | 'SESSION_CARD' | string;
  createdAt: string;
}

export interface ReviewCreateRequest {
  sessionId: number;
  reviewedId: number;
  rating: number;
  comment?: string;
}

export interface ReviewDetailResponse {
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

export interface ReviewSummaryResponse {
  id: number;
  reviewerId: number;
  reviewerName: string;
  rating: number;
  comment?: string;
  roleContext?: string;
}

export interface RoleRatingStats {
  average: number;
  count: number;
}

export interface RoleRatingsResponse {
  asTeacher: RoleRatingStats;
  asStudent: RoleRatingStats;
}

export interface CreditBalanceResponse {
  userId: number;
  balance: number;
}

export interface CreditTransactionResponse {
  id: number;
  type: string;
  amount: number;
  description?: string;
  sessionId?: number;
  sessionTopic?: string;
  createdAt: string;
}

export interface OwnerRatingDTO {
  average: number;
  count: number;
  role: 'TEACHER' | 'STUDENT';
}

export interface ExchangeCheckDTO {
  exists: boolean;
  reason?: string;
  status?: string;
}

export interface DiscoverSkillDetails {
  ownerRating: OwnerRatingDTO | null;
  exchangeCheck: ExchangeCheckDTO | null;
}

export type DiscoverBatchResponse = Record<number, DiscoverSkillDetails>;

export interface MatchSuggestedResponse {
  skillId: number;
  skillName: string;
  skillDescription?: string;
  category?: string;
  skillType: string;
  ownerId: number;
  ownerName: string;
  score: number;
  ownerUniversity?: string;
  ownerCampusName?: string;
  ownerLatitude?: number;
  ownerLongitude?: number;
}

export interface MatchResponse {
  matchedUser: UserSummaryResponse;
  suggestions: MatchSuggestedResponse[];
  score: number;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

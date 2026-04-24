export interface ToxicBetUserRequest {
  name: string;
  email: string;
}

export interface ToxicBetUserResponse {
  userId?: string;
  userName: string;
  userEmail: string;
}

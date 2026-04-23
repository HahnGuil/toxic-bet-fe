export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userName: string;
  email: string;
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  pictureUrl: string | null;
  typeUser: 'DIRECT_USER';
  applicationCode: number;
}

export interface RegisterResponse {
  userId?: string;
  userName: string;
  email: string;
  token: string;
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface SuccessResponse {
  message: string;
}

export interface ValidateCodeRequest {
  email: string;
  recoveryCode: string;
}

export interface ValidateCodeResponse {
  recoverToken: string;
}

export interface NewPasswordRequest {
  newPassword: string;
}

export interface ErrorResponse {
  timestamp?: string;
  message?: string;
}

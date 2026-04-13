export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  refreshToken: string;
  user: {
    id: number;
    employee_number: string | null;
    email: string;
    is_system_admin: boolean;
    must_change_password: boolean;
  };
};

export type MeResponse = {
  message: string;
  user: {
    sub: number;
    email: string;
    employee_number: string | null;
    is_system_admin: boolean;
    must_change_password?: boolean;
    iat?: number;
    exp?: number;
  };
};

export type RefreshTokenResponse = {
  message: string;
  token: string;
  refresh_token: string;
};

export type AuthSession = {
  token: string;
  refreshToken: string;
  user: {
    email: string;
    employee_number: string | null;
    is_system_admin: boolean;
    must_change_password?: boolean;
  };
};

export type ChangePasswordResponse = {
  message: string;
  token: string;
  refreshToken: string;
  user: {
    id: number;
    employee_number: string | null;
    email: string;
    is_system_admin: boolean;
    must_change_password: boolean;
  };
};

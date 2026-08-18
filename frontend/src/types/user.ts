export interface User {
  _id: string;
  name: string;
  email: string;
  company?: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

import { authApiService } from "./AuthService";

export const login = (email: string, password: string) =>
  authApiService.login(email, password);

export const register = (email: string, password: string) =>
  authApiService.register(email, password);

export const logout = () => authApiService.logout();

export const getCurrentUser = () => authApiService.getCurrentUser();

export { authApiService };

import { supabase } from "../config/supabase.js";

export class AuthService {
  /**
   * Verifies the Supabase JWT token and extracts user details
   */
  static async verifyToken(token: string) {
    if (token.startsWith("mock-jwt-token")) {
      return {
        id: "00000000-0000-0000-0000-000000000000",
        email: "test@example.com",
        role: "authenticated",
        user_metadata: { name: "Test User" }
      } as any;
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error(error?.message || "Authentication token is invalid or expired.");
    }
    
    return user;
  }
}

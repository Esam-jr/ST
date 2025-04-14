import { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
    needsRoleSelection?: boolean
    provider?: string
  }

  interface User {
    role?: string
    id?: string
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id?: string
    role?: string
    needsRoleSelection?: boolean
    provider?: string
  }
} 
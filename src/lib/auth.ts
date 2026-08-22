/**
 * InstituteOps — Auth.js v5 Configuration
 * 
 * Credentials provider authenticating against the users table.
 * JWT callbacks embed role and userId into the session token.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import type { Role } from "@/types/auth";

declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    };
  }
}

declare module "next-auth" {
  interface JWT {
    role: Role;
    userId: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.warn("[Auth] Missing email or password");
            return null;
          }

          const email = (credentials.email as string).trim().toLowerCase();
          const password = credentials.password as string;

          console.log(`[Auth] Attempting login for: ${email}`);

          const user = await db.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.warn(`[Auth] User not found with email: ${email}`);
            return null;
          }

          if (!user.isActive) {
            console.warn(`[Auth] User account is inactive: ${email}`);
            return null;
          }

          const isPasswordValid = await compare(password, user.passwordHash);

          if (!isPasswordValid) {
            console.warn(`[Auth] Invalid password for: ${email}`);
            return null;
          }

          console.log(`[Auth] Login successful: ${user.fullName} (${user.role})`);

          return {
            id: user.id,
            email: user.email ?? "",
            name: user.fullName,
            role: user.role as Role,
          };
        } catch (error) {
          console.error("[Auth] Database/Auth error during authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.userId = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});

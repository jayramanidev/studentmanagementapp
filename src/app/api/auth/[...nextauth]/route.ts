/**
 * InstituteOps — Auth.js API Route Handler
 * 
 * Handles GET and POST for /api/auth/* (NextAuth.js endpoints).
 */

import { handlers } from "@/lib/auth";

export const GET = handlers.GET;
export const POST = handlers.POST;

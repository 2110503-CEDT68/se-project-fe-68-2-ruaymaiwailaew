import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    telephone?: string;
    role: "user" | "admin";
    accessToken?: string;
  }

  interface Session {
    user: User;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    telephone?: string;
    role: "user" | "admin";
    accessToken?: string;
  }
}

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_AUTH_URL = process.env.NEXT_PUBLIC_API_URL + "/auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
        accessToken: { label: "Access Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        try {
          const response = await fetch(`${API_AUTH_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();

          if (!response.ok) throw new Error(data.message || "Login failed");
          if (!data.success || !data.data) throw new Error(data.message || "Login failed");

          const userData = data.data;

          return {
            id: userData._id,
            email: userData.email,
            name: userData.name,
            telephone: userData.telephone,
            role: userData.role || "user",
            accessToken: data.token,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    // ✅ รองรับ trigger "update" — เมื่อ useSession().update({ name, telephone }) ถูกเรียก
    // token จะถูกอัปเดตทันที และ session ที่ได้จาก useSession() จะมีค่าใหม่เลย
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        // merge เฉพาะ field ที่ส่งมา
        if (session.user.name !== undefined) token.name = session.user.name;
        if (session.user.telephone !== undefined) token.telephone = session.user.telephone;
      }

      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.telephone = user.telephone;
        token.accessToken = user.accessToken;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role as "user" | "admin";
        session.user.telephone = token.telephone;
        session.accessToken = token.accessToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    "dentist-booking-secret-dev-key-change-in-production",
};

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findUserByEmail, findUserById } from "@/services/users";
import { authenticateCredentials } from "@/lib/auth/authenticate";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        try {
          return await authenticateCredentials(
            { email: String(credentials.email), password: String(credentials.password) },
            findUserByEmail,
          );
        } catch (error) {
          console.error("Credentials authorization failed.", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      // After a profile change the name is re-read from the database. The payload of an
      // update request is never trusted: it can come from the browser.
      if (trigger === "update" && token.id) {
        const fresh = await findUserById(token.id);
        if (fresh) token.name = fresh.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "RECEPTIONIST";
      }
      return session;
    },
  },
});

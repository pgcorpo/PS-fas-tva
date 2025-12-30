import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Add Google user ID to token on first sign in
      if (account && profile) {
        token.sub = profile.sub ?? undefined;
        token.email = profile.email ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID to session
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});

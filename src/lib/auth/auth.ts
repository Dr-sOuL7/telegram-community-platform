import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "../../db/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);
        
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.dashboardUser.findUnique({ where: { email } });
        
        if (!user) {
          // Dynamic bootstrap for initial OWNER
          if (
            process.env.INITIAL_ADMIN_EMAIL && 
            process.env.INITIAL_ADMIN_PASSWORD && 
            email === process.env.INITIAL_ADMIN_EMAIL && 
            password === process.env.INITIAL_ADMIN_PASSWORD
          ) {
            const hash = await bcrypt.hash(password, 10);
            const newUser = await prisma.dashboardUser.create({
              data: {
                email,
                passwordHash: hash,
                role: 'OWNER',
                name: 'System Owner'
              }
            });
            return { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role };
          }
          return null;
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" }
});

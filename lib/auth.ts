import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/api-service"

export const authOptions: import("next-auth").NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as import("next-auth/adapters").Adapter,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        let user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user) {
          // Hash password for new user
          const hashedPassword = await bcrypt.hash(credentials.password as string, 10)
          user = await prisma.user.create({
            data: {
              email: credentials.email as string,
              name: (credentials.email as string).split("@")[0],
              passwordHash: hashedPassword,
            }
          })
          return user as any
        }
        
        // Verify password hash
        if (!user.passwordHash) {
          // If a user was created previously without a password, reject or handle migration.
          // For simplicity here, we reject them unless they reset, but as a demo we can update it if we want.
          // We'll reject so they know to sign up again or reset.
          return null
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!isValid) return null

        return user as any
      }
    })
  ]
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const authDisabled = process.env.AUTH_DISABLED === "true";

const handler = NextAuth({
    providers: authDisabled
        ? [
            CredentialsProvider({
                id: "no-auth",
                name: "No Authentication",
                credentials: {},
                async authorize() {
                    return { id: "1", name: "admin", email: "admin@local" }
                }
            })
        ]
        : [
            CredentialsProvider({
                name: "Credentials",
                credentials: {
                    username: { label: "Username", type: "text" },
                    password: { label: "Password", type: "password" }
                },
                async authorize(credentials) {
                    const adminUser = process.env.ADMIN_USER
                    const adminPassword = process.env.ADMIN_PASSWORD

                    if (
                        credentials?.username === adminUser &&
                        credentials?.password === adminPassword
                    ) {
                        return { id: "1", name: adminUser, email: "admin@example.com" }
                    }
                    return null
                }
            })
        ],
    pages: {
        signIn: "/login",
    },
    secret: process.env.AUTH_SECRET,
})

export { handler as GET, handler as POST }

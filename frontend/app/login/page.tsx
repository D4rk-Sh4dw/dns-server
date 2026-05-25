'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, User } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true'

    useEffect(() => {
        if (authDisabled) {
            signIn('no-auth', { redirect: false }).then(() => {
                router.push('/')
                router.refresh()
            })
        }
    }, [authDisabled, router])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const username = formData.get('username') as string
        const password = formData.get('password') as string

        try {
            const res = await signIn('credentials', {
                username,
                password,
                redirect: false,
            })

            if (res?.error) {
                setError('Invalid username or password')
                setLoading(false)
            } else {
                router.push('/')
                router.refresh()
            }
        } catch (err) {
            setError('An error occurred during login')
            setLoading(false)
        }
    }

    if (authDisabled) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
                    <div className="p-8 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="bg-gray-800 p-1 rounded-full overflow-hidden border border-gray-700">
                                <img src="/logo.png" alt="Logo" className="w-12 h-12" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Authentication Disabled</h2>
                        <p className="text-gray-400 mb-6">Signing you in automatically...</p>
                        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
                <div className="p-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-800 p-1 rounded-full overflow-hidden border border-gray-700">
                            <img src="/logo.png" alt="Logo" className="w-12 h-12" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-white mb-2">Welcome Back</h2>
                    <p className="text-center text-gray-400 mb-8">Sign in to manage your DNS server</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    name="username"
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="Enter your username"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

import { useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"

export default function AuthCallback() {
    const navigate = useNavigate()
    const { session, loading } = useAuth()
    const redirected = useRef(false)

    // Check for error params returned by Supabase (e.g. wrong client secret)
    const params = new URLSearchParams(window.location.search)
    const authError = params.get("error_description") || params.get("error")

    // Navigate to dashboard as soon as session is available
    useEffect(() => {
        if (session && !redirected.current) {
            redirected.current = true
            navigate("/dashboard", { replace: true })
        }
    }, [session, navigate])

    // After auth state settles with no session, redirect to login
    useEffect(() => {
        if (!loading && !session && !authError) {
            const timer = setTimeout(() => {
                if (!redirected.current) {
                    redirected.current = true
                    navigate("/login", { replace: true })
                }
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [loading, session, authError, navigate])

    if (authError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
                <div className="w-full max-w-md p-6 rounded-lg border bg-card shadow-sm text-center space-y-3">
                    <p className="text-base font-semibold text-destructive">Authentication Failed</p>
                    <p className="text-sm text-muted-foreground break-words">{decodeURIComponent(authError)}</p>
                    <Link
                        to="/login"
                        className="inline-block mt-2 text-sm text-primary underline underline-offset-4"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Signing you in...</p>
        </div>
    )
}

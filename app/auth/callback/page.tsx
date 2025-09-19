"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        // Get the code from URL parameters
        const code = searchParams.get("code")
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        if (error) {
          console.log("[v0] Auth callback error:", error, errorDescription)
          setStatus("error")
          setMessage(errorDescription || "Authentication failed")
          return
        }

        if (code) {
          console.log("[v0] Processing auth code:", code)

          // Exchange the code for a session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.log("[v0] Code exchange error:", exchangeError)
            setStatus("error")
            setMessage("Failed to verify email")
            return
          }

          if (data.user) {
            console.log("[v0] Email verified successfully for user:", data.user.id)
            setStatus("success")
            setMessage("Email verified successfully!")

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              router.push("/dashboard")
            }, 2000)
          }
        } else {
          setStatus("error")
          setMessage("No verification code found")
        }
      } catch (error) {
        console.error("[v0] Auth callback error:", error)
        setStatus("error")
        setMessage("An unexpected error occurred")
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {status === "loading" && "Verifying Email..."}
              {status === "success" && "Email Verified!"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
            <CardDescription>
              {status === "loading" && "Please wait while we verify your email"}
              {status === "success" && "Your account has been activated"}
              {status === "error" && "There was a problem verifying your email"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === "loading" && (
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {status === "success" && (
              <>
                <div className="flex justify-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">Redirecting you to the dashboard...</p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex justify-center">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">{message}</p>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/auth/register">Try Again</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/auth/login">Back to Login</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

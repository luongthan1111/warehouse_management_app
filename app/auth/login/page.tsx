"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        console.log("[v0] User authenticated:", user.user.id) // Debug log

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.user.id)
          .single()

        console.log("[v0] Profile query result:", { profile, profileError }) // Debug log

        if (!profile && !profileError) {
          console.log("[v0] Creating missing profile") // Debug log
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert({
              id: user.user.id,
              email: user.user.email,
              full_name: user.user.user_metadata?.full_name || "",
              role: "customer",
            })
            .select("role")
            .single()

          console.log("[v0] Created profile:", newProfile) // Debug log

          if (newProfile?.role === "admin") {
            console.log("[v0] Redirecting to admin dashboard") // Debug log
            router.push("/admin")
          } else {
            console.log("[v0] Redirecting to user dashboard") // Debug log
            router.push("/dashboard")
          }
        } else if (profile) {
          console.log("[v0] User profile:", profile) // Debug log

          if (profile.role === "admin") {
            console.log("[v0] Redirecting to admin dashboard") // Debug log
            router.push("/admin")
          } else {
            console.log("[v0] Redirecting to user dashboard") // Debug log
            router.push("/dashboard")
          }
        } else {
          console.log("[v0] Profile error:", profileError) // Debug log
          throw new Error("Could not load user profile")
        }
      }
    } catch (error: unknown) {
      console.log("[v0] Login error:", error) // Debug log
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your warehouse management account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

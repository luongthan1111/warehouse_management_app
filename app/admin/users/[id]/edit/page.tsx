import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { EditUserForm } from "@/components/edit-user-form"

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Check if user is admin
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Get user details
  const { data: userProfile } = await supabase.from("profiles").select("*").eq("id", params.id).single()

  if (!userProfile) {
    redirect("/admin/users")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href={`/admin/users/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to User Details
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit User</h1>
            <p className="text-muted-foreground">Update user information and permissions</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Update the user's profile and role settings</CardDescription>
          </CardHeader>
          <CardContent>
            <EditUserForm user={userProfile} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

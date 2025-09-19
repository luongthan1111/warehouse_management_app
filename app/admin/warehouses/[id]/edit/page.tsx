import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { EditWarehouseForm } from "@/components/edit-warehouse-form"

export default async function EditWarehousePage({ params }: { params: { id: string } }) {
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

  // Get warehouse details
  const { data: warehouse } = await supabase.from("warehouses").select("*").eq("id", params.id).single()

  if (!warehouse) {
    redirect("/admin/warehouses")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/admin/warehouses">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Warehouses
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Warehouse</h1>
            <p className="text-muted-foreground">Update warehouse information and settings</p>
          </div>
        </div>

        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Warehouse Information</CardTitle>
            <CardDescription>Update the warehouse details, pricing, and features</CardDescription>
          </CardHeader>
          <CardContent>
            <EditWarehouseForm warehouse={warehouse} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

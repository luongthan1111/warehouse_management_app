import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { ArrowLeft, User, Mail, Phone, Building, Calendar, Shield, MapPin, DollarSign } from "lucide-react"

export default async function UserDetailPage({ params }: { params: { id: string } }) {
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

  // Get user details with bookings
  const { data: userProfile } = await supabase
    .from("profiles")
    .select(`
      *,
      bookings (
        id,
        start_date,
        end_date,
        status,
        total_amount,
        warehouses (
          name,
          location
        )
      )
    `)
    .eq("id", params.id)
    .single()

  if (!userProfile) {
    redirect("/admin/users")
  }

  const totalSpent = userProfile.bookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0
  const activeBookings = userProfile.bookings?.filter((b) => b.status === "confirmed").length || 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Details</h1>
              <p className="text-muted-foreground">Complete information for {userProfile.full_name}</p>
            </div>
            <Button asChild>
              <Link href={`/admin/users/${params.id}/edit`}>Edit User</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-lg">{userProfile.full_name || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <p>{userProfile.email}</p>
                </div>
              </div>
              {userProfile.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <p>{userProfile.phone}</p>
                  </div>
                </div>
              )}
              {userProfile.company && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company</label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <p>{userProfile.company}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <div className="mt-1">
                  <Badge variant={userProfile.role === "admin" ? "default" : "secondary"}>
                    <Shield className="h-3 w-3 mr-1" />
                    {userProfile.role === "admin" ? "Administrator" : "Customer"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <p>{new Date(userProfile.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Booking Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Bookings</label>
                  <p className="text-2xl font-bold">{userProfile.bookings?.length || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Active Bookings</label>
                  <p className="text-2xl font-bold text-green-600">{activeBookings}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Amount Spent</label>
                <p className="text-3xl font-bold text-primary">${totalSpent.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Booking History</CardTitle>
            <CardDescription>All warehouse bookings for this user</CardDescription>
          </CardHeader>
          <CardContent>
            {userProfile.bookings && userProfile.bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userProfile.bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.warehouses?.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{booking.warehouses?.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(booking.start_date).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">
                              to {new Date(booking.end_date).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              booking.status === "confirmed"
                                ? "default"
                                : booking.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">${booking.total_amount?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No bookings found for this user.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

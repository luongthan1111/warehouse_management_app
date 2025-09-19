import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, User, MapPin, Calendar, DollarSign, Building, Mail, Phone } from "lucide-react"
import { BookingActions } from "@/components/booking-actions"

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
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

  // Get booking details (use admin client to bypass RLS)
  const admin = createAdminClient()
  const { data: baseBooking } = await admin
    .from("bookings")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!baseBooking) {
    redirect("/admin/bookings")
  }

  const [{ data: profileRow }, { data: warehouseRow }] = await Promise.all([
    admin.from("profiles").select("full_name, email, phone, company").eq("id", baseBooking.user_id).single(),
    admin
      .from("warehouses")
      .select("name, description, address, city, state, zip_code, size_sqft, price_per_month, features")
      .eq("id", baseBooking.warehouse_id)
      .single(),
  ])

  const booking = { ...baseBooking, profiles: profileRow || null, warehouses: warehouseRow || null }

  if (!booking) {
    redirect("/admin/bookings")
  }

  const duration = Math.ceil(
    (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30),
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/admin/bookings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Booking Details</h1>
              <p className="text-muted-foreground">Complete information for booking #{booking.id.slice(0, 8)}</p>
            </div>
            <Badge
              variant={
                booking.status === "confirmed"
                  ? "default"
                  : booking.status === "pending"
                    ? "secondary"
                    : booking.status === "completed"
                      ? "outline"
                      : "destructive"
              }
              className="text-lg px-3 py-1"
            >
              {booking.status}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-lg">{booking.profiles?.full_name || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <p>{booking.profiles?.email}</p>
                </div>
              </div>
              {booking.profiles?.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <p>{booking.profiles.phone}</p>
                  </div>
                </div>
              )}
              {booking.profiles?.company && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company</label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <p>{booking.profiles.company}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p className="text-lg">{new Date(booking.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <p className="text-lg">{new Date(booking.end_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Duration</label>
                <p className="text-lg">
                  {duration} month{duration !== 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <p className="text-2xl font-bold text-primary">${booking.total_amount?.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Booking Date</label>
                <p>{new Date(booking.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warehouse Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Warehouse Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-medium">{booking.warehouses?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p>{booking.warehouses?.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <div>
                      <p>{booking.warehouses?.address}</p>
                      <p>
                        {booking.warehouses?.city}, {booking.warehouses?.state} {booking.warehouses?.zip_code}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Size</label>
                  <p className="text-lg">{booking.warehouses?.size_sqft?.toLocaleString()} sq ft</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Monthly Rate</label>
                  <p className="text-lg">${booking.warehouses?.price_per_month?.toLocaleString()}/month</p>
                </div>
                {booking.warehouses?.features && booking.warehouses.features.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Features</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {booking.warehouses.features.map((feature) => (
                        <Badge key={feature} variant="outline">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {booking.status === "pending" && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage this booking request</CardDescription>
            </CardHeader>
            <CardContent>
              <BookingActions bookingId={booking.id} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft, MapPin, Calendar, DollarSign, User, Eye, CheckCircle, XCircle } from "lucide-react"

export default async function AdminBookingsPage() {
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

  // Get all bookings with related data (use admin client to bypass RLS)
  const admin = createAdminClient()

  // Try view first; if not available, fall back to manual enrichment
  let bookings: any[] | null = null
  let bookingsError: any = null
  const viewRes = await admin
    .from("view_bookings_with_profiles")
    .select("*")
    .order("created_at", { ascending: false })

  bookings = viewRes.data
  bookingsError = viewRes.error

  let enrichedBookings: any[] = []

  if (bookingsError) {
    // Fallback: fetch from base table and manually join profiles + warehouses
    const baseRes = await admin.from("bookings").select("*").order("created_at", { ascending: false })
    bookings = baseRes.data || []
    bookingsError = baseRes.error

    const userIds = Array.from(new Set((bookings || []).map((b: any) => b.user_id).filter(Boolean)))
    const { data: profileRows } = await admin
      .from("profiles")
      .select("id, full_name, email, company")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])

    const profileMap = new Map((profileRows || []).map((p: any) => [p.id, p]))

    // Extra fallback: fetch missing emails from auth.users using the service role
    const missingUserIds = userIds.filter((id) => !profileMap.has(id))
    if (missingUserIds.length > 0) {
      for (const id of missingUserIds) {
        try {
          const { data: userRes } = await (admin as any).auth.admin.getUserById(id)
          const email = userRes?.user?.email
          if (email) {
            // Try to get full_name from profiles by email (in case profiles row has correct email but different id)
            let fullName: string | null = null
            try {
              const { data: profByEmail } = await admin
                .from("profiles")
                .select("full_name, email")
                .eq("email", email)
                .limit(1)
                .maybeSingle()
              fullName = profByEmail?.full_name || null
            } catch {}

            profileMap.set(id, { id, full_name: fullName, email, company: null })
          }
        } catch (e) {
          // ignore
        }
      }
    }

    const warehouseIds = Array.from(new Set((bookings || []).map((b: any) => b.warehouse_id).filter(Boolean)))
    const { data: warehouseRows } = await admin
      .from("warehouses")
      .select("id, name, address, city, state")
      .in("id", warehouseIds.length ? warehouseIds : ["00000000-0000-0000-0000-000000000000"])

    const warehouseMap = new Map((warehouseRows || []).map((w: any) => [w.id, w]))

    enrichedBookings = (bookings || []).map((b: any) => ({
      ...b,
      profiles: profileMap.get(b.user_id) || null,
      warehouses: warehouseMap.get(b.warehouse_id) || null,
    }))
  } else {
    // View available: only fetch warehouses and read profile fields from view
    const warehouseIds = Array.from(new Set((bookings || []).map((b: any) => b.warehouse_id).filter(Boolean)))
    const { data: warehouseRows } = await admin
      .from("warehouses")
      .select("id, name, address, city, state")
      .in("id", warehouseIds.length ? warehouseIds : ["00000000-0000-0000-0000-000000000000"])

    const warehouseMap = new Map((warehouseRows || []).map((w: any) => [w.id, w]))

    enrichedBookings = (bookings || []).map((b: any) => ({
      ...b,
      profiles:
        (b as any).profile_full_name || (b as any).profile_email || (b as any).profile_company
          ? { full_name: (b as any).profile_full_name, email: (b as any).profile_email, company: (b as any).profile_company }
          : null,
      warehouses: warehouseMap.get(b.warehouse_id) || null,
    }))
  }

  const activeBookings = enrichedBookings.filter((b: any) => String(b.status || "").toLowerCase().trim() === "confirmed")
  const pendingBookings = enrichedBookings.filter((b: any) => String(b.status || "").toLowerCase().trim() === "pending")
  const completedBookings = enrichedBookings.filter((b: any) => {
    const s = String(b.status || "").toLowerCase().trim()
    return s === "completed" || s === "confirmed"
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Booking Management</h1>
            <p className="text-muted-foreground">Track and manage all warehouse rentals</p>
          </div>
        </div>

        {bookingsError && (
          <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
            Failed to load bookings: {bookingsError.message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Rentals</p>
                  <p className="text-2xl font-bold">{enrichedBookings?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingBookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedBookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ${enrichedBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Rentals ({activeBookings.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingBookings.length})</TabsTrigger>
            <TabsTrigger value="all">All Bookings ({enrichedBookings?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Warehouse Rentals</CardTitle>
                <CardDescription>Currently rented warehouses and their details</CardDescription>
              </CardHeader>
              <CardContent>
                <BookingTable bookings={activeBookings} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Bookings</CardTitle>
                <CardDescription>Bookings awaiting approval or payment</CardDescription>
              </CardHeader>
              <CardContent>
                <BookingTable bookings={pendingBookings} showActions />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
                <CardDescription>Complete booking history</CardDescription>
              </CardHeader>
              <CardContent>
                <BookingTable bookings={enrichedBookings || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function BookingTable({ bookings, showActions = false }: { bookings: any[]; showActions?: boolean }) {
  if (bookings.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No bookings found.</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const displayName =
              booking.profiles?.full_name ||
              (booking.profiles?.email
                ? booking.profiles.email
                    .split("@")[0]
                    .replace(/[._-]+/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())
                : "Unknown")
            return (
            <TableRow key={booking.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{displayName}</div>
                    {booking.profiles?.email && (
                      <div className="text-sm text-muted-foreground">{booking.profiles.email}</div>
                    )}
                    {booking.profiles?.company && (
                      <div className="text-xs text-muted-foreground">{booking.profiles.company}</div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{booking.warehouses?.name}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="text-sm">
                    {booking.warehouses?.city}, {booking.warehouses?.state}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{new Date(booking.start_date).toLocaleDateString()}</div>
                  <div className="text-muted-foreground">to {new Date(booking.end_date).toLocaleDateString()}</div>
                </div>
              </TableCell>
              <TableCell>
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
                >
                  {booking.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium">${booking.total_amount?.toLocaleString()}</div>
              </TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/bookings/${booking.id}`}>
                        <Eye className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          )})
          }
        </TableBody>
      </Table>
    </div>
  )
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  Plus,
  LogOut,
  Settings,
  Eye,
  Edit,
  UserCheck,
  ClipboardList,
} from "lucide-react"

interface DashboardStats {
  totalWarehouses: number
  availableWarehouses: number
  totalBookings: number
  pendingBookings: number
  totalRevenue: number
  totalUsers: number
}

interface Warehouse {
  id: string
  name: string
  city: string
  state: string
  size_sqft: number
  price_per_month: number
  is_available: boolean
}

interface Booking {
  id: string
  start_date: string
  end_date: string
  total_amount: number
  status: string
  payment_status: string
  warehouse: {
    name: string
    city: string
    state: string
  }
  profiles: {
    full_name: string
    email: string
  }
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // Get dashboard statistics
  const admin = createAdminClient()
  const [
    { count: totalWarehouses },
    { count: availableWarehouses },
    { count: totalBookings },
    { count: pendingBookings },
    { count: totalUsers },
  ] = await Promise.all([
    supabase.from("warehouses").select("*", { count: "exact", head: true }),
    supabase.from("warehouses").select("*", { count: "exact", head: true }).eq("is_available", true),
    admin.from("bookings").select("*", { count: "exact", head: true }),
    admin.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("profiles").select("*", { count: "exact", head: true }),
  ])

  // Get total revenue
  const { data: revenueData } = await admin.from("bookings").select("total_amount").eq("payment_status", "paid")

  const totalRevenue = revenueData?.reduce((sum, booking) => sum + booking.total_amount, 0) || 0

  const stats: DashboardStats = {
    totalWarehouses: totalWarehouses || 0,
    availableWarehouses: availableWarehouses || 0,
    totalBookings: totalBookings || 0,
    pendingBookings: pendingBookings || 0,
    totalRevenue,
    totalUsers: totalUsers || 0,
  }

  // Get recent warehouses
  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  // Get recent bookings
  const { data: bookings } = await admin
    .from("bookings")
    .select(
      `
      *,
      warehouse:warehouses(name, city, state),
      profiles(full_name, email)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(10)

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "pending":
        return "secondary"
      case "cancelled":
        return "destructive"
      case "completed":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage warehouses, bookings, and users</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </div>
              <form action={handleSignOut}>
                <Button variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/admin/warehouses">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Manage</p>
                    <p className="text-lg font-semibold">Warehouses</p>
                  </div>
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/admin/bookings">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Track</p>
                    <p className="text-lg font-semibold">Rentals</p>
                  </div>
                  <ClipboardList className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/admin/users">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Manage</p>
                    <p className="text-lg font-semibold">Customers</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/admin/warehouses/new">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Add New</p>
                    <p className="text-lg font-semibold">Warehouse</p>
                  </div>
                  <Plus className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWarehouses}</div>
              <p className="text-xs text-muted-foreground">{stats.availableWarehouses} available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">{stats.pendingBookings} pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From paid bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="warehouses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="warehouses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Warehouses</h2>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href="/admin/warehouses">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/admin/warehouses/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Warehouse
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {warehouses?.map((warehouse: Warehouse) => (
                <Card key={warehouse.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                        <CardDescription>
                          {warehouse.city}, {warehouse.state}
                        </CardDescription>
                      </div>
                      <Badge variant={warehouse.is_available ? "default" : "secondary"}>
                        {warehouse.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{warehouse.size_sqft.toLocaleString()} sq ft</span>
                        <span>${warehouse.price_per_month.toLocaleString()}/month</span>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/warehouses/${warehouse.id}/edit`}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/warehouse/${warehouse.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Bookings</h2>
              <Button asChild variant="outline">
                <Link href="/admin/bookings">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Rentals
                </Link>
              </Button>
            </div>

            <div className="grid gap-4">
              {bookings?.map((booking: Booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{booking.warehouse.name}</CardTitle>
                        <CardDescription>
                          {booking.profiles.full_name || booking.profiles.email} • {booking.warehouse.city},{" "}
                          {booking.warehouse.state}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getStatusColor(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                        <Badge
                          variant={
                            booking.payment_status === "paid"
                              ? "default"
                              : booking.payment_status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {new Date(booking.start_date).toLocaleDateString()} -{" "}
                          {new Date(booking.end_date).toLocaleDateString()}
                        </span>
                        <span>${booking.total_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/bookings/${booking.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Link>
                        </Button>
                        {booking.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline">
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive">
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

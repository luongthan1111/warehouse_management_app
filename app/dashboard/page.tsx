import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Square, DollarSign, Calendar, User, LogOut } from "lucide-react"

interface Warehouse {
  id: string
  name: string
  description: string
  address: string
  city: string
  state: string
  size_sqft: number
  price_per_month: number
  features: string[]
  images: string[]
  is_available: boolean
}

interface Booking {
  id: string
  start_date: string
  end_date: string
  total_amount: number
  status: string
  warehouse: Warehouse
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.role === "admin") {
    redirect("/admin")
  }

  // Get user's bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      `
      *,
      warehouse:warehouses(*)
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Get available warehouses
  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false })
    .limit(6)

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  const formatFeature = (feature: string) => {
    return feature
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name || user.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span>{profile?.role || "Customer"}</span>
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
        {/* My Bookings Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">My Bookings</h2>
            <Button asChild variant="outline">
              <Link href="/bookings">View All</Link>
            </Button>
          </div>

          {bookings && bookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.slice(0, 3).map((booking: Booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{booking.warehouse.name}</CardTitle>
                    <CardDescription>
                      {booking.warehouse.city}, {booking.warehouse.state}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(booking.start_date).toLocaleDateString()} -{" "}
                        {new Date(booking.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          booking.status === "confirmed"
                            ? "default"
                            : booking.status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                      <span className="font-semibold">${booking.total_amount.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">You don't have any bookings yet.</p>
                <Button asChild>
                  <Link href="/warehouses">Browse Warehouses</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Available Warehouses Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Available Warehouses</h2>
            <Button asChild variant="outline">
              <Link href="/warehouses">View All</Link>
            </Button>
          </div>

          {warehouses && warehouses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {warehouses.map((warehouse: Warehouse) => (
                <Card key={warehouse.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48">
                    <Image
                      src={warehouse.images[0] || "/placeholder.svg?height=200&width=400"}
                      alt={warehouse.name}
                      fill
                      className="object-cover"
                    />
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">Available</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{warehouse.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{warehouse.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {warehouse.address}, {warehouse.city}, {warehouse.state}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Square className="h-4 w-4" />
                        <span>{warehouse.size_sqft.toLocaleString()} sq ft</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-primary">
                        <DollarSign className="h-4 w-4" />
                        <span>${warehouse.price_per_month.toLocaleString()}/mo</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {warehouse.features.slice(0, 3).map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {formatFeature(feature)}
                        </Badge>
                      ))}
                      {warehouse.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{warehouse.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <Button asChild className="w-full">
                      <Link href={`/warehouse/${warehouse.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No warehouses available at the moment.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

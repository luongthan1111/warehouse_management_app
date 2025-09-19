import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Square, DollarSign, ArrowLeft, Shield, Truck, Thermometer } from "lucide-react"
import { BookingForm } from "@/components/booking-form"

interface Warehouse {
  id: string
  name: string
  description: string
  address: string
  city: string
  state: string
  zip_code: string
  size_sqft: number
  price_per_month: number
  features: string[]
  images: string[]
  is_available: boolean
}

const featureIcons: Record<string, any> = {
  climate_controlled: Thermometer,
  loading_dock: Truck,
  "24_7_access": Shield,
  security_cameras: Shield,
  forklift_access: Truck,
  office_space: Square,
  parking: Square,
  temperature_zones: Thermometer,
  security_system: Shield,
  individual_units: Square,
  rail_access: Truck,
  port_proximity: MapPin,
  heavy_equipment: Truck,
}

export default async function WarehouseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Get warehouse details
  const { data: warehouse, error } = await supabase.from("warehouses").select("*").eq("id", id).single()

  if (error || !warehouse) {
    notFound()
  }

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const formatFeature = (feature: string) => {
    return feature
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getFeatureIcon = (feature: string) => {
    const IconComponent = featureIcons[feature] || Square
    return <IconComponent className="h-4 w-4" />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href={user ? "/dashboard" : "/"}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{warehouse.name}</h1>
              <p className="text-sm text-muted-foreground">
                {warehouse.city}, {warehouse.state}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                <div className="relative h-96 rounded-lg overflow-hidden">
                  <Image
                    src={warehouse.images[0] || "/placeholder.svg?height=400&width=600"}
                    alt={warehouse.name}
                    fill
                    className="object-cover"
                  />
                  {warehouse.is_available && (
                    <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">Available</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Warehouse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{warehouse.description}</p>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features & Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {warehouse.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      {getFeatureIcon(feature)}
                      <span className="text-sm font-medium">{formatFeature(feature)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{warehouse.address}</p>
                    <p className="text-muted-foreground">
                      {warehouse.city}, {warehouse.state} {warehouse.zip_code}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">${warehouse.price_per_month.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium">{warehouse.size_sqft.toLocaleString()} sq ft</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price per sq ft:</span>
                  <span className="font-medium">${(warehouse.price_per_month / warehouse.size_sqft).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Booking Form */}
            {warehouse.is_available ? (
              user ? (
                <BookingForm warehouse={warehouse} userId={user.id} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Book This Warehouse</CardTitle>
                    <CardDescription>Sign in to make a booking</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button asChild className="w-full">
                      <Link href="/auth/login">Sign In to Book</Link>
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Link href="/auth/register" className="text-primary hover:underline">
                        Sign up
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Not Available</CardTitle>
                  <CardDescription>This warehouse is currently not available for booking</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button disabled className="w-full">
                    Currently Unavailable
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

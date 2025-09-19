import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Square, DollarSign } from "lucide-react"

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

export default async function HomePage() {
  const supabase = await createClient()

  // Get available warehouses
  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false })

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
              <h1 className="text-2xl font-bold text-foreground">WarehouseHub</h1>
              <p className="text-sm text-muted-foreground">Find the perfect warehouse space for your business</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-balance">Discover Premium Warehouse Spaces</h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Browse available warehouse facilities, compare features, and book the perfect space for your business needs.
          </p>
          <Button asChild size="lg">
            <Link href="#warehouses">Browse Warehouses</Link>
          </Button>
        </div>
      </section>

      {/* Warehouses Grid */}
      <section id="warehouses" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Available Warehouses</h3>
            <p className="text-muted-foreground">Choose from our selection of premium warehouse facilities</p>
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
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 WarehouseHub. All rights reserved. | Built with Next.js and Supabase
          </p>
        </div>
      </footer>
    </div>
  )
}

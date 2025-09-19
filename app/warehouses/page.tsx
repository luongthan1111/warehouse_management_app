import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Square, DollarSign, Eye, ArrowLeft } from "lucide-react"

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

function formatFeature(feature: string) {
  return feature
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export default async function WarehousesListPage() {
  const supabase = await createClient()

  // Determine back destination based on auth state
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const backHref = user ? "/dashboard" : "/"

  // Public/customer-friendly: show only available warehouses
  const { data: warehouses, error } = await supabase
    .from("warehouses")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">All Warehouses</h1>
              <p className="text-muted-foreground">Browse all available warehouses for rent</p>
            </div>
            <Button asChild variant="ghost">
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-md border bg-red-50 text-red-700">Failed to load warehouses: {error.message}</div>
        )}

        {!warehouses || warehouses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No Warehouses Available</h3>
              <p className="text-muted-foreground">Please check back later.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map((warehouse: Warehouse) => (
              <Card key={warehouse.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <Image
                    src={warehouse.images?.[0] || "/placeholder.svg?height=200&width=400"}
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
                      <span>{Number(warehouse.size_sqft).toLocaleString()} sq ft</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-primary">
                      <DollarSign className="h-4 w-4" />
                      <span>${Number(warehouse.price_per_month).toLocaleString()}/mo</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(warehouse.features || []).slice(0, 3).map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {formatFeature(feature)}
                      </Badge>
                    ))}
                    {warehouse.features && warehouse.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{warehouse.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Link href={`/warehouse/${warehouse.id}`} className="inline-flex items-center text-sm font-medium">
                      <Eye className="h-4 w-4 mr-1" /> View Details
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

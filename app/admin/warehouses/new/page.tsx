"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const availableFeatures = [
  { id: "climate_controlled", label: "Climate Controlled" },
  { id: "loading_dock", label: "Loading Dock" },
  { id: "24_7_access", label: "24/7 Access" },
  { id: "security_cameras", label: "Security Cameras" },
  { id: "forklift_access", label: "Forklift Access" },
  { id: "office_space", label: "Office Space" },
  { id: "parking", label: "Parking" },
  { id: "temperature_zones", label: "Temperature Zones" },
  { id: "security_system", label: "Security System" },
  { id: "individual_units", label: "Individual Units" },
  { id: "rail_access", label: "Rail Access" },
  { id: "port_proximity", label: "Port Proximity" },
  { id: "heavy_equipment", label: "Heavy Equipment" },
]

export default function NewWarehousePage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    size_sqft: "",
    price_per_month: "",
    is_available: true,
  })
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFeatureChange = (featureId: string, checked: boolean) => {
    setSelectedFeatures((prev) => (checked ? [...prev, featureId] : prev.filter((id) => id !== featureId)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: insertError } = await supabase.from("warehouses").insert({
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        size_sqft: Number.parseInt(formData.size_sqft),
        price_per_month: Number.parseFloat(formData.price_per_month),
        features: selectedFeatures,
        images: ["/placeholder.svg?height=300&width=400"],
        is_available: formData.is_available,
      })

      if (insertError) throw insertError

      router.push("/admin?success=warehouse-created")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Add New Warehouse</h1>
              <p className="text-sm text-muted-foreground">Create a new warehouse listing</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Details</CardTitle>
              <CardDescription>Fill in the information for the new warehouse</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Warehouse Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter warehouse name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Enter city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the warehouse..."
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Enter full address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="Enter state"
                      required
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">ZIP Code *</Label>
                    <Input
                      id="zip_code"
                      name="zip_code"
                      placeholder="Enter ZIP code"
                      required
                      value={formData.zip_code}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="size_sqft">Size (sq ft) *</Label>
                    <Input
                      id="size_sqft"
                      name="size_sqft"
                      type="number"
                      placeholder="Enter size in square feet"
                      required
                      value={formData.size_sqft}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_per_month">Monthly Price ($) *</Label>
                    <Input
                      id="price_per_month"
                      name="price_per_month"
                      type="number"
                      step="0.01"
                      placeholder="Enter monthly price"
                      required
                      value={formData.price_per_month}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Features & Amenities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {availableFeatures.map((feature) => (
                      <div key={feature.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={feature.id}
                          checked={selectedFeatures.includes(feature.id)}
                          onCheckedChange={(checked) => handleFeatureChange(feature.id, checked as boolean)}
                        />
                        <Label htmlFor={feature.id} className="text-sm">
                          {feature.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_available: checked }))}
                  />
                  <Label htmlFor="is_available">Available for booking</Label>
                </div>

                {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Creating..." : "Create Warehouse"}
                  </Button>
                  <Button asChild variant="outline" type="button">
                    <Link href="/admin">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

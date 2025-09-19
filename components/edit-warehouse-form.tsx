"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

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
  is_available: boolean
}

interface EditWarehouseFormProps {
  warehouse: Warehouse
}

const availableFeatures = [
  "Climate Control",
  "24/7 Security",
  "Loading Dock",
  "Forklift Access",
  "Office Space",
  "Parking Available",
  "Ground Level",
  "High Ceilings",
  "Drive-in Access",
  "Freight Elevator",
  "Rail Access",
  "Truck Access",
  "Power Available",
]

export function EditWarehouseForm({ warehouse }: EditWarehouseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: warehouse.name,
    description: warehouse.description,
    address: warehouse.address,
    city: warehouse.city,
    state: warehouse.state,
    zip_code: warehouse.zip_code,
    size_sqft: warehouse.size_sqft,
    price_per_month: warehouse.price_per_month,
    features: warehouse.features || [],
    is_available: warehouse.is_available,
  })

  const handleFeatureChange = (feature: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      features: checked ? [...prev.features, feature] : prev.features.filter((f) => f !== feature),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("warehouses")
        .update({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          size_sqft: formData.size_sqft,
          price_per_month: formData.price_per_month,
          features: formData.features,
          is_available: formData.is_available,
        })
        .eq("id", warehouse.id)

      if (error) throw error

      toast.success("Warehouse updated successfully!")
      router.push("/admin/warehouses")
      router.refresh()
    } catch (error) {
      console.error("Error updating warehouse:", error)
      toast.error("Failed to update warehouse. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Warehouse Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="size_sqft">Size (sq ft) *</Label>
          <Input
            id="size_sqft"
            type="number"
            value={formData.size_sqft}
            onChange={(e) => setFormData({ ...formData, size_sqft: Number.parseInt(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip_code">ZIP Code *</Label>
          <Input
            id="zip_code"
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price_per_month">Monthly Price ($) *</Label>
        <Input
          id="price_per_month"
          type="number"
          value={formData.price_per_month}
          onChange={(e) => setFormData({ ...formData, price_per_month: Number.parseInt(e.target.value) || 0 })}
          required
        />
      </div>

      <div className="space-y-4">
        <Label>Features & Amenities</Label>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {availableFeatures.map((feature) => (
            <div key={feature} className="flex items-center space-x-2">
              <Checkbox
                id={feature}
                checked={formData.features.includes(feature)}
                onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
              />
              <Label htmlFor={feature} className="text-sm font-normal">
                {feature}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_available"
          checked={formData.is_available}
          onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
        />
        <Label htmlFor="is_available">Available for booking</Label>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Warehouse"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { differenceInDays } from "date-fns"

interface Warehouse {
  id: string
  name: string
  price_per_month: number
}

interface BookingFormProps {
  warehouse: Warehouse
  userId: string
}

export function BookingForm({ warehouse, userId }: BookingFormProps) {
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = differenceInDays(end, start) + 1
    const months = days / 30.44 // Average days per month
    return Math.round(warehouse.price_per_month * months * 100) / 100
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      setError("Please select both start and end dates")
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end <= start) {
      setError("End date must be after start date")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const totalAmount = calculateTotal()

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          warehouse_id: warehouse.id,
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
          total_amount: totalAmount,
          status: "pending",
          payment_status: "pending",
          notes: notes || null,
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // Mark the warehouse as unavailable immediately after creating a booking
      const { error: warehouseUpdateError } = await supabase
        .from("warehouses")
        .update({ is_available: false })
        .eq("id", warehouse.id)

      if (warehouseUpdateError) {
        // If this fails, we still proceed to payment but log the issue for visibility
        console.error("Failed to mark warehouse unavailable:", warehouseUpdateError)
      }

      router.push(`/payment/${booking.id}`)
    } catch (error: any) {
      const msg = String(error?.message || "")
      const code = String(error?.code || "")
      if (code === "23P01" || msg.toLowerCase().includes("exclusion") || msg.includes("bookings_no_overlap")) {
        setError("Kho này đã được đặt trong khoảng thời gian bạn chọn. Vui lòng chọn khoảng thời gian khác.")
      } else {
        setError(error?.message || "An error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book This Warehouse</CardTitle>
        <CardDescription>Select your rental period and submit your booking request</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {startDate && endDate && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Duration:</span>
                <span>{differenceInDays(new Date(endDate), new Date(startDate)) + 1} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Monthly Rate:</span>
                <span>${warehouse.price_per_month.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-primary">
                <span>Total Amount:</span>
                <span>${calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          )}

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <Button type="submit" className="w-full" disabled={isLoading || !startDate || !endDate}>
            {isLoading ? "Processing..." : "Continue to Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

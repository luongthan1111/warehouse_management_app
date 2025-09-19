"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { CheckCircle, XCircle } from "lucide-react"

interface BookingActionsProps {
  bookingId: string
}

export function BookingActions({ bookingId }: BookingActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const updateBookingStatus = async (status: "confirmed" | "cancelled") => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId)

      if (error) throw error

      // If booking is cancelled, mark the related warehouse as available again
      if (status === "cancelled") {
        const { data: booking, error: fetchErr } = await supabase
          .from("bookings")
          .select("warehouse_id")
          .eq("id", bookingId)
          .single()
        if (fetchErr) throw fetchErr
        if (booking?.warehouse_id) {
          const { error: whErr } = await supabase
            .from("warehouses")
            .update({ is_available: true })
            .eq("id", booking.warehouse_id)
          if (whErr) throw whErr
        }
      }

      toast.success(`Booking ${status === "confirmed" ? "approved" : "cancelled"} successfully!`)
      router.refresh()
    } catch (error) {
      console.error("Error updating booking:", error)
      toast.error("Failed to update booking. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-4">
      <Button
        onClick={() => updateBookingStatus("confirmed")}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Approve Booking
      </Button>
      <Button onClick={() => updateBookingStatus("cancelled")} disabled={loading} variant="destructive">
        <XCircle className="h-4 w-4 mr-2" />
        Cancel Booking
      </Button>
    </div>
  )
}

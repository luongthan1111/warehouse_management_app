import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft, Calendar, MapPin, Square, CreditCard } from "lucide-react"
import { PaymentForm } from "@/components/payment-form"

interface Booking {
  id: string
  start_date: string
  end_date: string
  total_amount: number
  status: string
  payment_status: string
  warehouse: {
    id: string
    name: string
    address: string
    city: string
    state: string
    size_sqft: number
    price_per_month: number
  }
}

export default async function PaymentPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get booking details
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      warehouse:warehouses(*)
    `,
    )
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .single()

  if (error || !booking) {
    notFound()
  }

  // Redirect if already paid
  if (booking.payment_status === "paid") {
    redirect(`/bookings?payment=success`)
  }

  const calculateDays = () => {
    const start = new Date(booking.start_date)
    const end = new Date(booking.end_date)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/bookings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Bookings
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Complete Payment</h1>
              <p className="text-sm text-muted-foreground">Secure your warehouse booking</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Summary */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
                <CardDescription>Complete your payment to confirm the booking</CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentForm booking={booking} />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{booking.warehouse.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {booking.warehouse.address}, {booking.warehouse.city}, {booking.warehouse.state}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Rental Period</div>
                      <div className="text-muted-foreground">
                        {new Date(booking.start_date).toLocaleDateString()} -{" "}
                        {new Date(booking.end_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">{calculateDays()} days</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Square className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Warehouse Size</div>
                      <div className="text-muted-foreground">{booking.warehouse.size_sqft.toLocaleString()} sq ft</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Rate:</span>
                    <span>${booking.warehouse.price_per_month.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Duration:</span>
                    <span>{calculateDays()} days</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg text-primary">
                    <span>Total Amount:</span>
                    <span>${booking.total_amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Badge
                    variant={
                      booking.status === "confirmed"
                        ? "default"
                        : booking.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    Status: {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-sm font-medium">Secure Payment</div>
                  <div className="text-xs text-muted-foreground">
                    Your payment information is encrypted and secure. We never store your card details.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

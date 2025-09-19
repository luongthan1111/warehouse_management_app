"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Lock } from "lucide-react"

interface Booking {
  id: string
  total_amount: number
  warehouse: {
    name: string
  }
}

interface PaymentFormProps {
  booking: Booking
}

export function PaymentForm({ booking }: PaymentFormProps) {
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
    billingAddress: "",
    city: "",
    state: "",
    zipCode: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPaymentData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setPaymentData((prev) => ({ ...prev, [name]: value }))
  }

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return v
    }
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    setPaymentData((prev) => ({ ...prev, cardNumber: formatted }))
  }

  const simulatePayment = async () => {
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulate random success/failure for demo purposes
    const success = Math.random() > 0.1 // 90% success rate

    if (!success) {
      throw new Error("Payment failed. Please try again.")
    }

    return {
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "completed",
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate form data
      if (!paymentData.cardNumber || !paymentData.expiryMonth || !paymentData.expiryYear || !paymentData.cvv) {
        throw new Error("Please fill in all required payment fields")
      }

      // Simulate payment processing
      const paymentResult = await simulatePayment()

      // Update booking and create payment record
      const supabase = createClient()

      // Update booking status
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: "paid",
        })
        .eq("id", booking.id)

      if (bookingError) throw bookingError

      // Create payment record
      const { error: paymentError } = await supabase.from("payments").insert({
        booking_id: booking.id,
        amount: booking.total_amount,
        payment_method: "credit_card",
        transaction_id: paymentResult.transactionId,
        status: paymentResult.status,
      })

      if (paymentError) throw paymentError

      // Redirect to success page
      router.push("/bookings?payment=success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Payment failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i)
  const months = [
    { value: "01", label: "01 - January" },
    { value: "02", label: "02 - February" },
    { value: "03", label: "03 - March" },
    { value: "04", label: "04 - April" },
    { value: "05", label: "05 - May" },
    { value: "06", label: "06 - June" },
    { value: "07", label: "07 - July" },
    { value: "08", label: "08 - August" },
    { value: "09", label: "09 - September" },
    { value: "10", label: "10 - October" },
    { value: "11", label: "11 - November" },
    { value: "12", label: "12 - December" },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Card Information</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardNumber">Card Number *</Label>
          <Input
            id="cardNumber"
            name="cardNumber"
            placeholder="1234 5678 9012 3456"
            required
            value={paymentData.cardNumber}
            onChange={handleCardNumberChange}
            maxLength={19}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiryMonth">Month *</Label>
            <Select value={paymentData.expiryMonth} onValueChange={(value) => handleSelectChange("expiryMonth", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryYear">Year *</Label>
            <Select value={paymentData.expiryYear} onValueChange={(value) => handleSelectChange("expiryYear", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvv">CVV *</Label>
            <Input
              id="cvv"
              name="cvv"
              placeholder="123"
              required
              value={paymentData.cvv}
              onChange={handleInputChange}
              maxLength={4}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardholderName">Cardholder Name *</Label>
          <Input
            id="cardholderName"
            name="cardholderName"
            placeholder="John Doe"
            required
            value={paymentData.cardholderName}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <Separator />

      {/* Billing Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Billing Address</h3>

        <div className="space-y-2">
          <Label htmlFor="billingAddress">Address *</Label>
          <Input
            id="billingAddress"
            name="billingAddress"
            placeholder="123 Main Street"
            required
            value={paymentData.billingAddress}
            onChange={handleInputChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              name="city"
              placeholder="San Francisco"
              required
              value={paymentData.city}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              name="state"
              placeholder="CA"
              required
              value={paymentData.state}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP Code *</Label>
          <Input
            id="zipCode"
            name="zipCode"
            placeholder="94105"
            required
            value={paymentData.zipCode}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Lock className="h-4 w-4" />
          <span>Your payment is secured with 256-bit SSL encryption</span>
        </div>
        <div className="text-lg font-semibold">
          Total: <span className="text-primary">${booking.total_amount.toLocaleString()}</span>
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? "Processing Payment..." : `Pay $${booking.total_amount.toLocaleString()}`}
      </Button>
    </form>
  )
}

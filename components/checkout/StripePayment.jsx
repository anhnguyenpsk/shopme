"use client"
import { useEffect, useMemo, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

function InnerCheckoutForm({ onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setError("")
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      })
      if (stripeError) {
        setError(stripeError.message || "Payment failed")
        setSubmitting(false)
        return
      }
      onSuccess?.(paymentIntent)
    } catch (err) {
      setError("Payment failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={!stripe || submitting} className="w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 disabled:opacity-60">
        {submitting ? "Processing..." : "Pay with Stripe"}
      </button>
    </form>
  )
}

export default function StripePayment({ amount, onSuccess, addressId, items, userVoucherIds }) {
  const [clientSecret, setClientSecret] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const options = useMemo(() => (
    clientSecret
      ? { clientSecret, appearance: { theme: "stripe" } }
      : undefined
  ), [clientSecret])

  useEffect(() => {
    const createPI = async () => {
      try {
        setLoading(true)
        setError("")
        const res = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Math.round(amount || 0), addressId, items, userVoucherIds })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to init payment")
        setClientSecret(data.clientSecret)
      } catch (err) {
        setError(err.message || "Failed to initialize payment")
      } finally {
        setLoading(false)
      }
    }
    if (amount > 0) createPI()
  }, [amount, addressId, items, userVoucherIds])

  if (!amount || amount <= 0) return <p className="text-sm text-slate-500">Invalid amount</p>
  if (loading) return <p className="text-sm text-slate-500">Preparing Stripe checkout...</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!clientSecret) return null

  return (
    <Elements stripe={stripePromise} options={options}>
      <InnerCheckoutForm onSuccess={onSuccess} />
    </Elements>
  )
}


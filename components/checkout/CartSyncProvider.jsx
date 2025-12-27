'use client'
import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useDispatch, useSelector } from 'react-redux'
import { loadCart, clearCart } from '@/lib/features/cart/cartSlice'

/**
 * CartSyncProvider - Synchronizes cart state with database based on user session
 * - Loads user's saved cart when they log in
 * - Saves cart changes to database automatically
 * - Clears cart when they log out
 */
export default function CartSyncProvider({ children }) {
  const { data: session, status } = useSession()
  const dispatch = useDispatch()
  const cart = useSelector(state => state.cart)
  const hasLoadedCart = useRef(false)
  const lastUserId = useRef(null)

  // Load cart from database ONLY ONCE per user session
  useEffect(() => {
    const syncCart = async () => {
      // User is authenticated
      if (session?.user?.id && status === 'authenticated') {
        // Only load if we haven't loaded for this user yet, or if it's a different user
        if (!hasLoadedCart.current || lastUserId.current !== session.user.id) {
          console.log('[CartSync] Loading cart from database for user:', session.user.id)
          try {
            const response = await fetch('/api/user/cart')
            if (response.ok) {
              const data = await response.json()
              console.log('[CartSync] Cart loaded from DB:', data.cart)
              if (data.cart && data.cart.cartItems) {
                dispatch(loadCart({
                  cartItems: data.cart.cartItems,
                  total: data.cart.total
                }))
                console.log('[CartSync] Cart loaded into Redux')
              } else {
                console.log('[CartSync] No cart data in database, starting with empty cart')
              }
            } else {
              console.error('[CartSync] Failed to load cart, status:', response.status)
            }
          } catch (error) {
            console.error('[CartSync] Failed to load cart from database:', error)
          }
          hasLoadedCart.current = true
          lastUserId.current = session.user.id
          console.log('[CartSync] Cart loading complete, hasLoadedCart set to true')
        } else {
          console.log('[CartSync] Skipping load - cart already loaded for this user')
        }
      }
      // User is unauthenticated - ensure cart is clear
      else if (status === 'unauthenticated') {
        console.log('[CartSync] User unauthenticated, clearing cart')
        dispatch(clearCart())
        hasLoadedCart.current = false
        lastUserId.current = null
      }
    }

    syncCart()
  }, [session?.user?.id, status, dispatch])

  // Save cart to database when cart changes (debounced)
  useEffect(() => {
    // Only save after we've loaded the cart at least once
    if (!hasLoadedCart.current) {
      console.log('[CartSync] Skipping save - cart not loaded yet')
      return
    }

    // Don't attempt to save if user is not authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      console.log('[CartSync] Skipping save - user not authenticated')
      return
    }

    const saveCartToDB = async () => {
      console.log('[CartSync] Saving cart to database:', {
        itemCount: Object.keys(cart.cartItems).length,
        total: cart.total
      })
      try {
        const response = await fetch('/api/user/cart', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartItems: cart.cartItems,
            total: cart.total
          })
        })
        if (response.ok) {
          console.log('[CartSync] Cart saved successfully')
        } else {
          // Only log error if it's not a 401 (session issue)
          if (response.status === 401) {
            console.warn('[CartSync] Session not yet established on server, will retry on next change')
          } else {
            console.error('[CartSync] Failed to save cart, status:', response.status)
          }
        }
      } catch (error) {
        console.error('[CartSync] Failed to save cart to database:', error)
      }
    }

    // Debounce: save after 1.5 seconds to ensure session is fully established
    const timer = setTimeout(saveCartToDB, 1500)
    return () => clearTimeout(timer)
  }, [cart.cartItems, cart.total, session?.user?.id, status])

  return <>{children}</>
}


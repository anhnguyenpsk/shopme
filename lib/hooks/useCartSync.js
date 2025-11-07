import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDispatch, useSelector } from 'react-redux';
import { loadCart } from '@/lib/features/cart/cartSlice';

/**
 * Custom hook to sync cart with database
 * - Loads cart from database when user logs in
 * - Saves cart to database when cart changes
 */
export const useCartSync = () => {
  const { data: session, status } = useSession();
  const dispatch = useDispatch();
  const cart = useSelector(state => state.cart);

  // Load cart from database when user logs in
  useEffect(() => {
    const loadCartFromDB = async () => {
      if (session?.user?.id && status === 'authenticated') {
        try {
          const response = await fetch('/api/user/cart');
          if (response.ok) {
            const data = await response.json();
            if (data.cart && data.cart.cartItems) {
              dispatch(loadCart({
                cartItems: data.cart.cartItems,
                total: data.cart.total
              }));
            }
          }
        } catch (error) {
          console.error('Failed to load cart from database:', error);
        }
      }
    };

    loadCartFromDB();
  }, [session?.user?.id, status, dispatch]);

  // Save cart to database when cart changes (debounced)
  useEffect(() => {
    const saveCartToDB = async () => {
      if (session?.user?.id && status === 'authenticated') {
        try {
          await fetch('/api/user/cart', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cartItems: cart.cartItems,
              total: cart.total
            })
          });
        } catch (error) {
          console.error('Failed to save cart to database:', error);
        }
      }
    };

    // Debounce: save after 1 second of no changes
    const timer = setTimeout(saveCartToDB, 1000);
    return () => clearTimeout(timer);
  }, [cart.cartItems, cart.total, session?.user?.id, status]);
};

/**
 * Helper function to manually save cart to database
 * Used before logout to ensure cart is saved
 */
export const saveCartToDatabase = async (cartItems, total) => {
  try {
    const response = await fetch('/api/user/cart', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cartItems,
        total
      })
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to save cart:', error);
    return false;
  }
};






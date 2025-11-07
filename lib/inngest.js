import { Inngest } from 'inngest';

// Create an Inngest client
export const inngest = new Inngest({
  id: 'shopme',
  name: 'ShopMe Background Jobs',
});

// Define event types for type safety
export const Events = {
  STORE_STATUS_UPDATED: 'store/status.updated',
  USER_REGISTERED: 'user/registered',
  ORDER_CREATED: 'order/created',
  PRODUCT_CREATED: 'product/created',
};

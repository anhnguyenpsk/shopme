import { inngest, Events } from './inngest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Background job for store approval notifications
export const storeApprovalNotification = inngest.createFunction(
  { id: 'store-approval-notification' },
  { event: Events.STORE_STATUS_UPDATED },
  async ({ event, step }) => {
    const { storeId, status, previousStatus, adminId } = event.data;

    // Log the status change
    await step.run('log-status-change', async () => {
      console.log(`Store ${storeId} status changed from ${previousStatus} to ${status} by admin ${adminId}`);
      return { logged: true };
    });

    // If store was approved, send notification
    if (status === 'APPROVED' && previousStatus !== 'APPROVED') {
      await step.run('send-approval-notification', async () => {
        // Get store details
        const store = await prisma.store.findUnique({
          where: { id: storeId },
          include: {
            user: {
              select: {
                email: true,
                name: true,
              }
            }
          }
        });

        if (!store) {
          throw new Error(`Store with ID ${storeId} not found`);
        }

        // In a real application, you would send an email here
        // For now, we'll just log the notification
        console.log(`Sending approval notification to ${store.user.email}`);
        console.log(`Store "${store.name}" has been approved! You can now start selling.`);

        // You could integrate with email services like:
        // - SendGrid
        // - Resend
        // - AWS SES
        // - Nodemailer

        return {
          notificationSent: true,
          email: store.user.email,
          storeName: store.name,
        };
      });
    }

    // If store was rejected, send rejection notification
    if (status === 'REJECTED' && previousStatus !== 'REJECTED') {
      await step.run('send-rejection-notification', async () => {
        const store = await prisma.store.findUnique({
          where: { id: storeId },
          include: {
            user: {
              select: {
                email: true,
                name: true,
              }
            }
          }
        });

        if (!store) {
          throw new Error(`Store with ID ${storeId} not found`);
        }

        console.log(`Sending rejection notification to ${store.user.email}`);
        console.log(`Store "${store.name}" application was rejected. Please review and resubmit.`);

        return {
          notificationSent: true,
          email: store.user.email,
          storeName: store.name,
        };
      });
    }

    return { success: true };
  }
);

// Background job for user registration welcome
export const userRegistrationWelcome = inngest.createFunction(
  { id: 'user-registration-welcome' },
  { event: Events.USER_REGISTERED },
  async ({ event, step }) => {
    const { userId, email, name } = event.data;

    await step.run('send-welcome-email', async () => {
      console.log(`Sending welcome email to ${email}`);
      console.log(`Welcome to ShopMe, ${name}! Start exploring amazing products.`);

      return {
        welcomeEmailSent: true,
        email,
        name,
      };
    });

    // Add user to newsletter (optional)
    await step.run('add-to-newsletter', async () => {
      console.log(`Adding ${email} to newsletter subscription`);
      
      return {
        addedToNewsletter: true,
        email,
      };
    });

    return { success: true };
  }
);

// Background job for order processing
export const orderProcessing = inngest.createFunction(
  { id: 'order-processing' },
  { event: Events.ORDER_CREATED },
  async ({ event, step }) => {
    const { orderId, userId, storeId, total } = event.data;

    // Send order confirmation to customer
    await step.run('send-order-confirmation', async () => {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          store: true,
          items: {
            include: {
              product: true,
            }
          }
        }
      });

      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      console.log(`Sending order confirmation to ${order.user.email}`);
      console.log(`Order #${orderId} confirmed! Total: $${total}`);

      return {
        confirmationSent: true,
        email: order.user.email,
        orderId,
      };
    });

    // Notify store owner
    await step.run('notify-store-owner', async () => {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
          user: true,
        }
      });

      if (!store) {
        throw new Error(`Store with ID ${storeId} not found`);
      }

      console.log(`Notifying store owner ${store.user.email}`);
      console.log(`New order #${orderId} received! Total: $${total}`);

      return {
        storeNotified: true,
        email: store.user.email,
        orderId,
      };
    });

    return { success: true };
  }
);

// Export all functions
export const inngestFunctions = [
  storeApprovalNotification,
  userRegistrationWelcome,
  orderProcessing,
];

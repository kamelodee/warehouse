import { withIronSession } from 'next-iron-session';

export function withSession(handler) {
  return withIronSession(handler, {
    password: process.env.SESSION_SECRET, // Use a strong password
    cookieName: 'yourapp_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production' // Use secure cookies in production
    }
  });
}

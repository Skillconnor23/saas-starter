import { CredentialsSignin } from 'next-auth';

/**
 * Thrown when sign-in is attempted with an unverified email.
 * Sets code = "email_not_verified" for structured error handling.
 */
export class EmailNotVerifiedError extends CredentialsSignin {
  code = 'email_not_verified' as const;

  constructor(message = 'Please verify your email before signing in.') {
    super(message);
    this.code = 'email_not_verified';
  }
}

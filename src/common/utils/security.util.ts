/**
 * Utility class for security-related operations
 */
export class SecurityUtil {
  /**
   * Sanitize an entity by removing specified fields
   * @param entity - The entity object to sanitize
   * @param excludeFields - Array of field names to exclude
   * @returns Sanitized entity object
   */
  static sanitizeEntity<T extends Record<string, any>>(
    entity: T,
    excludeFields: (keyof T | string)[] = ['password', 'password_hash'],
  ): Partial<T> {
    const sanitized = { ...entity };

    for (const field of excludeFields) {
      delete sanitized[field as keyof T];
    }

    return sanitized;
  }

  /**
   * Sanitize user object by removing sensitive fields
   */
  static sanitizeUser(user: any): any {
    const { password, password_hash, email_verification_token, email_verification_token_expires_at, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Sanitize client object by removing sensitive fields
   */
  static sanitizeClient(client: any): any {
    const { password_hash, email_verification_token, email_verification_token_expires_at, ...sanitized } = client;
    return sanitized;
  }
}

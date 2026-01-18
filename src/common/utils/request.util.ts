/**
 * Extract client information from request
 */
export interface ClientInfo {
  ip: string;
  userAgent: string;
}

/**
 * Utility class for request-related operations
 */
export class RequestUtil {
  /**
   * Extract IP address and user agent from request
   */
  static extractClientInfo(request: any): ClientInfo {
    const ip = request.ip || request.socket?.remoteAddress || 'unknown';
    const userAgent = request.headers?.['user-agent'] || '';

    return { ip, userAgent };
  }

  /**
   * Extract only IP address from request
   */
  static extractIp(request: any): string {
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }

  /**
   * Extract only user agent from request
   */
  static extractUserAgent(request: any): string {
    return request.headers?.['user-agent'] || '';
  }
}

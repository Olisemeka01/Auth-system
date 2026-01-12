export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT',
}

/**
 * Check if user has EXACT role match (no hierarchy)
 * User must have at least one of the required roles
 */
export function hasRequiredRole(userRoles: Role[], requiredRoles: Role[]): boolean {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  // Exact match: user must have at least one of the required roles
  return userRoles.some(userRole => requiredRoles.includes(userRole));
}
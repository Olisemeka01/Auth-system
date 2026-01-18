export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT',
}

/**
 * Role display names mapping
 * Maps enum codes to human-readable display names
 */
export const RoleDisplayNames: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Super Admin',
  [Role.ADMIN]: 'Admin',
  [Role.MANAGER]: 'Manager',
  [Role.EMPLOYEE]: 'Employee',
  [Role.CLIENT]: 'Client',
};

/**
 * Role codes mapping from display name to enum code
 * Maps display names back to enum codes for database lookups
 */
export const RoleCodeMap: Record<string, Role> = {
  'Super Admin': Role.SUPER_ADMIN,
  'Admin': Role.ADMIN,
  'Manager': Role.MANAGER,
  'Employee': Role.EMPLOYEE,
  'Client': Role.CLIENT,
};

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
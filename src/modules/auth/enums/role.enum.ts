export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 5,
  [Role.ADMIN]: 4,
  [Role.MANAGER]: 3,
  [Role.EMPLOYEE]: 2,
  [Role.CLIENT]: 1,
};

export function hasRequiredRole(userRoles: Role[], requiredRoles: Role[]): boolean {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  const maxUserRoleLevel = Math.max(...userRoles.map(role => ROLE_HIERARCHY[role] || 0));

  return requiredRoles.some(requiredRole => {
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    return maxUserRoleLevel >= requiredLevel;
  });
}
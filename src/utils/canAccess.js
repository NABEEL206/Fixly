export const canAccess = (role, allowedRoles = []) => {
  return allowedRoles.includes(role);
};
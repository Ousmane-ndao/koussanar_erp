/**
 * Utilitaires pour le routing basé sur les rôles
 */

export const getDashboardRoute = (roles: string[]): string => {
  // Super Admin (priorité la plus haute)
  if (roles.includes('super_admin') || roles.includes('superadmin')) {
    return '/admin/super';
  }

  // Admin
  if (roles.includes('admin')) {
    return '/admin/dashboard';
  }

  // Professeur / Enseignant
  if (roles.includes('enseignant') || roles.includes('professeur')) {
    return '/professeur/dashboard';
  }

  // Élève
  if (roles.includes('eleve') || roles.includes('student')) {
    return '/eleve/dashboard';
  }

  // Comptable
  if (roles.includes('comptable')) {
    return '/comptable/dashboard';
  }

  // Parent
  if (roles.includes('parent')) {
    return '/parent/dashboard';
  }

  // Surveillant
  if (roles.includes('surveillant')) {
    return '/surveillant/dashboard';
  }

  // Par défaut, rediriger vers le dashboard général
  return '/dashboard';
};

export const getRoleLabel = (roles: string[]): string => {
  if (roles.includes('super_admin') || roles.includes('superadmin')) {
    return 'Super Administrateur';
  }
  if (roles.includes('admin')) {
    return 'Administrateur';
  }
  if (roles.includes('enseignant') || roles.includes('professeur')) {
    return 'Professeur';
  }
  if (roles.includes('eleve') || roles.includes('student')) {
    return 'Élève';
  }
  if (roles.includes('comptable')) {
    return 'Comptable';
  }
  if (roles.includes('parent')) {
    return 'Parent';
  }
  if (roles.includes('surveillant')) {
    return 'Surveillant';
  }
  return 'Utilisateur';
};





















/**
 * Génère un email selon le format LKSNR
 * Format: première lettre du prénom + "." + nom + "5" + @lksnr.edu.sn
 * Exemple: o.ndao5@lksnr.edu.sn
 */
export function generateEmail(prenom, nom, number = 5) {
  if (!prenom || !nom) {
    throw new Error('Le prénom et le nom sont requis pour générer l\'email');
  }
  
  // Nettoyer les noms (enlever accents, espaces, caractères spéciaux)
  const cleanPrenom = prenom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .toLowerCase()
    .trim();
  
  const cleanNom = nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ''); // Enlever les espaces
  
  // Première lettre du prénom
  const firstLetter = cleanPrenom.charAt(0);
  
  // Générer l'email avec le numéro
  const email = `${firstLetter}.${cleanNom}${number}@lksnr.edu.sn`;
  
  return email;
}

/**
 * Génère un mot de passe aléatoire de 6 caractères
 * Contient des chiffres et des lettres (majuscules et minuscules)
 */
export function generatePassword(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
}

/**
 * Vérifie si un email existe déjà dans la base de données
 */
export async function emailExists(pool, email) {
  try {
    const [rows] = await pool.execute(
      'SELECT id FROM profiles WHERE email = ?',
      [email]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    return false;
  }
}

/**
 * Génère un email unique en ajoutant un numéro si nécessaire
 */
export async function generateUniqueEmail(pool, prenom, nom, startNumber = 5) {
  let email = generateEmail(prenom, nom, startNumber);
  let number = startNumber;
  
  // Si l'email existe déjà, essayer avec un numéro différent
  while (await emailExists(pool, email)) {
    number++;
    email = generateEmail(prenom, nom, number);
    
    // Éviter une boucle infinie
    if (number > 99) {
      throw new Error(`Impossible de générer un email unique pour ${prenom} ${nom}`);
    }
  }
  
  return email;
}



















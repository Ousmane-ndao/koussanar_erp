import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Gestion d'erreurs globale - DOIT être défini AVANT tout import React
window.addEventListener('error', (event) => {
  console.error('[Global Error]', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack
  });
  
  // Afficher l'erreur sur la page si possible
  const rootEl = document.getElementById("root");
  if (rootEl && !rootEl.innerHTML.includes('Erreur')) {
    rootEl.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial;">
        <h2>⚠️ Erreur JavaScript</h2>
        <p><strong>Message:</strong> ${event.message}</p>
        <p><strong>Fichier:</strong> ${event.filename || 'N/A'}</p>
        <p><strong>Ligne:</strong> ${event.lineno || 'N/A'}:${event.colno || 'N/A'}</p>
        ${event.error?.stack ? `<pre style="background: #f5f5f5; padding: 10px; overflow-x: auto;">${event.error.stack}</pre>` : ''}
        <p style="margin-top: 20px;">Vérifiez la console du navigateur (F12) pour plus de détails.</p>
      </div>
    `;
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', {
    reason: event.reason,
    promise: event.promise
  });
  
  // Afficher l'erreur sur la page si possible
  const rootEl = document.getElementById("root");
  if (rootEl && !rootEl.innerHTML.includes('Erreur')) {
    rootEl.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial;">
        <h2>⚠️ Erreur de Promise rejetée</h2>
        <p><strong>Raison:</strong> ${event.reason?.message || String(event.reason)}</p>
        ${event.reason?.stack ? `<pre style="background: #f5f5f5; padding: 10px; overflow-x: auto;">${event.reason.stack}</pre>` : ''}
        <p style="margin-top: 20px;">Vérifiez la console du navigateur (F12) pour plus de détails.</p>
      </div>
    `;
  }
});

console.log('[main.tsx] Démarrage de l\'application...');

// Vérifier que root existe
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Élément root introuvable !");
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial;"><h2>Erreur critique</h2><p>Élément #root introuvable dans index.html</p></div>';
  throw new Error("Élément root introuvable");
}

console.log('[main.tsx] Élément root trouvé');
console.log('[main.tsx] Création du root React...');

try {
  const root = createRoot(rootElement);
  console.log('[main.tsx] Root React créé');
  console.log('[main.tsx] Rendu de App...');
  root.render(<App />);
  console.log('[main.tsx] ✓ Application React initialisée avec succès');
} catch (error) {
  console.error("❌ [main.tsx] Erreur lors de l'initialisation:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red; font-family: Arial; max-width: 800px; margin: 0 auto;">
      <h2>❌ Erreur de chargement de l'application</h2>
      <p><strong>Type:</strong> ${error instanceof Error ? error.constructor.name : typeof error}</p>
      <p><strong>Message:</strong> ${error instanceof Error ? error.message : String(error)}</p>
      ${error instanceof Error && error.stack ? `
        <details style="margin-top: 20px;">
          <summary style="cursor: pointer; font-weight: bold;">Stack trace (cliquez pour voir)</summary>
          <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto; margin-top: 10px;">${error.stack}</pre>
        </details>
      ` : ''}
      <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;">
        <h3>Actions à effectuer:</h3>
        <ol>
          <li>Ouvrez la console du navigateur (F12)</li>
          <li>Vérifiez les erreurs dans l'onglet Console</li>
          <li>Vérifiez les erreurs dans l'onglet Network</li>
          <li>Vérifiez que le fichier .env contient VITE_API_URL</li>
          <li>Redémarrez le serveur de développement</li>
        </ol>
      </div>
    </div>
  `;
}

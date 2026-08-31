// ===== CONFIRMATION MODAL SYSTEM =====
// Ce fichier gère le système de confirmation avant suppression d'un produit de la saucée

let pendingDeleteId = null;
let preventCartClose = false;
let preventCartCloseTimer = null;

/**
 * Affiche le modal de confirmation avant suppression
 * @param {number|string} productId - L'ID du produit à supprimer
 * @param {string} productName - Le nom du produit en arabe
 */
function showConfirmationModal(productId, productName) {
    pendingDeleteId = parseInt(productId);
    const confirmProductName = document.getElementById('confirmProductName');
    const confirmationModal = document.getElementById('confirmationModal');
    
    if (confirmProductName) {
        confirmProductName.textContent = productName || 'المنتج';
    }
    
    if (confirmationModal) {
        confirmationModal.classList.add('active');
    }
}

/**
 * Confirme la suppression et exécute la fonction de suppression
 * @param {function} deleteCallback - La fonction à exécuter après confirmation
 */
function confirmDelete(deleteCallback) {
    if (pendingDeleteId !== null) {
        // Récupérer le nom du produit avant la suppression
        const productName = document.getElementById('confirmProductName')?.textContent || 'المنتج';
        
        // Ouvrir le cart sidebar
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.add('active');
        }
        
        // Empêcher la fermeture de la cart pendant 500ms après la suppression
        preventCartClose = true;
        if (preventCartCloseTimer) {
            clearTimeout(preventCartCloseTimer);
        }
        preventCartCloseTimer = setTimeout(() => {
            preventCartClose = false;
        }, 500);
        
        // Si une fonction callback est fournie, l'utiliser
        if (typeof deleteCallback === 'function') {
            deleteCallback(pendingDeleteId, productName);
        }
        // Sinon, chercher la fonction globale deleteProductFromCart
        else if (typeof window.deleteProductFromCart === 'function') {
            window.deleteProductFromCart(pendingDeleteId, productName);
        }
        cancelDelete();
    }
}

/**
 * Annule l'opération de suppression et ferme le modal
 */
function cancelDelete() {
    pendingDeleteId = null;
    const confirmationModal = document.getElementById('confirmationModal');
    if (confirmationModal) {
        confirmationModal.classList.remove('active');
    }
}

/**
 * Initialise le modal de confirmation (appel une seule fois au chargement de la page)
 */
function initializeConfirmationModal() {
    // Le modal HTML doit être présent dans le body du fichier HTML
    const confirmationModal = document.getElementById('confirmationModal');
    
    if (!confirmationModal) {
        console.warn('⚠️ Le modal de confirmation n\'a pas été trouvé dans le DOM');
        return false;
    }
    
    console.log('✅ Modal de confirmation initialisé');
    return true;
}

// Rendre les fonctions globales
window.showConfirmationModal = showConfirmationModal;
window.confirmDelete = confirmDelete;
window.cancelDelete = cancelDelete;
window.initializeConfirmationModal = initializeConfirmationModal;
window.pendingDeleteId = null;
window.preventCartClose = false;
window.preventCartCloseTimer = null;

// Getter/Setter pour pendingDeleteId
Object.defineProperty(window, 'pendingDeleteId', {
    get: function() {
        return pendingDeleteId;
    },
    set: function(value) {
        pendingDeleteId = value;
    }
});

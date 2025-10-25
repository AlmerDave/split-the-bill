// Calculator Module - Handles all bill splitting calculations

const BillCalculator = {
    /**
     * Calculate per person share
     * @param {number} totalBill - Total bill amount
     * @param {number} numPeople - Number of participants
     * @returns {number} - Amount each person should pay
     */
    calculatePerPersonShare(totalBill, numPeople) {
        if (numPeople === 0) return 0;
        return parseFloat((totalBill / numPeople).toFixed(2));
    },

    /**
     * Calculate individual balances
     * @param {Array} participants - Array of participant objects
     * @param {Array} payments - Array of payment objects
     * @param {number} perPersonShare - Equal share amount
     * @returns {Array} - Participants with calculated balances
     */
    calculateBalances(participants, payments, perPersonShare) {
        // Initialize all balances to negative (owe amount)
        const balances = participants.map(p => ({
            ...p,
            paid: 0,
            balance: -perPersonShare
        }));

        // Add payments to respective participants
        payments.forEach(payment => {
            const participant = balances.find(p => p.id === payment.payerId);
            if (participant) {
                participant.paid += payment.amount;
                participant.balance += payment.amount;
            }
        });

        // Round balances to 2 decimal places
        balances.forEach(p => {
            p.balance = parseFloat(p.balance.toFixed(2));
        });

        return balances;
    },

    /**
     * Generate optimized settlement instructions
     * Uses greedy algorithm to minimize number of transactions
     * @param {Array} balances - Participants with calculated balances
     * @returns {Array} - Array of settlement objects
     */
    generateSettlements(balances) {
        const settlements = [];
        
        // Separate creditors (positive balance) and debtors (negative balance)
        const creditors = balances
            .filter(p => p.balance > 0.01) // Allow 1 cent tolerance
            .map(p => ({ ...p }))
            .sort((a, b) => b.balance - a.balance);
        
        const debtors = balances
            .filter(p => p.balance < -0.01)
            .map(p => ({ ...p, balance: Math.abs(p.balance) }))
            .sort((a, b) => b.balance - a.balance);

        // Greedy algorithm: Match largest debtor with largest creditor
        let i = 0, j = 0;
        
        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];
            
            const amount = Math.min(debtor.balance, creditor.balance);
            
            if (amount > 0.01) { // Ignore amounts less than 1 cent
                settlements.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: parseFloat(amount.toFixed(2))
                });
            }

            debtor.balance -= amount;
            creditor.balance -= amount;

            if (debtor.balance < 0.01) i++;
            if (creditor.balance < 0.01) j++;
        }

        return settlements;
    },

    /**
     * Main calculation function
     * @param {number} totalBill - The total bill amount entered by user
     * @param {Array} participants - Array of participant objects
     * @param {Array} payments - Array of payment objects
     * @returns {Object} - Complete calculation results
     */
    calculate(totalBill, participants, payments) {
        // Use the total bill provided by user
        const actualTotal = parseFloat(totalBill);
        
        // Calculate per person share based on total bill
        const perPersonShare = this.calculatePerPersonShare(actualTotal, participants.length);
        
        // Calculate individual balances
        const balances = this.calculateBalances(participants, payments, perPersonShare);
        
        // Generate settlement instructions
        const settlements = this.generateSettlements(balances);

        // Calculate total paid (for display)
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        return {
            totalBill: actualTotal,
            totalPaid: parseFloat(totalPaid.toFixed(2)),
            perPersonShare,
            balances,
            settlements,
            participants,
            payments
        };
    },

    /**
     * Format currency for display
     * @param {number} amount - Amount to format
     * @returns {string} - Formatted currency string
     */
    formatCurrency(amount) {
        return `₱${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    },

    /**
     * Validate calculation inputs
     * @param {number} totalBill - Total bill amount
     * @param {Array} participants - Array of participants
     * @param {Array} payments - Array of payments
     * @returns {Object} - Validation result
     */
    validate(totalBill, participants, payments) {
        const errors = [];

        // Validate total bill
        if (!totalBill || totalBill <= 0) {
            errors.push('Total bill must be greater than zero');
        }

        // Validate participants
        if (!participants || participants.length < 2) {
            errors.push('At least 2 participants required');
        }

        if (participants.length > 20) {
            errors.push('Maximum 20 participants allowed');
        }

        participants.forEach(p => {
            if (!p.name || p.name.trim() === '') {
                errors.push('All participants must have names');
            }
        });

        // Validate payments
        if (!payments || payments.length === 0) {
            errors.push('At least one payment required');
        }

        payments.forEach(p => {
            if (p.amount <= 0) {
                errors.push('All payments must be positive amounts');
            }
        });

        // Check if payments match total (optional warning, not error)
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const difference = Math.abs(totalPaid - totalBill);
        
        if (difference > 0.01) {
            // This is a warning, not blocking error
            const warning = totalPaid > totalBill 
                ? `Overpaid by ${this.formatCurrency(difference)}`
                : `Underpaid by ${this.formatCurrency(difference)}`;
            
            // Note: We allow mismatched amounts, just warn user
            console.warn(warning);
        }

        return {
            valid: errors.length === 0,
            errors,
            warning: difference > 0.01 ? 
                (totalPaid > totalBill ? 'overpaid' : 'underpaid') : null,
            difference: parseFloat(difference.toFixed(2))
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BillCalculator;
}
// Main Application Controller

const App = {
    // Application state
    state: {
        currentStep: 1,
        participants: [],
        totalBill: 0,
        payments: [],
        results: null
    },

    // Initialize application
    init() {
        console.log('Initializing Split the Bill App...');
        this.setupEventListeners();
        this.loadFromSession();
        this.registerServiceWorker();
    },

    // Setup all event listeners
    setupEventListeners() {
        // Step 1: Participants
        document.getElementById('numPeople').addEventListener('change', (e) => {
            this.generateParticipantInputs(parseInt(e.target.value));
        });

        document.getElementById('nextToTotal').addEventListener('click', () => {
            this.goToStep2();
        });

        // Step 2: Total Bill
        document.getElementById('nextToPayments').addEventListener('click', () => {
            this.goToStep3();
        });

        // Step 3: Payments
        document.getElementById('addPayment').addEventListener('click', () => {
            this.addPaymentInput();
        });

        document.getElementById('calculateSplit').addEventListener('click', () => {
            this.calculateAndShowResults();
        });

        // Add real-time payment tracking
        document.getElementById('paymentsList').addEventListener('input', () => {
            this.updatePaymentSummary();
        });

        // Step 4: Results
        document.getElementById('saveImage').addEventListener('click', () => {
            ImageExporter.exportAsImage();
        });

        document.getElementById('shareResults').addEventListener('click', () => {
            this.shareResults();
        });

        document.getElementById('newSplit').addEventListener('click', () => {
            this.resetApp();
        });

        // Generate initial participant inputs
        this.generateParticipantInputs(2);
    },

    // Generate participant input fields
    generateParticipantInputs(numPeople) {
        const container = document.getElementById('participantInputs');
        container.innerHTML = '';

        for (let i = 1; i <= numPeople; i++) {
            const div = document.createElement('div');
            div.className = 'form-group participant-input';
            div.innerHTML = `
                <label for="person${i}">Person ${i}</label>
                <input type="text" 
                       id="person${i}" 
                       placeholder="Enter name" 
                       maxlength="30"
                       required>
            `;
            container.appendChild(div);
        }
    },

    // Move to Step 2 (Total Bill)
    goToStep2() {
        // Collect participant data
        const numPeople = parseInt(document.getElementById('numPeople').value);
        const participants = [];

        for (let i = 1; i <= numPeople; i++) {
            const name = document.getElementById(`person${i}`).value.trim();
            if (!name) {
                this.showError('Please enter names for all participants');
                return;
            }
            participants.push({
                id: i,
                name: name
            });
        }

        // Validation
        if (numPeople < 2 || numPeople > 20) {
            this.showError('Number of people must be between 2 and 20');
            return;
        }

        // Save to state
        this.state.participants = participants;
        this.saveToSession();

        // Show step 2
        this.showStep(2);
        
        // Focus on total bill input
        setTimeout(() => {
            document.getElementById('totalBill').focus();
        }, 300);
    },

    // Move to Step 3 (Payments)
    goToStep3() {
        // Get total bill amount
        const totalBill = parseFloat(document.getElementById('totalBill').value);

        // Validation
        if (!totalBill || totalBill <= 0) {
            this.showError('Please enter a valid total bill amount');
            return;
        }

        // Save to state
        this.state.totalBill = totalBill;
        this.saveToSession();

        // Update bill summary display
        document.getElementById('billTotal').textContent = BillCalculator.formatCurrency(totalBill);
        document.getElementById('paidSoFar').textContent = BillCalculator.formatCurrency(0);
        document.getElementById('remaining').textContent = BillCalculator.formatCurrency(totalBill);

        // Generate payment inputs
        this.generatePaymentInputs();

        // Show step 3
        this.showStep(3);
    },

    // Generate payment input section
    generatePaymentInputs() {
        const container = document.getElementById('paymentsList');
        container.innerHTML = '';
        
        // Add one payment input by default
        this.addPaymentInput();
    },

    // Add a single payment input
    addPaymentInput() {
        const container = document.getElementById('paymentsList');
        const paymentId = Date.now(); // Unique ID

        const div = document.createElement('div');
        div.className = 'payment-item';
        div.dataset.paymentId = paymentId;
        
        div.innerHTML = `
            <select class="payer-select" required>
                <option value="">Who paid?</option>
                ${this.state.participants.map(p => 
                    `<option value="${p.id}">${p.name}</option>`
                ).join('')}
            </select>
            <input type="number" 
                   class="payment-amount" 
                   placeholder="Amount" 
                   step="0.01" 
                   min="0.01" 
                   required>
            <button type="button" class="remove-payment" onclick="App.removePayment(${paymentId})">×</button>
        `;

        container.appendChild(div);
        
        // Update summary after adding new input
        this.updatePaymentSummary();
    },

    // Remove payment input
    removePayment(paymentId) {
        const element = document.querySelector(`[data-payment-id="${paymentId}"]`);
        if (element) {
            // Don't allow removing if it's the only payment
            const container = document.getElementById('paymentsList');
            if (container.children.length > 1) {
                element.remove();
                this.updatePaymentSummary();
            } else {
                this.showError('At least one payment is required');
            }
        }
    },

    // Update payment summary in real-time
    updatePaymentSummary() {
        const paymentItems = document.querySelectorAll('.payment-item');
        let totalPaid = 0;

        paymentItems.forEach(item => {
            const amount = parseFloat(item.querySelector('.payment-amount').value) || 0;
            totalPaid += amount;
        });

        const remaining = this.state.totalBill - totalPaid;

        document.getElementById('paidSoFar').textContent = BillCalculator.formatCurrency(totalPaid);
        document.getElementById('remaining').textContent = BillCalculator.formatCurrency(remaining);

        // Add visual feedback for overpayment/underpayment
        const remainingElement = document.querySelector('.bill-info.remaining');
        if (Math.abs(remaining) < 0.01) {
            remainingElement.style.color = '#10B981'; // Green - perfect
        } else if (remaining < 0) {
            remainingElement.style.color = '#F59E0B'; // Orange - overpaid
        } else {
            remainingElement.style.color = '#FFFFFF'; // White - still owe
        }
    },

    // Calculate and show results
    calculateAndShowResults() {
        // Collect payment data
        const payments = [];
        const paymentItems = document.querySelectorAll('.payment-item');

        paymentItems.forEach((item, index) => {
            const payerId = parseInt(item.querySelector('.payer-select').value);
            const amount = parseFloat(item.querySelector('.payment-amount').value);

            if (payerId && amount > 0) {
                payments.push({
                    id: index + 1,
                    payerId: payerId,
                    amount: amount
                });
            }
        });

        // Validation
        const validation = BillCalculator.validate(this.state.totalBill, this.state.participants, payments);
        if (!validation.valid) {
            this.showError(validation.errors.join(', '));
            return;
        }

        // Show warning for payment mismatch
        if (validation.warning) {
            const warningMsg = validation.warning === 'overpaid' 
                ? `Note: Total paid is ${BillCalculator.formatCurrency(validation.difference)} more than the bill. The extra will be refunded.`
                : `Note: Total paid is ${BillCalculator.formatCurrency(validation.difference)} less than the bill. The remaining amount will be split.`;
            
            console.warn(warningMsg);
        }

        // Calculate
        this.state.payments = payments;
        this.state.results = BillCalculator.calculate(this.state.totalBill, this.state.participants, payments);
        this.saveToSession();

        // Display results
        this.displayResults();
        this.showStep(4);
    },

    // Display calculation results
    displayResults() {
        const results = this.state.results;

        // Summary
        document.getElementById('totalAmount').textContent = 
            BillCalculator.formatCurrency(results.totalBill);
        document.getElementById('perPersonAmount').textContent = 
            BillCalculator.formatCurrency(results.perPersonShare);

        // Payments made
        const paymentsSummary = document.getElementById('paymentsSummary');
        paymentsSummary.innerHTML = results.payments.map(payment => {
            const payer = results.participants.find(p => p.id === payment.payerId);
            return `
                <li>
                    <span>${payer.name} paid</span>
                    <strong>${BillCalculator.formatCurrency(payment.amount)}</strong>
                </li>
            `;
        }).join('');

        // Add total paid info
        paymentsSummary.innerHTML += `
            <li style="border-top: 2px solid #E5E7EB; margin-top: 8px; padding-top: 8px; font-weight: 600;">
                <span>Total Paid</span>
                <strong>${BillCalculator.formatCurrency(results.totalPaid)}</strong>
            </li>
        `;

        // Settlements
        const settlementList = document.getElementById('settlementList');
        if (results.settlements.length === 0) {
            settlementList.innerHTML = `
                <li class="settled">
                    <span>✅ Everyone is settled!</span>
                </li>
            `;
        } else {
            settlementList.innerHTML = results.settlements.map(settlement => `
                <li>
                    <span>${settlement.from} → ${settlement.to}</span>
                    <strong>${BillCalculator.formatCurrency(settlement.amount)}</strong>
                </li>
            `).join('');
        }
    },

    // Share results using Web Share API
    async shareResults() {
        if (navigator.share) {
            try {
                const results = this.state.results;
                const text = `Split the Bill Results\n\n` +
                    `Total Bill: ${BillCalculator.formatCurrency(results.totalBill)}\n` +
                    `Per Person: ${BillCalculator.formatCurrency(results.perPersonShare)}\n\n` +
                    `Settlements:\n` +
                    results.settlements.map(s => 
                        `${s.from} → ${s.to}: ${BillCalculator.formatCurrency(s.amount)}`
                    ).join('\n');

                await navigator.share({
                    title: 'Split the Bill Results',
                    text: text,
                    url: window.location.href
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                    this.showError('Could not share results');
                }
            }
        } else {
            // Fallback: Copy to clipboard
            this.copyResultsToClipboard();
        }
    },

    // Copy results to clipboard
    async copyResultsToClipboard() {
        const results = this.state.results;
        const text = `Split the Bill Results\n\n` +
            `Total Bill: ${BillCalculator.formatCurrency(results.totalBill)}\n` +
            `Per Person: ${BillCalculator.formatCurrency(results.perPersonShare)}\n\n` +
            `Settlements:\n` +
            results.settlements.map(s => 
                `${s.from} → ${s.to}: ${BillCalculator.formatCurrency(s.amount)}`
            ).join('\n');

        try {
            await navigator.clipboard.writeText(text);
            alert('Results copied to clipboard!');
        } catch (err) {
            console.error('Copy failed:', err);
            this.showError('Could not copy results');
        }
    },

    // Reset app to initial state
    resetApp() {
        if (confirm('Start a new split? Current data will be lost.')) {
            this.state = {
                currentStep: 1,
                participants: [],
                totalBill: 0,
                payments: [],
                results: null
            };
            sessionStorage.removeItem('splitTheBillState');
            this.showStep(1);
            document.getElementById('numPeople').value = 2;
            document.getElementById('totalBill').value = '';
            this.generateParticipantInputs(2);
            this.hideError();
        }
    },

    // Show specific step
    showStep(stepNumber) {
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        document.getElementById(`step${stepNumber}`).classList.add('active');
        this.state.currentStep = stepNumber;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Show error message
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        
        setTimeout(() => {
            this.hideError();
        }, 5000);
    },

    // Hide error message
    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.classList.remove('show');
    },

    // Save state to session storage
    saveToSession() {
        try {
            sessionStorage.setItem('splitTheBillState', JSON.stringify(this.state));
        } catch (err) {
            console.error('Failed to save state:', err);
        }
    },

    // Load state from session storage
    loadFromSession() {
        try {
            const saved = sessionStorage.getItem('splitTheBillState');
            if (saved) {
                this.state = JSON.parse(saved);
                // Could restore previous state, but for simplicity, start fresh
            }
        } catch (err) {
            console.error('Failed to load state:', err);
        }
    },

    // Register service worker for PWA
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('service-worker.js')
                    .then(registration => {
                        console.log('Service Worker registered:', registration);
                    })
                    .catch(err => {
                        console.error('Service Worker registration failed:', err);
                    });
            });
        }
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
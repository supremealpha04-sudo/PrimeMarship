export const Payments = {
    // Paystack integration
    paystack: {
        async initializePayment(amount, email, metadata) {
            const handler = PaystackPop.setup({
                key: 'pk_live_your_paystack_key', // Replace with actual key
                email: email,
                amount: amount * 100, // Convert to kobo
                currency: 'NGN',
                metadata: metadata,
                callback: function(response) {
                    Payments.verifyPayment(response.reference, 'paystack');
                },
                onClose: function() {
                    alert('Payment cancelled');
                }
            });
            handler.openIframe();
        }
    },

    // Flutterwave integration
    flutterwave: {
        async initializePayment(amount, email, metadata) {
            const response = await fetch('https://api.flutterwave.com/v3/payments', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer FLWSECK-YourSecretKey',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tx_ref: this.generateReference(),
                    amount: amount,
                    currency: 'USD',
                    redirect_url: 'https://primemar.com/payment/callback',
                    customer: { email },
                    customizations: {
                        title: 'PrimeMar Payment',
                        logo: 'https://primemar.com/logo.png'
                    },
                    meta: metadata
                })
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                window.location.href = data.data.link;
            }
        }
    },

    // Creator Verification Payment ($25)
    async processVerificationPayment(userId) {
        const user = JSON.parse(localStorage.getItem('pm_user'));
        
        // Check if user meets requirements
        if (user.followers < 3000) {
            alert('You need at least 3000 followers to apply for verification.');
            return false;
        }

        const metadata = {
            type: 'verification',
            userId: userId,
            username: user.username
        };

        // Use appropriate gateway based on currency
        const currency = user.preferredCurrency || 'USD';
        
        if (currency === 'NGN') {
            // Convert $25 to NGN (approximate)
            const ngnAmount = 25 * 1500; // 1500 exchange rate
            this.paystack.initializePayment(ngnAmount, user.email, metadata);
        } else {
            this.flutterwave.initializePayment(25, user.email, metadata);
        }
    },

    // Subscription Payment ($7/month)
    async processSubscriptionPayment(userId, creatorId) {
        const user = JSON.parse(localStorage.getItem('pm_user'));
        
        const metadata = {
            type: 'subscription',
            userId: userId,
            creatorId: creatorId,
            month: new Date().toISOString().slice(0, 7) // YYYY-MM
        };

        const currency = user.preferredCurrency || 'USD';
        
        if (currency === 'NGN') {
            const ngnAmount = 7 * 1500; // Convert to NGN
            this.paystack.initializePayment(ngnAmount, user.email, metadata);
        } else {
            this.flutterwave.initializePayment(7, user.email, metadata);
        }
    },

    // SA Withdrawal (minimum $5)
    async processWithdrawal(userId, amount, bankDetails) {
        if (amount < 5) {
            alert('Minimum withdrawal amount is $5');
            return false;
        }

        const user = JSON.parse(localStorage.getItem('pm_user'));
        
        // Check SA balance
        if (user.saBalance < this.convertToSA(amount)) {
            alert('Insufficient SA balance');
            return false;
        }

        try {
            const response = await fetch('/api/payments/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('pm_token')}`
                },
                body: JSON.stringify({
                    userId,
                    amount,
                    currency: bankDetails.currency,
                    bankDetails,
                    saAmount: this.convertToSA(amount)
                })
            });

            if (response.ok) {
                alert('Withdrawal request submitted successfully');
                return true;
            }
        } catch (error) {
            console.error('Withdrawal failed:', error);
            return false;
        }
    },

    convertToSA(usdAmount) {
        // Conversion rate: 1 SA = $0.01 (example rate)
        return usdAmount * 100;
    },

    generateReference() {
        return 'PM_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    async verifyPayment(reference, gateway) {
        try {
            const response = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference, gateway })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                // Handle different payment types
                if (data.metadata.type === 'verification') {
                    await this.completeVerification(data.metadata.userId);
                } else if (data.metadata.type === 'subscription') {
                    await this.activateSubscription(data.metadata);
                }
                
                alert('Payment successful!');
            }
        } catch (error) {
            console.error('Payment verification failed:', error);
        }
    },

    async completeVerification(userId) {
        // Grant verified status
        await fetch('/api/users/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('pm_token')}`
            },
            body: JSON.stringify({ userId })
        });

        // Update local user
        const user = JSON.parse(localStorage.getItem('pm_user'));
        user.verified = true;
        localStorage.setItem('pm_user', JSON.stringify(user));
    },

    async activateSubscription(metadata) {
        await fetch('/api/subscriptions/activate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('pm_token')}`
            },
            body: JSON.stringify(metadata)
        });
    }
};
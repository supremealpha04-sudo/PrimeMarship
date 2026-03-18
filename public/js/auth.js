export const Auth = {
    async login(email, password) {
        try {
            // API call simulation
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) throw new Error('Login failed');
            
            const data = await response.json();
            localStorage.setItem('pm_token', data.token);
            localStorage.setItem('pm_user', JSON.stringify(data.user));
            
            return data.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async signup(name, email, password) {
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            
            if (!response.ok) throw new Error('Signup failed');
            
            const data = await response.json();
            localStorage.setItem('pm_token', data.token);
            localStorage.setItem('pm_user', JSON.stringify(data.user));
            
            // Initial SA token reward for joining
            await this.creditSA(data.user.id, 5, 'welcome bonus');
            
            return data.user;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    },

    async verifyToken(token) {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Invalid token');
            
            return await response.json();
        } catch (error) {
            console.error('Token verification failed:', error);
            throw error;
        }
    },

    logout() {
        localStorage.removeItem('pm_token');
        localStorage.removeItem('pm_user');
        window.location.href = '/';
    },

    async creditSA(userId, amount, reason) {
        // Credit SA tokens to user
        console.log(`Credited ${amount} SA to user ${userId} for ${reason}`);
        
        // Check daily limit
        const todayEarnings = await this.getTodayEarnings(userId);
        if (todayEarnings + amount > 80) {
            throw new Error('Daily SA limit reached (80 SA)');
        }
        
        // Distribute according to rules
        const distribution = {
            creator: amount * 0.5,
            platform: amount * 0.3,
            reserve: amount * 0.2
        };
        
        // API call to update balances
        await fetch('/api/sa/credit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, amount, distribution, reason })
        });
        
        return distribution;
    },

    async getTodayEarnings(userId) {
        // Get today's SA earnings
        const response = await fetch(`/api/sa/today/${userId}`);
        const data = await response.json();
        return data.total || 0;
    }
};
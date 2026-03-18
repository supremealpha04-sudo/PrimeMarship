export const Settings = {
    async load() {
        const container = document.querySelector('.main-feed');
        if (!container) return;

        container.innerHTML = `
            <div class="settings-page">
                <div class="settings-header">
                    <h2>Settings</h2>
                </div>
                
                <div class="settings-menu">
                    <span class="settings-option active" onclick="Settings.loadSection('profile')">Profile</span>
                    <span class="settings-option" onclick="Settings.loadSection('account')">Account</span>
                    <span class="settings-option" onclick="Settings.loadSection('privacy')">Privacy</span>
                    <span class="settings-option" onclick="Settings.loadSection('notifications')">Notifications</span>
                    <span class="settings-option" onclick="Settings.loadSection('payments')">Payments</span>
                    <span class="settings-option" onclick="Settings.loadSection('security')">Security</span>
                    <span class="settings-option" onclick="Settings.loadSection('sa-wallet')">SA Wallet</span>
                </div>
                
                <div class="settings-content" id="settingsContent">
                    ${this.renderProfileSection()}
                </div>
            </div>
        `;

        this.loadUserData();
    },

    async loadSection(section) {
        // Update active tab
        document.querySelectorAll('.settings-option').forEach(opt => {
            opt.classList.remove('active');
            if (opt.textContent.toLowerCase().includes(section)) {
                opt.classList.add('active');
            }
        });

        const content = document.getElementById('settingsContent');
        
        switch(section) {
            case 'profile':
                content.innerHTML = this.renderProfileSection();
                this.loadUserData();
                break;
            case 'account':
                content.innerHTML = this.renderAccountSection();
                break;
            case 'privacy':
                content.innerHTML = this.renderPrivacySection();
                break;
            case 'notifications':
                content.innerHTML = this.renderNotificationsSection();
                this.loadNotificationSettings();
                break;
            case 'payments':
                content.innerHTML = this.renderPaymentsSection();
                this.loadPaymentMethods();
                break;
            case 'security':
                content.innerHTML = this.renderSecuritySection();
                break;
            case 'sa-wallet':
                content.innerHTML = this.renderSAWalletSection();
                this.loadSAWallet();
                break;
        }
    },

    renderProfileSection() {
        return `
            <div class="settings-section">
                <h3>Profile Information</h3>
                
                <div class="profile-picture-section">
                    <div class="avatar-large" id="profileAvatar"></div>
                    <div>
                        <button class="btn btn-outline" onclick="Settings.changeAvatar()">
                            Change Avatar
                        </button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Display Name</label>
                    <input type="text" class="form-input" id="displayName" placeholder="Your name">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-input" id="username" placeholder="@username">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Bio</label>
                    <textarea class="form-input" id="bio" rows="4" placeholder="Tell us about yourself..." maxlength="160"></textarea>
                    <span class="char-count" id="bioCount">0/160</span>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Website</label>
                    <input type="url" class="form-input" id="website" placeholder="https://...">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" class="form-input" id="location" placeholder="City, Country">
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Settings.saveProfile()">Save Changes</button>
                    <button class="btn btn-outline" onclick="Settings.cancel()">Cancel</button>
                </div>
            </div>
        `;
    },

    renderAccountSection() {
        return `
            <div class="settings-section">
                <h3>Account Settings</h3>
                
                <div class="account-info">
                    <p><strong>Email:</strong> <span id="accountEmail"></span></p>
                    <p><strong>Member since:</strong> <span id="memberSince"></span></p>
                    <p><strong>Account status:</strong> <span class="badge-verified" id="accountStatus"></span></p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Change Email</label>
                    <input type="email" class="form-input" id="newEmail" placeholder="New email">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Current Password</label>
                    <input type="password" class="form-input" id="currentPassword" placeholder="Enter current password">
                </div>
                
                <div class="form-group">
                    <label class="form-label">New Password</label>
                    <input type="password" class="form-input" id="newPassword" placeholder="Enter new password">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Confirm New Password</label>
                    <input type="password" class="form-input" id="confirmPassword" placeholder="Confirm new password">
                </div>
                
                <div class="danger-zone">
                    <h4>Danger Zone</h4>
                    <p>Once you delete your account, there is no going back. Please be certain.</p>
                    <button class="btn btn-outline danger" onclick="Settings.deleteAccount()">
                        Delete Account
                    </button>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Settings.updateAccount()">Update Account</button>
                </div>
            </div>
        `;
    },

    renderPrivacySection() {
        return `
            <div class="settings-section">
                <h3>Privacy Settings</h3>
                
                <div class="privacy-option">
                    <div class="privacy-info">
                        <h4>Private Account</h4>
                        <p>When your account is private, only approved followers can see your posts.</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="privateAccount">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="privacy-option">
                    <div class="privacy-info">
                        <h4>Show Online Status</h4>
                        <p>Let others see when you're active on PrimeMar.</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="showOnline" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="privacy-option">
                    <div class="privacy-info">
                        <h4>Allow Messages from</h4>
                        <p>Choose who can send you direct messages.</p>
                    </div>
                    <select id="messagePrivacy" class="form-input" style="width: auto;">
                        <option value="everyone">Everyone</option>
                        <option value="followers">People you follow</option>
                        <option value="verified">Verified only</option>
                        <option value="none">No one</option>
                    </select>
                </div>
                
                <div class="privacy-option">
                    <div class="privacy-info">
                        <h4>Hide SA Earnings</h4>
                        <p>Keep your SA token balance private.</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="hideSA">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="blocked-users">
                    <h4>Blocked Users</h4>
                    <div id="blockedList"></div>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Settings.savePrivacy()">Save Privacy Settings</button>
                </div>
            </div>
        `;
    },

    renderNotificationsSection() {
        return `
            <div class="settings-section">
                <h3>Notification Settings</h3>
                
                <div class="notification-settings">
                    <div class="notification-setting-item">
                        <div class="notification-setting-info">
                            <h4>Push Notifications</h4>
                            <p>Receive push notifications on your device</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="pushEnabled" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="notification-setting-item">
                        <div class="notification-setting-info">
                            <h4>Email Notifications</h4>
                            <p>Receive email updates</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="emailEnabled" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="notification-setting-item">
                        <div class="notification-setting-info">
                            <h4>New Followers</h4>
                            <p>Get notified when someone follows you</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="notifFollow" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="notification-setting-item">
                        <div class="notification-setting-info">
                            <h4>Likes</h4>
                            <p>Get notified when someone likes your posts</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="notifLike" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="notification-setting-item">
                        <div class="notification-setting-info">
                            <h4>Comments & Replies</h4>
                            <p>Get notified when someone comments on your posts</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="notifComment" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="notification-setting-item">
                        <div class="notification-setting-info">
                            <h4>Mentions</h4>
                            <p>Get notified when someone mentions you</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="notifMention" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="notification-setting-item">
                        <div class="notification-setting-info">
                            <h4>Messages</h4>
                            <p>Get notified when you receive a message</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="notifMessage" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="notification-setting-item">
                        <div class="notification-setting-info">
                            <h4>SA Earnings</h4>
                            <p>Get notified about SA token earnings</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="notifSA" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Settings.saveNotifications()">Save Notification Settings</button>
                </div>
            </div>
        `;
    },

    renderPaymentsSection() {
        return `
            <div class="settings-section">
                <h3>Payment Settings</h3>
                
                <div class="payment-methods">
                    <h4>Payment Methods</h4>
                    
                    <div class="payment-method-card">
                        <div class="payment-method-info">
                            <i class="fas fa-credit-card"></i>
                            <div>
                                <h5>Credit Card</h5>
                                <p>•••• 4242</p>
                            </div>
                        </div>
                        <div class="payment-method-actions">
                            <button class="btn-icon"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    
                    <button class="btn btn-outline" onclick="Settings.addPaymentMethod()">
                        <i class="fas fa-plus"></i> Add Payment Method
                    </button>
                </div>
                
                <div class="currency-settings">
                    <h4>Preferred Currency</h4>
                    <select id="preferredCurrency" class="form-input" style="width: 200px;">
                        <option value="USD">USD ($)</option>
                        <option value="NGN">NGN (₦)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                    </select>
                </div>
                
                <div class="withdrawal-settings">
                    <h4>Withdrawal Settings</h4>
                    
                    <div class="form-group">
                        <label class="form-label">Bank Account</label>
                        <input type="text" class="form-input" placeholder="Account Number">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Bank Name</label>
                        <select class="form-input">
                            <option>Select Bank</option>
                            <option>Chase Bank</option>
                            <option>Bank of America</option>
                            <option>Wells Fargo</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Account Holder Name</label>
                        <input type="text" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Routing Number</label>
                        <input type="text" class="form-input">
                    </div>
                </div>
                
                <div class="payout-history">
                    <h4>Payout History</h4>
                    <table class="simple-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="payoutHistory"></tbody>
                    </table>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Settings.savePaymentSettings()">Save Payment Settings</button>
                </div>
            </div>
        `;
    },

    renderSAWalletSection() {
        return `
            <div class="settings-section">
                <h3>SA Wallet</h3>
                
                <div class="sa-balance-card large">
                    <div class="sa-label">Current Balance</div>
                    <div class="sa-amount-large" id="saBalance">0 SA</div>
                    <div class="sa-usd-value" id="saUSDValue">$0.00</div>
                </div>
                
                <div class="sa-stats">
                    <div class="sa-stat">
                        <label>Today's Earnings</label>
                        <span id="todayEarnings">0 SA</span>
                    </div>
                    <div class="sa-stat">
                        <label>Daily Limit</label>
                        <span>80 SA</span>
                    </div>
                    <div class="sa-stat">
                        <label>Lifetime Earned</label>
                        <span id="lifetimeEarned">0 SA</span>
                    </div>
                </div>
                
                <div class="sa-progress-detailed">
                    <div class="progress-label">
                        <span>Today's Progress</span>
                        <span id="todayProgress">0/80 SA</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="todayProgressFill" style="width: 0%"></div>
                    </div>
                </div>
                
                <div class="withdrawal-section">
                    <h4>Withdraw SA Tokens</h4>
                    <p class="text-muted">Minimum withdrawal: $5 (500 SA)</p>
                    
                    <div class="form-group">
                        <label class="form-label">Amount (SA)</label>
                        <input type="number" class="form-input" id="withdrawAmount" min="500" step="100">
                    </div>
                    
                    <div class="withdrawal-preview">
                        <p>You will receive: <strong id="withdrawUSD">$0.00</strong></p>
                        <p>Conversion rate: 100 SA = $1.00</p>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Select Withdrawal Method</label>
                        <select class="form-input" id="withdrawMethod">
                            <option value="bank">Bank Transfer</option>
                            <option value="paypal">PayPal</option>
                            <option value="paystack">Paystack (NGN)</option>
                            <option value="flutterwave">Flutterwave</option>
                        </select>
                    </div>
                    
                    <button class="btn btn-primary" onclick="Settings.requestWithdrawal()">
                        Request Withdrawal
                    </button>
                </div>
                
                <div class="transaction-history">
                    <h4>Transaction History</h4>
                    <table class="simple-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="transactionHistory"></tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderSecuritySection() {
        return `
            <div class="settings-section">
                <h3>Security Settings</h3>
                
                <div class="security-option">
                    <div class="security-info">
                        <h4>Two-Factor Authentication</h4>
                        <p>Add an extra layer of security to your account</p>
                    </div>
                    <button class="btn btn-outline" onclick="Settings.enable2FA()">Enable 2FA</button>
                </div>
                
                <div class="security-option">
                    <div class="security-info">
                        <h4>Login Sessions</h4>
                        <p>Manage devices where you're logged in</p>
                    </div>
                    <button class="btn btn-outline" onclick="Settings.viewSessions()">View Sessions</button>
                </div>
                
                <div class="security-option">
                    <div class="security-info">
                        <h4>Login History</h4>
                        <p>Review recent login activity</p>
                    </div>
                    <button class="btn btn-outline" onclick="Settings.viewLoginHistory()">View History</button>
                </div>
                
                <div class="security-option">
                    <div class="security-info">
                        <h4>Connected Apps</h4>
                        <p>Manage third-party app access</p>
                    </div>
                    <button class="btn btn-outline" onclick="Settings.viewConnectedApps()">Manage Apps</button>
                </div>
            </div>
        `;
    },

    async loadUserData() {
        try {
            const user = JSON.parse(localStorage.getItem('pm_user'));
            
            document.getElementById('displayName').value = user.name || '';
            document.getElementById('username').value = user.username || '';
            document.getElementById('bio').value = user.bio || '';
            document.getElementById('bioCount').textContent = `${(user.bio || '').length}/160`;
            document.getElementById('website').value = user.website || '';
            document.getElementById('location').value = user.location || '';
            
            // Update character count
            document.getElementById('bio').addEventListener('input', (e) => {
                document.getElementById('bioCount').textContent = `${e.target.value.length}/160`;
            });
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    },

    async loadSAWallet() {
        try {
            const response = await fetch('/api/sa/wallet', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('pm_token')}` }
            });
            const data = await response.json();

            document.getElementById('saBalance').textContent = `${data.balance} SA`;
            document.getElementById('saUSDValue').textContent = `$${(data.balance / 100).toFixed(2)}`;
            document.getElementById('todayEarnings').textContent = `${data.todayEarnings} SA`;
            document.getElementById('lifetimeEarned').textContent = `${data.lifetimeEarned} SA`;
            document.getElementById('todayProgress').textContent = `${data.todayEarnings}/80 SA`;
            document.getElementById('todayProgressFill').style.width = `${(data.todayEarnings / 80) * 100}%`;

            // Load transaction history
            this.loadTransactionHistory();
        } catch (error) {
            console.error('Failed to load SA wallet:', error);
        }
    },

    async loadTransactionHistory() {
        try {
            const response = await fetch('/api/sa/transactions', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('pm_token')}` }
            });
            const transactions = await response.json();

            const tbody = document.getElementById('transactionHistory');
            tbody.innerHTML = transactions.map(t => `
                <tr>
                    <td>${new Date(t.createdAt).toLocaleDateString()}</td>
                    <td>${t.type}</td>
                    <td class="${t.amount > 0 ? 'positive' : 'negative'}">
                        ${t.amount > 0 ? '+' : ''}${t.amount} SA
                    </td>
                    <td><span class="status-badge ${t.status}">${t.status}</span></td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Failed to load transactions:', error);
        }
    },

    async saveProfile() {
        const profileData = {
            name: document.getElementById('displayName').value,
            username: document.getElementById('username').value,
            bio: document.getElementById('bio').value,
            website: document.getElementById('website').value,
            location: document.getElementById('location').value
        };

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('pm_token')}`
                },
                body: JSON.stringify(profileData)
            });

            if (response.ok) {
                alert('Profile updated successfully!');
                
                // Update local storage
                const user = JSON.parse(localStorage.getItem('pm_user'));
                Object.assign(user, profileData);
                localStorage.setItem('pm_user', JSON.stringify(user));
            }
        } catch (error) {
            console.error('Failed to save profile:', error);
            alert('Failed to save profile. Please try again.');
        }
    },

    async requestWithdrawal() {
        const amount = document.getElementById('withdrawAmount').value;
        const method = document.getElementById('withdrawMethod').value;

        if (!amount || amount < 500) {
            alert('Minimum withdrawal is 500 SA ($5)');
            return;
        }

        const user = JSON.parse(localStorage.getItem('pm_user'));
        if (user.saBalance < amount) {
            alert('Insufficient SA balance');
            return;
        }

        if (!confirm(`Withdraw ${amount} SA ($${(amount/100).toFixed(2)}) via ${method}?`)) {
            return;
        }

        try {
            const response = await fetch('/api/sa/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('pm_token')}`
                },
                body: JSON.stringify({ amount, method })
            });

            if (response.ok) {
                alert('Withdrawal request submitted successfully!');
                this.loadSAWallet();
            }
        } catch (error) {
            console.error('Withdrawal failed:', error);
            alert('Withdrawal failed. Please try again.');
        }
    },

    deleteAccount() {
        if (!confirm('Are you absolutely sure? This will permanently delete your account and all data.')) {
            return;
        }

        if (!confirm('This action cannot be undone. Type "DELETE" to confirm.')) {
            return;
        }

        // Proceed with account deletion
        fetch('/api/users/delete', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('pm_token')}`
            }
        }).then(() => {
            localStorage.clear();
            window.location.href = '/';
        }).catch(error => {
            console.error('Failed to delete account:', error);
            alert('Failed to delete account. Please contact support.');
        });
    }
};
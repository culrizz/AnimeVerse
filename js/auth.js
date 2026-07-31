// Authentication Manager
class AuthManager {
    constructor() {
        this.isLoginPage = window.location.pathname.includes('login.html');
        this.isRegisterPage = window.location.pathname.includes('register.html');
        this.init();
    }
    
    init() {
        // Redirect if already logged in
        if (Auth.isLoggedIn() && (this.isLoginPage || this.isRegisterPage)) {
            window.location.href = 'profile.html';
            return;
        }
        
        if (this.isLoginPage) {
            this.setupLoginForm();
        }
        
        if (this.isRegisterPage) {
            this.setupRegisterForm();
        }
        
        this.setupPasswordToggles();
    }
    
    // ==================== Login Form ====================
    setupLoginForm() {
        const form = document.getElementById('loginForm');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
        
        // Real-time validation
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        
        emailInput?.addEventListener('input', () => this.validateEmail(emailInput));
        passwordInput?.addEventListener('input', () => this.validatePassword(passwordInput));
    }
    
    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe')?.checked;
        const submitBtn = document.getElementById('loginSubmitBtn');
        
        // Validate
        if (!this.validateEmail(document.getElementById('loginEmail'))) return;
        if (!this.validatePassword(document.getElementById('loginPassword'))) return;
        
        // Show loading
        this.setButtonLoading(submitBtn, true);
        this.hideError();
        
        // Simulate network delay
        await this.delay(800);
        
        // Attempt login
        const result = Auth.login(email, password);
        
        if (result.error) {
            this.showError(result.error);
            this.setButtonLoading(submitBtn, false);
            return;
        }
        
        // Success
        this.showSuccess('login');
        this.setButtonLoading(submitBtn, false);
        
        // Redirect after delay
        setTimeout(() => {
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'profile.html';
            window.location.href = redirectUrl;
        }, 1500);
    }
    
    // ==================== Register Form ====================
    setupRegisterForm() {
        const form = document.getElementById('registerForm');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });
        
        // Real-time validation
        const usernameInput = document.getElementById('registerUsername');
        const emailInput = document.getElementById('registerEmail');
        const passwordInput = document.getElementById('registerPassword');
        const confirmInput = document.getElementById('registerConfirmPassword');
        
        usernameInput?.addEventListener('input', () => this.validateUsername(usernameInput));
        emailInput?.addEventListener('input', () => this.validateEmail(emailInput));
        passwordInput?.addEventListener('input', () => {
            this.validatePassword(passwordInput);
            this.checkPasswordStrength(passwordInput.value);
            if (confirmInput.value) {
                this.validatePasswordMatch(passwordInput, confirmInput);
            }
        });
        confirmInput?.addEventListener('input', () => {
            this.validatePasswordMatch(passwordInput, confirmInput);
        });
    }
    
    async handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms')?.checked;
        const submitBtn = document.getElementById('registerSubmitBtn');
        
        // Validate all fields
        let isValid = true;
        
        if (!this.validateUsername(document.getElementById('registerUsername'))) isValid = false;
        if (!this.validateEmail(document.getElementById('registerEmail'))) isValid = false;
        if (!this.validatePassword(document.getElementById('registerPassword'))) isValid = false;
        if (!this.validatePasswordMatch(
            document.getElementById('registerPassword'),
            document.getElementById('registerConfirmPassword')
        )) isValid = false;
        
        if (!agreeTerms) {
            this.showError('Please agree to the Terms of Service and Privacy Policy');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Show loading
        this.setButtonLoading(submitBtn, true);
        this.hideError();
        
        // Simulate network delay
        await this.delay(1000);
        
        // Attempt registration
        const result = Auth.register(username, email, password);
        
        if (result.error) {
            this.showError(result.error);
            this.setButtonLoading(submitBtn, false);
            return;
        }
        
        // Success
        this.showSuccess('register');
        this.setButtonLoading(submitBtn, false);
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1500);
    }
    
    // ==================== Validation ====================
    validateUsername(input) {
        if (!input) return false;
        
        const value = input.value.trim();
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        
        if (!value) {
            this.setInputState(input, 'error', 'Username is required');
            return false;
        }
        
        if (value.length < 3) {
            this.setInputState(input, 'error', 'Username must be at least 3 characters');
            return false;
        }
        
        if (!usernameRegex.test(value)) {
            this.setInputState(input, 'error', 'Only letters, numbers, and underscores allowed');
            return false;
        }
        
        this.setInputState(input, 'success');
        return true;
    }
    
    validateEmail(input) {
        if (!input) return false;
        
        const value = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!value) {
            this.setInputState(input, 'error', 'Email is required');
            return false;
        }
        
        if (!emailRegex.test(value)) {
            this.setInputState(input, 'error', 'Please enter a valid email');
            return false;
        }
        
        this.setInputState(input, 'success');
        return true;
    }
    
    validatePassword(input) {
        if (!input) return false;
        
        const value = input.value;
        
        if (!value) {
            this.setInputState(input, 'error', 'Password is required');
            return false;
        }
        
        if (value.length < 6) {
            this.setInputState(input, 'error', 'Password must be at least 6 characters');
            return false;
        }
        
        this.setInputState(input, 'success');
        return true;
    }
    
    validatePasswordMatch(passwordInput, confirmInput) {
        if (!confirmInput) return false;
        
        const password = passwordInput.value;
        const confirm = confirmInput.value;
        const errorSpan = document.getElementById('confirmPasswordError');
        
        if (!confirm) {
            this.setInputState(confirmInput, 'error', 'Please confirm your password');
            return false;
        }
        
        if (password !== confirm) {
            this.setInputState(confirmInput, 'error', 'Passwords do not match');
            return false;
        }
        
        this.setInputState(confirmInput, 'success');
        return true;
    }
    
    setInputState(input, state, message) {
        // Remove existing states
        input.classList.remove('error', 'success');
        
        // Remove existing error messages
        const existingError = input.parentElement.parentElement.querySelector('.form-error');
        if (existingError) existingError.remove();
        
        if (state === 'error') {
            input.classList.add('error');
            if (message) {
                const errorEl = document.createElement('span');
                errorEl.className = 'form-error';
                errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
                input.parentElement.after(errorEl);
            }
        } else if (state === 'success') {
            input.classList.add('success');
        }
    }
    
    checkPasswordStrength(password) {
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');
        
        if (!strengthBar || !strengthText) return;
        
        let score = 0;
        
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        // Remove all classes
        strengthBar.className = 'strength-bar';
        strengthText.className = 'strength-text';
        
        if (score <= 1) {
            strengthBar.classList.add('weak');
            strengthText.classList.add('weak');
            strengthText.textContent = 'Weak password';
        } else if (score === 2) {
            strengthBar.classList.add('fair');
            strengthText.classList.add('fair');
            strengthText.textContent = 'Fair password';
        } else if (score === 3) {
            strengthBar.classList.add('good');
            strengthText.classList.add('good');
            strengthText.textContent = 'Good password';
        } else {
            strengthBar.classList.add('strong');
            strengthText.classList.add('strong');
            strengthText.textContent = 'Strong password!';
        }
    }
    
    // ==================== Password Toggle ====================
    setupPasswordToggles() {
        const toggles = document.querySelectorAll('.password-toggle');
        
        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const input = toggle.parentElement.querySelector('input');
                const icon = toggle.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        });
    }
    
    // ==================== UI Helpers ====================
    showError(message) {
        const errorId = this.isLoginPage ? 'loginError' : 'registerError';
        const messageId = this.isLoginPage ? 'loginErrorMessage' : 'registerErrorMessage';
        
        const errorEl = document.getElementById(errorId);
        const messageEl = document.getElementById(messageId);
        
        if (errorEl && messageEl) {
            messageEl.textContent = message;
            errorEl.style.display = 'flex';
            
            // Hide after 5 seconds
            setTimeout(() => {
                errorEl.style.display = 'none';
            }, 5000);
        }
    }
    
    hideError() {
        const errorId = this.isLoginPage ? 'loginError' : 'registerError';
        const errorEl = document.getElementById(errorId);
        if (errorEl) errorEl.style.display = 'none';
    }
    
    showSuccess(type) {
        const successId = type === 'login' ? 'loginSuccess' : 'registerSuccess';
        const successEl = document.getElementById(successId);
        if (successEl) successEl.style.display = 'flex';
    }
    
    setButtonLoading(btn, isLoading) {
        if (!btn) return;
        
        if (isLoading) {
            btn.classList.add('btn-loading');
            btn.disabled = true;
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-spinner fa-spin';
            }
            btn.childNodes[btn.childNodes.length - 1].textContent = 
                this.isLoginPage ? ' Logging in...' : ' Creating account...';
        } else {
            btn.classList.remove('btn-loading');
            btn.disabled = false;
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = this.isLoginPage ? 'fas fa-sign-in-alt' : 'fas fa-user-plus';
            }
            btn.childNodes[btn.childNodes.length - 1].textContent = 
                this.isLoginPage ? ' Login' : ' Create Account';
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize auth manager
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('login.html') || 
        window.location.pathname.includes('register.html')) {
        new AuthManager();
    }
    
    // Update user avatar in navbar if logged in
    const user = Auth.getCurrentUser();
    const userAvatar = document.getElementById('userAvatar');
    
    if (user && userAvatar) {
        userAvatar.src = user.avatar || 'assets/images/avatars/default.png';
        userAvatar.onclick = () => window.location.href = 'profile.html';
        userAvatar.title = user.username;
    }
});

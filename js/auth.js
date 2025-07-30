// js/auth.js
import * as api from './services/api.js';
import { saveToken, getToken } from './utils/session.js';

document.addEventListener('DOMContentLoaded', () => {
    if (getToken()) {
        window.location.href = '/dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessageDiv = document.getElementById('errorMessage');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const spinner = submitButton.querySelector('.spinner-border');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        spinner.classList.remove('d-none');
        submitButton.disabled = true;
        errorMessageDiv.classList.add('d-none');

        const username = usernameInput.value;
        const password = passwordInput.value;

        try {
            const data = await api.login(username, password);
            if (data && data.status === 'success' && data.data && data.data.token) {
                saveToken(data.data.token);
                window.location.href = '/dashboard.html';
            } else {
                throw new Error(data.message || 'Invalid server response.');
            }
        } catch (error) {
            errorMessageDiv.textContent = error.message;
            errorMessageDiv.classList.remove('d-none');
        } finally {
            spinner.classList.add('d-none');
            submitButton.disabled = false;
        }
    });
});
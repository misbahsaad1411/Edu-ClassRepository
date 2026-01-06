const { VALID_EMAIL_DOMAIN, MIN_PASSWORD_LENGTH } = require('../config/constants');

const validateEmail = (email) => {
    // Basic regex for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Check format AND domain
    return emailRegex.test(email) && email.endsWith(VALID_EMAIL_DOMAIN);
};

const validatePassword = (password) => {
    // [FIX] Use a fallback of 6 if the constant is undefined
    const minLength = MIN_PASSWORD_LENGTH || 6;
    return password.length >= minLength;
};

const validateFormData = (data, requiredFields) => {
    for (const field of requiredFields) {
        if (!data[field] || data[field].toString().trim() === '') {
            return { valid: false, error: `${field} is required` };
        }
    }
    return { valid: true };
};

module.exports = {
    validateEmail,
    validatePassword,
    validateFormData
};

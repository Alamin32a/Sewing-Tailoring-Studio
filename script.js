/* Patel Sewing Studio — Enhanced Script */

const CONTACT_ENDPOINT = 'contact.php';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_LIMITS = {
    name: 120,
    phone: 30,
    email: 254,
    service: 120,
    message: 4000,
};

const FORM_MESSAGES = {
    required: 'Please fill in the required fields.',
    email: 'Please enter a valid email address.',
    sending: 'Sending your message...',
    success: 'Thanks! Your message has been sent successfully.',
    failure: 'Sorry, we could not send your message right now. Please try again or contact us directly.',
    invalid: 'Please review the highlighted fields and try again.',
    empty: 'Please complete the form before sending.',
};

function sanitizeValue(value, maxLength) {
    return value.toString().replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

function setFieldError(field, messageEl, message) {
    if (!field || !messageEl) return;
    field.classList.toggle('error', Boolean(message));
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    messageEl.textContent = message || '';
}

function clearFormErrors(fields) {
    Object.values(fields).forEach(({
        field,
        messageEl
    }) => setFieldError(field, messageEl, ''));
}

function getFieldValues(form) {
    const data = new FormData(form);
    return {
        name: sanitizeValue(data.get('name') || '', FIELD_LIMITS.name),
        phone: sanitizeValue(data.get('phone') || '', FIELD_LIMITS.phone),
        email: sanitizeValue(data.get('email') || '', FIELD_LIMITS.email),
        service: sanitizeValue(data.get('service') || '', FIELD_LIMITS.service),
        message: sanitizeValue(data.get('message') || '', FIELD_LIMITS.message),
    };
}

function setStatus(statusEl, message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle('error', isError);
}

function setSubmitting(form, button, submitting) {
    if (button) {
        button.disabled = submitting;
        button.textContent = submitting ? 'Sending...' : 'Send Request';
    }
    if (form) {
        form.setAttribute('aria-busy', submitting ? 'true' : 'false');
    }
}

function validateFields(values, fieldMap) {
    let hasError = false;

    if (!values.name) {
        setFieldError(fieldMap.name.field, fieldMap.name.messageEl, 'Please enter your name.');
        hasError = true;
    }

    if (!values.email) {
        setFieldError(fieldMap.email.field, fieldMap.email.messageEl, 'Please enter your email address.');
        hasError = true;
    } else if (!EMAIL_REGEX.test(values.email)) {
        setFieldError(fieldMap.email.field, fieldMap.email.messageEl, FORM_MESSAGES.email);
        hasError = true;
    }

    if (!values.message) {
        setFieldError(fieldMap.message.field, fieldMap.message.messageEl, 'Please enter a message.');
        hasError = true;
    }

    return !hasError;
}

function buildSubmissionSummary(values) {
    const submittedDate = new Date().toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
    });

    const lines = [
        'New Contact Form Submission',
        '',
        `Name: ${values.name}`,
        '',
        `Email: ${values.email}`,
        '',
        `Phone: ${values.phone || 'Not provided'}`,
        '',
        `Service: ${values.service || 'Not specified'}`,
        '',
        'Message:',
        values.message,
        '',
        `Submitted: ${submittedDate}`,
    ];

    return {
        submittedDate,
        fullMessage: lines.join('\n')
    };
}

// ── Mobile nav toggle ──
const navToggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('.menu');
if (navToggle && menu) {
    navToggle.addEventListener('click', () => {
        const open = menu.classList.toggle('show');
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.textContent = open ? 'Close' : 'Menu';
    });
    document.addEventListener('click', e => {
        if (!navToggle.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('show');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.textContent = 'Menu';
        }
    });
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('show');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.textContent = 'Menu';
        });
    });
}

// ── Active nav highlight on scroll ──
const sections = document.querySelectorAll('section[id], #faqs');
const navLinks = document.querySelectorAll('.menu a[href^="#"]');
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(l => l.classList.remove('active'));
            const active = document.querySelector(`.menu a[href="#${entry.target.id}"]`);
            if (active) active.classList.add('active');
        }
    });
}, {
    threshold: 0.35
});
sections.forEach(s => observer.observe(s));

// ── Scroll to top button ──
const scrollBtn = document.getElementById('scrollTop');
if (scrollBtn) {
    window.addEventListener('scroll', () => {
        scrollBtn.classList.toggle('visible', window.scrollY > 400);
    }, {
        passive: true
    });
    scrollBtn.addEventListener('click', () => window.scrollTo({
        top: 0,
        behavior: 'smooth'
    }));
}

// ── Contact form ──
const form = document.getElementById('quoteForm');
const statusEl = document.getElementById('formStatus');
const submitButton = form ? .querySelector('button[type="submit"]') || null;
const fieldMap = {
    name: {
        field: document.getElementById('name'),
        messageEl: document.getElementById('nameError')
    },
    phone: {
        field: document.getElementById('phone'),
        messageEl: document.getElementById('phoneError')
    },
    email: {
        field: document.getElementById('email'),
        messageEl: document.getElementById('emailError')
    },
    message: {
        field: document.getElementById('message'),
        messageEl: document.getElementById('messageError')
    },
};

if (form) {
    form.addEventListener('submit', async event => {
        event.preventDefault();

        const values = getFieldValues(form);
        clearFormErrors(fieldMap);
        setStatus(statusEl, '');

        if (!values.name && !values.email && !values.message && !values.phone && !values.service) {
            setStatus(statusEl, FORM_MESSAGES.empty, true);
            return;
        }

        if (!validateFields(values, fieldMap)) {
            setStatus(statusEl, FORM_MESSAGES.invalid, true);
            return;
        }

        const submitted = buildSubmissionSummary(values);
        const payload = {
            name: values.name,
            email: values.email,
            phone: values.phone,
            service: values.service,
            message: values.message,
            submitted_on: submitted.submittedDate,
            full_message: submitted.fullMessage,
        };

        const body = new FormData();
        Object.entries(payload).forEach(([key, value]) => body.append(key, value));

        try {
            setSubmitting(form, submitButton, true);
            setStatus(statusEl, FORM_MESSAGES.sending);

            const response = await fetch(CONTACT_ENDPOINT, {
                method: 'POST',
                body,
                headers: {
                    'X-Requested-With': 'fetch'
                },
            });

            const contentType = response.headers.get('content-type') || '';
            const data = contentType.includes('application/json') ? await response.json() : null;

            if (!response.ok || !data) {
                throw new Error(data ? .message || FORM_MESSAGES.failure);
            }

            if (!data.success) {
                throw new Error(data.message || FORM_MESSAGES.failure);
            }

            form.reset();
            clearFormErrors(fieldMap);
            setStatus(statusEl, data.message || FORM_MESSAGES.success);
        } catch (error) {
            console.error('Contact form submission failed:', error);
            setStatus(statusEl, error.message || FORM_MESSAGES.failure, true);
        } finally {
            setSubmitting(form, submitButton, false);
        }
    });
}

// ── Footer year ──
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── Privacy modal ──
document.getElementById('privacy-link') ? .addEventListener('click', e => {
    e.preventDefault();
    alert('Privacy Policy\n\nWe only use your contact details to respond to your inquiry. We do not sell, share, or distribute your personal data to any third parties.');
});

// ── Card hover animation (scroll reveal) ──
if ('IntersectionObserver' in window) {
    const cards = document.querySelectorAll('.service-card, .benefit-item, .steps li, .process-badge, .review-card, .gallery-card, form, .contact-info-card');
    const fadeIn = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                fadeIn.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(18px)';
        card.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
        fadeIn.observe(card);
    });
}
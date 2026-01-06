// Frontend API Client
const API = '/api';

// ============= AUTH HELPERS =============
const getToken = () => localStorage.getItem('token');
const getUser = () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
};
const isLoggedIn = () => !!getToken();

const logout = () => {
    localStorage.clear();
    location.href = 'index.html';
};

const checkAuth = () => {
    if (!isLoggedIn()) {
        location.href = 'index.html';
        return null;
    }
    return getUser();
};

// ============= API HELPER =============
const api = async (endpoint, options = {}) => {
    const token = getToken();
    const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options
    };
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    
    try {
        const res = await fetch(`${API}${endpoint}`, config);
        return await res.json();
    } catch (err) {
        console.error('API Error:', err);
        return { error: 'Connection failed' };
    }
};

// ============= LOGIN PAGE =============
let userType = 'student';

const setUserType = (type) => {
    userType = type;
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    const notice = document.getElementById('admin-notice');
    const footer = document.getElementById('login-footer');
    if (type === 'admin') {
        notice?.classList.remove('hidden');
        footer?.classList.add('hidden');
    } else {
        notice?.classList.add('hidden');
        footer?.classList.remove('hidden');
    }
};

const showError = (msg) => {
    const el = document.getElementById('error-message');
    if (el) {
        el.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        el.classList.remove('hidden');
    }
};

const showSignupForm = () => {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
    document.getElementById('login-footer').classList.add('hidden');
    document.getElementById('signup-footer').classList.remove('hidden');
    document.getElementById('login-toggle').classList.add('hidden');
    document.getElementById('form-title').textContent = 'Create Account';
    document.getElementById('form-subtitle').textContent = 'Register as a new student';
    document.getElementById('error-message').classList.add('hidden');
};

const showLoginForm = () => {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('login-footer').classList.remove('hidden');
    document.getElementById('signup-footer').classList.add('hidden');
    document.getElementById('login-toggle').classList.remove('hidden');
    document.getElementById('form-title').textContent = 'Get Started';
    document.getElementById('form-subtitle').textContent = 'Sign in to access notes and resources';
    document.getElementById('error-message').classList.add('hidden');
};

const handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // [LOGIC UPDATE]
    // If user is Admin, allow ANY email (Gmail, etc.).
    // If user is Student, REQUIRE @eastdelta.edu.bd
    if (userType !== 'admin' && !email.endsWith('@eastdelta.edu.bd')) {
        return showError('Use your @eastdelta.edu.bd email');
    }
    
    const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, userType })
    });
    
    // This catches "Please verify your email" errors from the backend
    if (data.error) return showError(data.error);
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect based on role
    if (data.user.role === 'admin') {
        location.href = 'admin.html';
    } else {
        location.href = 'dashboard.html';
    }
};

const handleSignup = async (e) => {
    e.preventDefault();
    const form = {
        name: document.getElementById('signup-name').value.trim(),
        student_id: document.getElementById('signup-studentid').value.trim(),
        gender: document.getElementById('signup-gender').value,
        department: document.getElementById('signup-dept').value,
        semester: document.getElementById('signup-semester')?.value || '',
        email: document.getElementById('signup-email').value.trim(),
        password: document.getElementById('signup-password').value,
        confirm: document.getElementById('signup-confirm').value
    };
    
    // Strict check for students signing up
    if (!form.email.endsWith('@eastdelta.edu.bd')) {
        return showError('Use your @eastdelta.edu.bd email');
    }
    if (form.password.length < 6) {
        return showError('Password must be at least 6 characters');
    }
    if (form.password !== form.confirm) {
        return showError('Passwords do not match');
    }
    
    const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form)
    });
    
    if (data.error) return showError(data.error);
    
    alert('Account created! Please check your email to verify.');
    showLoginForm();
};

const togglePassword = (inputId, btn) => {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
};

// ============= COURSES =============
const loadCourses = async () => await api('/courses');
const loadEnrollments = async () => await api('/enrollments');

const enrollCourse = async (id) => {
    const data = await api('/enrollments', {
        method: 'POST',
        body: JSON.stringify({ courseId: id })
    });
    if (data.error) {
        alert(data.error);
        return false;
    }
    alert('Enrolled successfully!');
    return true;
};

const unenrollCourse = async (id) => {
    if (!confirm('Unenroll from this course?')) return false;
    await api(`/enrollments/${id}`, { method: 'DELETE' });
    alert('Unenrolled');
    return true;
};

const deleteCourse = async (id) => {
    if (!confirm('Delete this course?')) return false;
    await api(`/courses/${id}`, { method: 'DELETE' });
    alert('Course deleted');
    return true;
};

const createCourse = async (code, title, dept, instructor) => {
    return await api('/courses', {
        method: 'POST',
        body: JSON.stringify({ code, title, department: dept, instructor })
    });
};

// ============= FILES =============
const loadCourseFiles = async (courseId) => await api(`/files/${courseId}`);
const loadPendingFiles = async () => await api('/files/pending/all');

const approveFile = async (id) => {
    const data = await api(`/files/${id}/approve`, { method: 'PUT' });
    return !data.error;
};

const rejectFile = async (id) => {
    if (!confirm('Reject and delete this file?')) return false;
    const data = await api(`/files/${id}/reject`, { method: 'DELETE' });
    return !data.error;
};

const deleteFile = async (id) => {
    if (!confirm('Delete this file?')) return false;
    await api(`/files/${id}`, { method: 'DELETE' });
    return true;
};

const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        pdf: { class: 'pdf', icon: 'fa-file-pdf' },
        doc: { class: 'doc', icon: 'fa-file-word' },
        docx: { class: 'doc', icon: 'fa-file-word' },
        ppt: { class: 'ppt', icon: 'fa-file-powerpoint' },
        pptx: { class: 'ppt', icon: 'fa-file-powerpoint' },
        xls: { class: 'xls', icon: 'fa-file-excel' },
        xlsx: { class: 'xls', icon: 'fa-file-excel' },
        jpg: { class: 'image', icon: 'fa-file-image' },
        png: { class: 'image', icon: 'fa-file-image' },
        zip: { class: 'zip', icon: 'fa-file-archive' }
    };
    return icons[ext] || { class: 'default', icon: 'fa-file' };
};

// ============= UI HELPERS =============
const loadHeader = () => {
    const user = getUser();
    if (!user) return;
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Admin' : 'Student';
};

const loadSidebar = (active) => {
    const user = getUser();
    const isAdmin = user?.role === 'admin';
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    sidebar.innerHTML = `
        <ul class="nav-menu">
            <li><a href="dashboard.html" class="${active === 'dashboard' ? 'active' : ''}"><i class="fas fa-th-large"></i> Dashboard</a></li>
            ${!isAdmin ? `<li><a href="my-courses.html" class="${active === 'my-courses' ? 'active' : ''}"><i class="fas fa-book"></i> My Courses</a></li>` : ''}
            ${isAdmin ? `<li><a href="admin.html" class="${active === 'admin' ? 'active' : ''}"><i class="fas fa-tasks"></i> Pending Approvals</a></li>` : ''}
            <div class="nav-divider"></div>
            <li><a href="settings.html" class="${active === 'settings' ? 'active' : ''}"><i class="fas fa-cog"></i> Settings</a></li>
            <li><a href="#" onclick="logout()"><i class="fas fa-sign-out-alt" style="color:var(--danger)"></i><span style="color:var(--danger)">Logout</span></a></li>
        </ul>
    `;
};

const openModal = (id) => document.getElementById(id)?.classList.add('active');
const closeModal = (id) => document.getElementById(id)?.classList.remove('active');

window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
};
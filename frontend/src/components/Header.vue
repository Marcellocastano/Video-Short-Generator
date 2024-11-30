<template>
    <header class="header">
        <div class="header-content">
            <div class="logo">
                <img src="../assets/logo.png" alt="Logo" width="200" />
            </div>
            <nav class="nav-menu">
                <router-link to="/login" class="nav-link login"
                    >Login</router-link
                >
            </nav>
        </div>
    </header>
</template>

<script>
    export default {
        name: 'Header',
    };
</script>

<style scoped>
    .header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        padding: 1rem 0;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        border-bottom: 1px solid var(--glass-border);
        box-shadow:
            0 4px 24px -1px var(--glass-shadow),
            inset 0 1px 0 0 var(--glass-highlight);
    }

    .header-content {
        max-width: 90vw;
        margin: 0 auto;
        padding: 0 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .logo h1 {
        color: var(--text-color);
        font-size: 2rem;
        font-weight: bold;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin: 0;
    }

    .nav-menu {
        display: flex;
        gap: 2rem;
        align-items: center;
    }

    .nav-link {
        color: var(--text-color);
        text-decoration: none;
        font-size: 1.1rem;
        padding: 0.5rem 1rem;
        border-radius: 12px;
        transition: all 0.3s ease;
        position: relative;
    }

    .nav-link::before {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 50%;
        width: 0;
        height: 2px;
        background: var(--gradient-start);
        transition: all 0.3s ease;
        transform: translateX(-50%);
    }

    .nav-link:hover::before {
        width: 80%;
    }

    .nav-link.router-link-active::before {
        width: 80%;
    }

    .login {
        background: var(--glass-bg);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        border: 1px solid var(--glass-border);
        box-shadow:
            0 4px 16px -2px var(--glass-shadow),
            inset 0 1px 0 0 var(--glass-highlight);
        padding: 0.5rem 1.5rem;
    }

    .login:hover {
        transform: translateY(-2px);
        box-shadow:
            0 6px 20px -4px var(--glass-shadow),
            inset 0 1px 0 0 var(--glass-highlight);
    }

    @media (max-width: 768px) {
        .nav-menu {
            display: none; /* Per dispositivi mobili dovremmo aggiungere un menu hamburger */
        }
    }
</style>

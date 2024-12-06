<template>
    <div class="sidebar" :class="{ collapsed: isCollapsed }">
        <div class="toggle-btn" @click="toggleSidebar">
            <i
                class="fas"
                :class="isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"
            ></i>
        </div>

        <nav class="menu">
            <router-link
                to="/generate"
                class="menu-item"
                :title="isCollapsed ? 'Genera Video' : ''"
            >
                <i class="fas fa-video"></i>
                <span v-if="!isCollapsed">Genera</span>
            </router-link>

            <router-link
                to="/collection"
                class="menu-item"
                :title="isCollapsed ? 'Raccolta Video' : ''"
            >
                <i class="fas fa-film"></i>
                <span v-if="!isCollapsed">Raccolta</span>
            </router-link>
        </nav>
    </div>
</template>

<script>
    export default {
        name: 'Sidebar',
        data() {
            return {
                isCollapsed: false,
            };
        },
        methods: {
            toggleSidebar() {
                this.isCollapsed = !this.isCollapsed;
            },
        },
    };
</script>

<style scoped>
    .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        color: white;
        width: var(--sidebar-width);
        z-index: 1000;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        border-right: 1px solid rgba(255, 255, 255, 0.18);
        background: linear-gradient(
            135deg,
            var(--gradient-start),
            var(--gradient-middle),
            var(--gradient-end)
        );
        transition: all 0.3s ease;
    }

    .sidebar.collapsed {
        width: var(--sidebar-width-collapsed);
    }

    .toggle-btn {
        position: absolute;
        right: -20px;
        top: 20px;
        background: #f0f0f0e6;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.18);
    }

    .menu {
        padding: 20px 0;
        margin-top: 40px;
    }

    .menu-item {
        display: flex;
        align-items: center;
        padding: 30px 30px;
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        transition: all 0.3s ease;
        border-left: 3px solid transparent;
    }

    .menu-item:hover {
        background: rgba(255, 255, 255, 0.1);
        border-left: 3px solid rgba(255, 255, 255, 0.5);
    }

    .menu-item.router-link-active {
        background: rgba(255, 255, 255, 0.15);
        border-left: 3px solid white;
    }

    .menu-item i {
        width: 20px;
        text-align: center;
        margin-right: 15px;
        opacity: 0.9;
        color: #092862;
    }

    .menu-item span {
        color: #092862;
        font-size: 18px;
    }

    .collapsed .menu-item i {
        margin-right: 0;
    }

    .menu-item span {
        white-space: nowrap;
        opacity: 0.9;
        transition: opacity 0.3s ease;
        font-weight: 500;
    }

    /* Effetto hover sul testo */
    .menu-item:hover span,
    .menu-item:hover i {
        opacity: 1;
    }
</style>

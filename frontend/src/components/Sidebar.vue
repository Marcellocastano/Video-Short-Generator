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
                <span v-if="!isCollapsed">Genera Video</span>
            </router-link>

            <router-link
                to="/collection"
                class="menu-item"
                :title="isCollapsed ? 'Raccolta Video' : ''"
            >
                <i class="fas fa-film"></i>
                <span v-if="!isCollapsed">Raccolta Video</span>
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
        background: rgba(40, 44, 52, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        color: white;
        width: var(--sidebar-width);
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        border-right: 1px solid rgba(255, 255, 255, 0.18);
    }

    .sidebar.collapsed {
        width: var(--sidebar-width-collapsed);
    }

    .toggle-btn {
        position: absolute;
        right: -12px;
        top: 20px;
        background: rgba(40, 44, 52, 0.9);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        width: 24px;
        height: 24px;
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
        padding: 15px 20px;
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

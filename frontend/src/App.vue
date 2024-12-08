<script setup>
    import { ref } from 'vue';
    import Sidebar from './components/Sidebar.vue';

    const isSidebarCollapsed = ref(false);

    const toggleSidebar = () => {
        isSidebarCollapsed.value = !isSidebarCollapsed.value;
    };
</script>

<template>
    <div class="app">
        <Sidebar :is-collapsed="isSidebarCollapsed" @toggle="toggleSidebar" />
        <div
            class="content-wrapper"
            :class="{ 'sidebar-collapsed': isSidebarCollapsed }"
        >
            <router-view />
        </div>
    </div>
</template>

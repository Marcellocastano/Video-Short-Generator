<script setup>
    import { ref } from 'vue';
    import Sidebar from './components/Sidebar.vue';
    import { VApp, VMain, VContainer } from 'vuetify/components';

    const isSidebarCollapsed = ref(false);

    const toggleSidebar = () => {
        isSidebarCollapsed.value = !isSidebarCollapsed.value;
    };
</script>

<template>
    <VApp>
        <Sidebar :is-collapsed="isSidebarCollapsed" @toggle="toggleSidebar" />
        <VMain>
            <VContainer
                fluid
                :class="{ 'sidebar-collapsed': isSidebarCollapsed }"
            >
                <router-view />
            </VContainer>
        </VMain>
    </VApp>
</template>

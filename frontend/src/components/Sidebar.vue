<template>
    <v-navigation-drawer
        v-model="drawer"
        :rail="isCollapsed"
        permanent
        color="primary"
        class="rounded-e-lg"
    >
        <div class="toggle-wrapper">
            <v-btn
                :icon="isCollapsed ? 'mdi-chevron-right' : 'mdi-chevron-left'"
                variant="text"
                @click="toggleSidebar"
                color="white"
                class="toggle-btn"
                density="comfortable"
            />
        </div>

        <v-list>
            <v-list-item
                to="/generate"
                prepend-icon="mdi-video"
                :tooltip="isCollapsed ? 'Genera Video' : ''"
                class="mb-2 custom-list-item"
                active-color="transparent"
                :ripple="false"
            >
                <template v-slot:prepend>
                    <v-icon color="white">mdi-video</v-icon>
                </template>
                <v-list-item-title class="text-white">Genera</v-list-item-title>
            </v-list-item>

            <v-list-item
                to="/collection"
                prepend-icon="mdi-filmstrip"
                :tooltip="isCollapsed ? 'Raccolta Video' : ''"
                class="mb-2 custom-list-item"
                active-color="transparent"
                :ripple="false"
            >
                <template v-slot:prepend>
                    <v-icon color="white">mdi-filmstrip</v-icon>
                </template>
                <v-list-item-title class="text-white"
                    >Raccolta</v-list-item-title
                >
            </v-list-item>
        </v-list>
    </v-navigation-drawer>
</template>

<script setup>
    import { ref, computed } from 'vue';

    const drawer = ref(true);
    const isCollapsed = ref(false);

    const toggleSidebar = () => {
        isCollapsed.value = !isCollapsed.value;
    };
</script>

<style scoped>
    .toggle-wrapper {
        position: relative;
        height: 64px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding-right: 12px;
    }

    .toggle-btn {
        border-radius: 50% !important;
        background: rgba(255, 255, 255, 0.1);
    }

    .toggle-btn:hover {
        background: rgba(255, 255, 255, 0.15) !important;
    }

    .custom-list-item {
        transition: all 0.3s ease;
        border-left: 3px solid transparent;
    }

    .custom-list-item:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        border-left: 3px solid rgba(255, 255, 255, 0.7);
    }

    .custom-list-item.v-list-item--active {
        background: rgba(255, 255, 255, 0.15) !important;
        border-left: 3px solid white;
    }

    :deep(.v-list-item__prepend) {
        opacity: 0.9;
    }

    :deep(.v-list-item__content) {
        opacity: 0.9;
    }

    .custom-list-item:hover :deep(.v-list-item__prepend),
    .custom-list-item:hover :deep(.v-list-item__content) {
        opacity: 1;
    }
</style>

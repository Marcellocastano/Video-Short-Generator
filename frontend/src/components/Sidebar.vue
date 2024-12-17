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
            <div v-if="!isCollapsed" class="logo-container">
                <img src="../assets/logo.png" alt="Logo" />
            </div>
            <div v-else class="logo-container-collapsed">
                <img src="../assets/favicon.png" alt="Logo" />
            </div>
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

        <template v-slot:append>
            <div class="d-flex justify-center pa-2">
                <template v-if="isCollapsed">
                    <v-btn
                        :icon="
                            isDark ? 'mdi-weather-night' : 'mdi-weather-sunny'
                        "
                        variant="text"
                        color="white"
                        density="comfortable"
                        @click="toggleTheme"
                        class="theme-btn"
                    />
                </template>
                <template v-else>
                    <v-switch
                        v-model="isDark"
                        color="white"
                        hide-details
                        class="theme-switch"
                        density="compact"
                    >
                        <template v-slot:prepend>
                            <v-icon color="white" size="small">
                                mdi-weather-sunny
                            </v-icon>
                        </template>
                        <template v-slot:append>
                            <v-icon color="white" size="small">
                                mdi-weather-night
                            </v-icon>
                        </template>
                    </v-switch>
                </template>
            </div>
        </template>
    </v-navigation-drawer>
</template>

<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { useTheme } from 'vuetify';

    const theme = useTheme();
    const drawer = ref(true);
    const isCollapsed = ref(
        localStorage.getItem('sidebarCollapsed') === 'true'
    );

    // Initialize theme from localStorage or default to dark
    onMounted(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        theme.global.name.value = savedTheme;
    });

    const isDark = computed({
        get: () => theme.global.current.value.dark,
        set: value => {
            theme.global.name.value = value ? 'dark' : 'light';
            localStorage.setItem('theme', value ? 'dark' : 'light');
        },
    });

    const toggleSidebar = () => {
        isCollapsed.value = !isCollapsed.value;
        localStorage.setItem('sidebarCollapsed', isCollapsed.value.toString());
    };

    const toggleTheme = () => {
        isDark.value = !isDark.value;
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

    .theme-btn {
        background: rgba(255, 255, 255, 0.1);
    }

    .theme-btn:hover {
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

    :deep(.theme-switch .v-switch__track) {
        opacity: 0.3;
    }

    :deep(.theme-switch .v-switch__thumb) {
        color: white;
    }
</style>

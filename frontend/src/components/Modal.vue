<template>
    <v-dialog
        :model-value="show"
        @update:model-value="$emit('update:show', $event)"
        :fullscreen="fullscreen"
        :width="width"
        :persistent="persistent"
        :scrim="false"
        :transition="transition"
    >
        <v-card :class="{ 'modal-fullheight': fullheight }">
            <!-- Header Slot o Default Header -->
            <v-toolbar
                v-if="!hideHeader"
                :color="headerColor"
                :dark="darkHeader"
            >
                <slot name="header">
                    <v-toolbar-title>{{ title }}</v-toolbar-title>
                </slot>
                <v-spacer></v-spacer>
                <slot name="header-actions">
                    <v-btn v-if="!hideCloseButton" icon @click="close">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </slot>
            </v-toolbar>

            <!-- Content Slot -->
            <v-card-text :class="contentClass">
                <slot></slot>
            </v-card-text>

            <!-- Footer Slot -->
            <v-card-actions v-if="$slots.footer">
                <slot name="footer"></slot>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
    const props = defineProps({
        // Visibilità
        show: {
            type: Boolean,
            required: true,
        },

        // Layout
        fullscreen: {
            type: Boolean,
            default: false,
        },
        fullheight: {
            type: Boolean,
            default: false,
        },
        width: {
            type: [Number, String],
            default: 'auto',
        },
        contentClass: {
            type: String,
            default: 'pa-4',
        },

        // Comportamento
        persistent: {
            type: Boolean,
            default: false,
        },
        hideCloseButton: {
            type: Boolean,
            default: false,
        },

        // Header
        title: {
            type: String,
            default: '',
        },
        hideHeader: {
            type: Boolean,
            default: false,
        },
        headerColor: {
            type: String,
            default: 'primary',
        },
        darkHeader: {
            type: Boolean,
            default: true,
        },

        // Animazione
        transition: {
            type: String,
            default: 'dialog-transition',
        },
    });

    const emit = defineEmits(['update:show', 'close']);

    const close = () => {
        emit('update:show', false);
        emit('close');
    };
</script>

<style scoped>
    .modal-fullheight {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .modal-fullheight .v-card-text {
        flex: 1;
        overflow-y: auto;
    }
</style>

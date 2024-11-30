import { createRouter, createWebHistory } from "vue-router";

const routes = [
    {
        path: "/",
        redirect: "/generate"
    },
    {
        path: "/generate",
        name: "Generate",
        component: () => import("../views/Generate.vue"),
    },
    {
        path: "/collection",
        name: "VideoCollection",
        component: () => import("../views/VideoCollection.vue"),
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL || ''),
    routes,
});

export default router;

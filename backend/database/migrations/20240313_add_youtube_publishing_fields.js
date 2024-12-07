/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
    return knex.schema.alterTable('videos', function (table) {
        // Status della pubblicazione (draft, scheduled, published)
        table.string('publish_status').defaultTo('draft');
        // Privacy status su YouTube (private, unlisted, public)
        table.string('youtube_privacy').defaultTo('private');
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
    return knex.schema.alterTable('videos', function (table) {
        table.dropColumn('publish_status');
        table.dropColumn('youtube_privacy');
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
    return knex.schema.alterTable('videos', function (table) {
        table.string('title', 100).nullable();
        table.text('description').nullable();
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
    return knex.schema.alterTable('videos', function (table) {
        table.dropColumn('title');
        table.dropColumn('description');
    });
}

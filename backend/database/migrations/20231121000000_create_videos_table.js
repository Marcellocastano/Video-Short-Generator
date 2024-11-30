export const up = function(knex) {
  return knex.schema.createTable('videos', table => {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.string('file_path').notNullable();
    table.string('status').defaultTo('pending'); // pending, uploaded, published
    table.datetime('publish_at');
    table.string('youtube_id');
    table.json('metadata'); // per hashtag, privacy settings, etc.
    table.timestamps(true, true);
  });
};

export const down = function(knex) {
  return knex.schema.dropTable('videos');
};

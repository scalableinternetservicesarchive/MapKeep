class AddCollections < ActiveRecord::Migration
  def self.up
    create_table :collections do |t|
      t.integer :album_id
      t.integer :note_id

      t.timestamps
    end
  end

  def self.down
    drop_table :collections
  end
end
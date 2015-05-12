class AddStars < ActiveRecord::Migration
  def self.up
    create_table :stars do |t|
      t.integer :user_id
      t.integer :note_id

      t.timestamps
    end

    add_index  :stars, [:note_id, :user_id], :unique => true
  end

  def self.down
    drop_table :stars
  end
end

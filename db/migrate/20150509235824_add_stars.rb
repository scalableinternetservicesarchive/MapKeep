class AddStars < ActiveRecord::Migration
  def self.up
    create_table :stars do |t|
      t.integer :user_id
      t.integer :note_id

      t.timestamps
    end
  end

  def self.down
    drop_table :stars
  end
end

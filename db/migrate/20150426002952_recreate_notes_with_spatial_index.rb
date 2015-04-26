class RecreateNotesWithSpatialIndex < ActiveRecord::Migration
  def up
    drop_table :notes

    create_table :notes, :options => 'ENGINE=MyISAM' do |t|
      t.string :title
      t.string :body
      t.decimal :latitude, precision: 9, scale: 6
      t.decimal :longitude, precision: 9, scale: 6

      t.timestamps null: false
    end

    add_reference :notes, :user, index: true, foreign_key: true

    # Add spatial indexing on a point (lat, lng)
    execute 'ALTER TABLE notes ADD pt POINT NOT NULL;'
    execute 'ALTER TABLE notes ADD SPATIAL INDEX (pt);'
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end

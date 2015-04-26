class RecreateNotesWithSpatialIndex < ActiveRecord::Migration
  def up
    drop_table :notes if table_exists?(:notes)

    create_table :notes, :options => 'ENGINE=MyISAM' do |t|
      t.string :title
      t.string :body
      t.float :latitude, limit: 53, numericality: true
      t.float :longitude, limit: 53, numericality: true
      t.column :latlon, :point, null: false
      t.timestamps null: false
    end

    add_index :notes, :latlon, spatial: true
    add_reference :notes, :user, index: true, foreign_key: true
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end

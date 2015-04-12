class CreateNotes < ActiveRecord::Migration
  def change
    create_table :notes do |t|
      t.string :title
      t.string :body
      t.decimal :latitude
      t.decimal :longitude

      t.timestamps null: false
    end
  end
end

class CreateNotes < ActiveRecord::Migration
  def change
    create_table :notes do |t|
      t.string :title
      t.string :body
      t.decimal :latitude
      t.decimal :longitude

      t.references :user_id, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end

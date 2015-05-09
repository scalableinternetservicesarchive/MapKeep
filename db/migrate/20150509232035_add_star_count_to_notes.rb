class AddStarCountToNotes < ActiveRecord::Migration
  def change
    add_column :notes, :star_count, :integer, :default => 0
  end
end

class ChangeLatLngFormatInNotes < ActiveRecord::Migration
  def change
    change_column :notes, :latitude, :decimal, { :precision => 9, :scale => 6 }
    change_column :notes, :longitude, :decimal, { :precision => 9, :scale => 6 }
  end
end

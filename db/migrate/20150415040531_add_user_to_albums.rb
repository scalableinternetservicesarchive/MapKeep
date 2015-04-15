class AddUserToAlbums < ActiveRecord::Migration
  def change
    add_reference :albums, :user, index: true, foreign_key: true
  end
end
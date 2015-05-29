json.extract! @note, :id, :title, :body, :user_id, :latitude, :longitude
json.albums @note.albums.select([ :id, :title ])
json.starred current_user.starred_notes.exists?(:id => @note.id)

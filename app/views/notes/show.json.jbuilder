json.extract! @note, :id, :title, :body, :user_id, :latitude, :longitude
json.albums @note.albums, :id, :title

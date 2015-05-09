json.extract! @note, :id, :title, :body, :user_id
json.albums @note.albums, :id, :title

json.extract! @note, :id, :title, :body, :created_at, :updated_at
json.albums @note.albums, :id, :title

module NotesHelper
  def cache_key_for_notes
    count          = current_user.notes.count
    max_updated_at = current_user.notes.maximum(:updated_at).try(:utc).try(:to_s, :number)
    "notes/all-#{count}-#{max_updated_at}"
  end
end

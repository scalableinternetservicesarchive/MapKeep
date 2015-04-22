class Collection < ActiveRecord::Base
  belongs_to :album
  belongs_to :note

  validates :album_id, :note_id, presence: true
end
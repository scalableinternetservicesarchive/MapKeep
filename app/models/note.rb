class Note < ActiveRecord::Base
  belongs_to :user
  has_many :collections, :dependent => :destroy
  has_many :albums, :through => :collections

  validates :title, :body, :user_id, presence: true
  validates :latitude, :longitude, :user_id, numericality: true
end

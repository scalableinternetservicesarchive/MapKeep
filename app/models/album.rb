class Album < ActiveRecord::Base
  belongs_to :user
  has_many :notes, :through => :collections
  has_many :collections, :dependent => :destroy

  validates :title, :description, presence: true
  validates :user_id, numericality: true
end

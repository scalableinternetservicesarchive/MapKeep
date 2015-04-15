class Album < ActiveRecord::Base
  has_many :notes, :through => :collections
  belongs_to :user
end

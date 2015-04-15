class Album < ActiveRecord::Base
  belongs_to :user
  has_many :notes, :through => :collections
  has_many :collections, :dependent => :destroy
end

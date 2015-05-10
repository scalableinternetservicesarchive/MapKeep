class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable

  has_many :notes, dependent: :destroy
  has_many :albums, dependent: :destroy

  has_many :starred_notes, :through => :stars, :source => :notes
  has_many :stars, :dependent => :destroy
end

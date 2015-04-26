class Note < ActiveRecord::Base
  belongs_to :user
  has_many :collections, :dependent => :destroy
  has_many :albums, :through => :collections

  # By default, use the GEOS implementation for spatial columns.
  self.rgeo_factory_generator = RGeo::Geos.method(:factory)

  # But use a geographic implementation for the :latlon column.
  set_rgeo_factory_for_column(:latlon, RGeo::Geographic.spherical_factory)

  validates :title, :body, :user_id, presence: true
  validates :latitude, :longitude, :user_id, numericality: true
end

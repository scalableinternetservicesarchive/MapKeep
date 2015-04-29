class Note < ActiveRecord::Base
  belongs_to :user
  has_many :collections, :dependent => :destroy
  has_many :albums, :through => :collections
  before_save :set_point
  before_update :set_point

  # By default, use the GEOS implementation for spatial columns.
  self.rgeo_factory_generator = RGeo::Geos.method(:factory)

  # But use a geographic implementation for the :latlon column.
  set_rgeo_factory_for_column(:latlon, RGeo::Geographic.spherical_factory)

  validates :title, :body, :user_id, presence: true
  validates :latitude, :longitude, :user_id, numericality: true

  def set_point
    self[:latlon] = RGeo::Geographic.spherical_factory(:srid => 4326)
                        .point(self[:longitude], self[:latitude])
  end
end

class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  before_action :random_auth

  def random_auth
  	# This value should be similar to the seed values
  	max_users = 25
  	user = User.find_by(email: "example_#{rand(max_users)+1}@example.com")
  	sign_in user
  end
end

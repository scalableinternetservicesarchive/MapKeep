class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  before_action :random_auth

  def random_auth
  	# This value should be similar to the seed values
  	max_users = 25
  	rng = Random.new
  	user_id = rng.rand(max_users)
	user = User.find(user_id)
	sign_in user
  end
end

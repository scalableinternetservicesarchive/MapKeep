class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  before_action :random_auth

  def random_auth
 	if session[:is_logged] == nil
 		user = User.where('email LIKE ?', '%example_%').all.sample
 		sign_in user
 		session[:is_logged] = true
  	end
  end
end

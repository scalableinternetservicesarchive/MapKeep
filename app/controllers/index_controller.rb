class IndexController < ApplicationController
  def index
    @notes = current_user.notes unless current_user.nil?
  end
end

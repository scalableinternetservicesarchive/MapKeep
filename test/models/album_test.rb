require 'test_helper'

class AlbumTest < ActiveSupport::TestCase

  test 'has valid factory' do
    assert build(:album).valid?
  end

  test 'needs non-empty title' do
    assert build(:album, title: '').invalid?
  end

  test 'needs non-empty description' do
    assert build(:album, description: '').invalid?
  end

  test 'needs valid user id' do
    assert build(:album, user_id: 'user').invalid?
    assert build(:album, user_id: 1).valid?
  end
end

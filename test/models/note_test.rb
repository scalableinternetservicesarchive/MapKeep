require 'test_helper'

class NoteTest < ActiveSupport::TestCase

  test 'has valid factory' do
    assert build(:note).valid?
  end

  test 'must have decimal coordinates' do
    assert build(:note, latitude: 'lat', longitude: 'lat').invalid?
    assert build(:note, latitude: 'lat').invalid?
    assert build(:note, longitude: 'lat').invalid?
  end

  test 'needs valid user id' do
    assert build(:note, user_id: nil).invalid?
    assert build(:note, user_id: 'user').invalid?
  end

  test 'requires none-mpty title' do
    assert build(:note, title: '').invalid?
  end

  test 'requires non-empty body' do
    assert build(:note, body: '').invalid?
  end
end

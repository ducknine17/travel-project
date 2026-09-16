import unittest
from unittest.mock import patch, Mock
from pydantic import ValidationError
from fastapi import HTTPException
from main import update_profile
from util.body import ProfileUpdate
from place_filter import search_places, AccessibilityFilter
from place_detail import get_place_detail, fetch_detail, _cache
from tests.test_character_settings import FakeConnection
from tests.test_place_filter import FakeConnection as PlaceConnection, FakeCursor
import requests

class FeedbackTest(unittest.TestCase):
    def test_profile_updates_only_authenticated_uid(self):
        con = FakeConnection()
        with patch('main.db.connect', return_value=con):
            result = update_profile(ProfileUpdate(display_name='  여행자  ', avatar='abc.png'), 'uid-1')
        self.assertEqual(con.cursor_value.executions[0][1], ('여행자', 'abc.png', 'uid-1'))
        self.assertEqual(result['display_name'], '여행자')
        self.assertTrue(con.committed)

    def test_blank_name_and_remote_avatar_are_rejected(self):
        with self.assertRaises(ValidationError):
            ProfileUpdate(display_name='여행자', avatar='https://example.com/photo.png')
        with self.assertRaises(HTTPException):
            update_profile(ProfileUpdate(display_name='   '), 'uid-1')

    def test_category_facility_search_and_pagination_are_combined(self):
        cur = FakeCursor()
        with patch('place_filter.db.connect', return_value=PlaceConnection(cur)):
            search_places([AccessibilityFilter.parking], 2, 30, '서울', 'forest')
        self.assertEqual(cur.executions[1][1], ('forest', ['parking'], '%서울%', '%서울%', 30, 30))

    def test_missing_place_does_not_call_tourism_api(self):
        con = Mock()
        with patch('place_detail.db.connect', return_value=con), patch('place_detail.db.executeQuery', return_value=[]), patch('place_detail.fetch_detail') as upstream:
            self.assertIsNone(get_place_detail('missing'))
        upstream.assert_not_called()
        con.close.assert_called_once()

    def test_upstream_failure_returns_explicit_empty_detail(self):
        _cache.clear()
        with patch('place_detail.get_service_key', return_value='test'), patch('place_detail.requests.get', side_effect=requests.Timeout):
            result = fetch_detail('123')
        self.assertFalse(result['detail_available'])
        self.assertEqual(result['photos'], [])

    def test_detail_is_plain_text_and_deduplicates_photos(self):
        _cache.clear()
        response = Mock()
        response.json.return_value = {'response': {'body': {'items': {'item': [{'overview':'<b>산책</b> &amp; 휴식', 'firstimage':'https://example.com/a.jpg', 'firstimage2':'https://example.com/a.jpg', 'parking':'주차장 없음'}]}}}}
        with patch('place_detail.get_service_key', return_value='test'), patch('place_detail.requests.get', return_value=response):
            result = fetch_detail('123')
        self.assertEqual(result['overview'], '산책  & 휴식')
        self.assertEqual(len(result['photos']), 1)
        self.assertEqual(result['facilities'][0]['description'], '주차장 없음')

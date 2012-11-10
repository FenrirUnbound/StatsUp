from google.appengine.ext import db

class Score(db.Model):
    year = db.IntegerProperty()
    week = db.IntegerProperty()
    away_name = db.StringProperty()
    away_score = db.IntegerProperty()
    home_name = db.StringProperty()
    home_score = db.IntegerProperty()
    game_clock = db.StringProperty()
    game_day = db.StringProperty()
    game_status = db.StringProperty()
    game_time = db.StringProperty()
    game_id = db.IntegerProperty()
    spread_odds = db.FloatProperty()
    spread_margin = db.FloatProperty()
    timestamp = db.DateTimeProperty()
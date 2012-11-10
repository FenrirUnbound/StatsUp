from google.appengine.ext import db

class Spread(db.Model):
    year = db.IntegerProperty()
    week = db.IntegerProperty()
    game_id = db.IntegerProperty()
    person = db.StringProperty()
    team_name = db.StringProperty()
    margin = db.IntegerProperty()
    total_score = db.IntegerProperty()
    
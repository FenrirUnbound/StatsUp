from google.appengine.ext import db

class Spread(db.Model):
    year = db.IntegerProperty()
    week = db.IntegerProperty()
    person = db.StringProperty()
    team_name = db.StringProperty()
    over_under = db.StringProperty()
    total_score = db.IntegerProperty(default=0)
    
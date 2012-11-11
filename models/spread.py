from google.appengine.ext import db

class Spread(db.Model):
    year = db.IntegerProperty()
    week = db.IntegerProperty()
    person = db.StringProperty()
    team_name = db.StringProperty()
    margin = db.IntegerProperty(default=0)
    total_score = db.IntegerProperty(default=0)
    
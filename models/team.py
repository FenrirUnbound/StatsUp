from google.appengine.ext import db

class Team(db.Model):
    name = db.StringProperty()
    year = db.IntegerProperty()
    offense_passing = db.IntegerProperty()
    offense_rushing = db.IntegerProperty()
    offense_first_down = db.IntegerProperty()
    defense_passing = db.IntegerProperty()
    defense_rushing = db.IntegerProperty()
    defense_first_down = db.IntegerProperty()
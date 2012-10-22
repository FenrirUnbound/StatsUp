#! /usr/bin/env python

import datetime
import json
import logging
import webapp2

from google.appengine.api import urlfetch
from google.appengine.ext.webapp.util import run_wsgi_app
from models.score import Score

AWAY_NAME = 4
AWAY_SCORE = 5
DEFAULT_YEAR = 2012
GAME_CLOCK = 3
GAME_DAY = 0
GAME_ID = 10
GAME_STATUS = 2
GAME_TIME = 1
HTTP_OK = 200
HOME_NAME = 6
HOME_SCORE = 7
URL_SCOREBOARD = 'http://www.nfl.com/liveupdate/scorestrip/scorestrip.json'

class MainPage(webapp2.RequestHandler):
    def get(self):
        scores = {}
        result = {}
        to_save = self.request.get('save')
        
        if to_save is None or len(to_save) == 0:
            pass
        else:
            scores = json.loads(self._fetch_scores())['ss']
            week = self._get_default_week()
            self._save_scores(week, scores)
            result = {'success': 'true'}

        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.out.write(json.dumps(result, indent = 4))

    def _fetch_scores(self):
        response = {}
        result = {}
        rpc = urlfetch.create_rpc()

        urlfetch.make_fetch_call(rpc, URL_SCOREBOARD)
        try:
            response = rpc.get_result()
            if response.status_code == HTTP_OK:
                counter = 100
                length = 0
                text = response.content

                while length != text.__len__():
                    length = text.__len__()
                    text = text.replace(',,', ',0,')
                    
                    # Prevent infinite loops
                    if counter != 0:
                        counter -= 1
                    else:
                        break

                result = text
            else:
                result = {
                    'status_code': response.status_code
                    }
        except urlfetch.DownloadError:
            result = {
                'Error': 'An unexpected error occurred.'
                }

        return result

    def _get_default_week(self):
        week_one = datetime.datetime(2012, 9, 5, 0, 0, 0)
        current = datetime.datetime.now()
        
        delta = current - week_one
        
        return ((delta.days / 7) + 1)

    def _save_scores(self, week, scores):
        query = Score.all()
        scorebox = {}
        result = {}

        query.filter('week =', week)
        result = query.fetch(25)

        if len(result) <= 0:
            # Completely new save
            for game in scores:
                scorebox = Score(
                    year = DEFAULT_YEAR,
                    week = week,
                    away_name = game[AWAY_NAME].encode('ascii', 'ignore'),
                    away_score = int(game[AWAY_SCORE]),
                    game_clock = str(game[GAME_CLOCK]),
                    game_day = game[GAME_DAY].encode('ascii', 'ignore'),
                    game_id = int(game[GAME_ID]),
                    game_status = game[GAME_STATUS],
                    game_time = game[GAME_TIME],
                    home_name = game[HOME_NAME].encode('ascii', 'ignore'),
                    home_score = int(game[HOME_SCORE]),
                    timestamp = datetime.datetime.now()
                    )

                scorebox.put()
        else:
            current = {}
            for scorebox in result:
                # Find the related game score
                for game in scores:
                    if game[AWAY_NAME] == scorebox.away_name:
                        current = game
                        break

                key = scorebox.key()
                matchup = Score.get(key)

                # Update
                matchup.away_score = int(current[AWAY_SCORE])
                matchup.home_score = int(current[HOME_SCORE])
                matchup.game_clock = str(current[GAME_CLOCK])
                matchup.game_status = current[GAME_STATUS]
                matchup.timestamp = datetime.datetime.now()
                
                #Push update
                matchup.put()

app = webapp2.WSGIApplication([('/scores', MainPage)],
                              debug=True)

def main():
    run_wsgi_app(app)

if __name__ == "__main__":
    main()
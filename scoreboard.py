#! /usr/bin/env python

import json
import logging
import webapp2

from google.appengine.api import urlfetch
from google.appengine.ext import db
from google.appengine.ext.webapp.util import run_wsgi_app
from models.score import Score

AWAY_NAME = 4
AWAY_SCORE = 5
GAME_STATUS = 2
HOME_NAME = 6
HOME_SCORE = 7

class MainPage(webapp2.RequestHandler):
    def get(self):
        result = {}
        toSave = self.request.get('save')
        
        if toSave:
            logging.info('save')
            self._save_scores(2012, 2)
        else:  
            result = self._fetch_scores()
    
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.out.write(json.dumps(result, indent = 4))

    def _check_db(self, season, week):
        query = Score.all()
        query.filter('week =', week)
        query_result = query.fetch(50)
        
        #logging.info(query_result)

    def _fetch_scores(self):
        rpc = urlfetch.create_rpc()
        scores = {}
        urlfetch.make_fetch_call(rpc, 'http://www.nfl.com/liveupdate/scorestrip/scorestrip.json')

        self._check_db(2012, 2)

        try:
            result = rpc.get_result()
            if result.status_code == 200:
                counter = 100
                length = 0
                text = result.content

                while length != text.__len__():
                    length = text.__len__()
                    #text = text.replace(',,', ',')
                    text = text.replace(',,', ',0,')

                    # Prevent infinite loops
                    if counter != 0:
                        counter -= 1
                    else:
                        break

                scores = text
        except urlfetch.DownloadError:
            scores = {"Error": "An unexpected error occured"}

        return scores

    def _save_scores(self, season_year, season_week):
        scores = json.loads(self._fetch_scores())

        for game in scores['ss']:
            score = Score(
                year = season_year,
                week = season_week,
                away_name = game[AWAY_NAME],
                away_score = game[AWAY_SCORE],
                home_name = game[HOME_NAME],
                home_score = game[HOME_SCORE])
            

app = webapp2.WSGIApplication([('/scoreboard', MainPage)],
                              debug=True)

def main():
    run_wsgi_app(app)

if __name__ == "__main__":
    main()
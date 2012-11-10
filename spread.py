#! /usr/bin/env python

import datetime
import json
import lib.constants as constants
import logging
import webapp2

from google.appengine.ext.webapp.util import run_wsgi_app
from models.score import Score
from models.spread import Spread

class MainPage(webapp2.RequestHandler):
    def get(self):
        result = {}
        week = self.request.get('week')
        
        # Check parameters
        if week is None or len(week) == 0:
            week = self._get_current_week()

        result = self._query_database(week)
        if result is None or len(result) == 0:
            logging.info('empty')
            pass
        else:
            # Format the data for client consumption
            result = self._format_query(result)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.out.write(json.dumps(result, indent = 4))

    def post(self):
        result = {}
        players = self.request.arguments()
        content = self.request.get('content')
        
        # Format the data into something more convenient to consume
        for person in players:
            result[person] = [
                self.request.get(person)
            ]
        
        #logging.info(result)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.out.write(json.dumps(result, indent = 4))

    def _get_current_week(self):
        current = datetime.datetime.now()
        delta = current - constants.WEEK_ONE
        
        return ((delta.days / 7) + 1)

    # TODO: This
    def _format_query(self, query):
        result = []
        return result

    def _query_database(self, week):
        query = {}
        result = {}
        
        query = Spread.all()
        query.filter('week =', week)

        result = query.fetch(constants.QUERY_LIMIT)
        return result

app = webapp2.WSGIApplication([('/spread', MainPage)],
                              debug=True)

def main():
    run_wsgi_app(app)

if __name__ == "__main__":
    main()
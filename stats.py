#! /usr/bin/env python

import json
import logging
import unicodedata
import webapp2

from google.appengine.ext import db
from google.appengine.ext.webapp.util import run_wsgi_app
from models.team import Team

class MainPage(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        
        result = self._fetch_stats()
        self.response.out.write(json.dumps(result, indent = 4))

    def _fetch_stats(self):
        result = {}
        query = Team.all()
        query.filter('name !=', 'Testing Team')
        query_result = query.fetch(50)
        
        for team in query_result:
            name = (team.name).encode('ascii', 'ignore')

            if name not in result:
                result[name] = {}
            if 'offense' not in result[name]:
                result[name]['offense'] = {}
            if 'defense' not in result[name]:
                result[name]['defense'] = {}

            offense = result[name]['offense']
            offense['pass'] = int(team.offense_passing)
            offense['rush'] = int(team.offense_rushing)
            offense['first_down'] = int(team.offense_first_down)

            defense = result[name]['defense']
            defense['pass'] = int(team.defense_passing)
            defense['rush'] = int(team.defense_rushing)
            defense['first_down'] = int(team.defense_first_down)
        
        return result

app = webapp2.WSGIApplication([('/stats', MainPage)],
                              debug=True)

def main():
    run_wsgi_app(app)

if __name__ == "__main__":
    main()
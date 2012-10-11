#! /usr/bin/env python

import datetime
import json
import logging
import webapp2

from google.appengine.api import urlfetch
from google.appengine.ext.webapp.util import run_wsgi_app
from lib.drive import Drive

HTTP_OK = 200
URL_SCOREBOARD = 'http://www.nfl.com/liveupdate/scorestrip/scorestrip.json'

class MainPage(webapp2.RequestHandler):
    def get(self):
        result = {}
        scores = {}
        spread = {}
        spreadsheet = ''
        worksheet = ''

        scores = json.loads(self._fetch_scores())
        spread = self._fetch_spread(spreadsheet, worksheet)

        result['odds'] = spread['odds']
        result['margin'] = spread['margin']
        result['scoreboard'] = scores['ss']
        result['spread'] = spread['spread']

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

    def _fetch_spread(self, spreadsheet, worksheet):
        drive = Drive()
        margin = {}
        odds = 0
        result = {}
        selections = {}
        spread = {}

        # Default values
        if spreadsheet is None or len(spreadsheet) == 0:
            spreadsheet = (drive.list_spreadsheets())[0]
        if worksheet is None or len(worksheet) == 0:
            worksheet = 'Sheet1'

        data = drive.get_data(spreadsheet, worksheet)
        # Get each individual's spread choices
        for i in data:
            current = data[i]
            header = current[0]

            # Skip the labels
            if 'GAME' in header or 'WEEK' in header:
                continue

            # 1: offset. 3: season-long information
            selections[header] = current[1+3:]

        # Parse for spread data
        last_team = ''
        over_under = 0
        for team in data[2][5:]:
            # Skip day-name labels
            if 'DAY' in team:
                continue
            # Save the over/under margin
            if 'OVER' in team:
                index = team.index(' ')

                over_under = int(team[index:-3])
                over_under = (over_under + 0.5)
                
                margin[last_team] = over_under
                
                continue
            # Skip total points tally
            if 'TOTAL' in team:
                continue

            # Detect for underdog
            if team[0] == '_':
                spread[team[1:].upper()] = (odds * -1)
            else:
                #Format is: "TEAMNAME-12345 1/2"
                deliminator = team.index('-')

                odds = int(team[deliminator:-3])
                odds = (odds - 0.5)
                
                last_team = team[:deliminator].upper()
                
                spread[last_team] = odds

        # Format the result
        result['spread'] = selections
        result['odds'] = spread
        result['margin'] = margin
        
        return result

app = webapp2.WSGIApplication([('/spread', MainPage)],
                              debug=True)

def main():
    run_wsgi_app(app)

if __name__ == "__main__":
    main()
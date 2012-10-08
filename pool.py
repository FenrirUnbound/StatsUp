#! /usr/bin/env python

import json
import logging
import unicodedata
import webapp2

from google.appengine.ext import db
from google.appengine.ext.webapp.util import run_wsgi_app
from lib.drive import Drive
from models.team import Team

class MainPage(webapp2.RequestHandler):
    def get(self):
        drive = Drive()
        margin = {}
        odds = 0
        result = {}
        selections = {}
        spread = {}
        spreadsheet = self.request.get('spreadsheet_name')
        worksheet = self.request.get('worksheet_name')

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

        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.out.write(json.dumps(result, indent = 4))      

app = webapp2.WSGIApplication([('/pool', MainPage)],
                              debug=True)

def main():
    run_wsgi_app(app)

if __name__ == "__main__":
    main()
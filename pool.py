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
        odds = []
        result = {}
        spreadsheet = self.request.get('spreadsheet_name')
        worksheet = self.request.get('worksheet_name')

        # Default values
        if spreadsheet is None or len(spreadsheet) == 0:
            spreadsheet = (drive.list_spreadsheets())[0]
        if worksheet is None or len(worksheet) == 0:
            worksheet = 'Sheet1'

        data = drive.get_data(spreadsheet, worksheet)
        for i in data:
            current = data[i]
            header = current[0]

            # Skip the labels
            if 'GAME' in header or 'WEEK' in header:
                continue

            # 1: offset. 3: season-long information
            result[header] = current[1+3:]

        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.out.write(json.dumps(result, indent = 4))      

app = webapp2.WSGIApplication([('/pool', MainPage)],
                              debug=True)

def main():
    run_wsgi_app(app)

if __name__ == "__main__":
    main()
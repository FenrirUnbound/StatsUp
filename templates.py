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
        
        iFile = open('views/templates.html')
        result = iFile.read()
        self.response.out.write(result)

app = webapp2.WSGIApplication([('/templates', MainPage)],
                              debug=True)

def main():
    run_wsgi_app(app)

if __name__ == "__main__":
    main()
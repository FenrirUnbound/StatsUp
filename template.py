#! /usr/bin/env python

import webapp2

from google.appengine.ext.webapp.util import run_wsgi_app

class MainPage(webapp2.RequestHandler):
    def get(self):
        result = {}

        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.out.write(json.dumps(result, indent = 4))

app = webapp2.WSGIApplication([('/scoreboard', MainPage)],
                              debug=True)

def main():
    run_wsgi_app(app)

if __name__ == "__main__":
    main()
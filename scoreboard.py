#! /usr/bin/env python

import logging
import webapp2

from google.appengine.api import urlfetch
from google.appengine.ext import db
from google.appengine.ext.webapp.util import run_wsgi_app
from models.team import Team

class MainPage(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        
        rpc = urlfetch.create_rpc()
        urlfetch.make_fetch_call(rpc, 'http://www.nfl.com/liveupdate/scorestrip/scorestrip.json')

        try:
            result = rpc.get_result()
            if result.status_code == 200:
                counter = 100
                length = 0
                text = result.content

                while length != text.__len__():
                    length = text.__len__()
                    text = text.replace(',,', ',')

                    # Prevent infinite loops
                    if counter != 0:
                        counter -= 1
                    else:
                        break

                self.response.out.write(text)
        except urlfetch.DownloadError:
            self.response.out.write('Error')

app = webapp2.WSGIApplication([('/scoreboard', MainPage)],
                              debug=True)

def main():
    run_wsgi_app(app)

if __name__ == "__main__":
    main()
#! /usr/bin/env python

import datetime
import json
import logging
import webapp2

from google.appengine.api import urlfetch
from google.appengine.ext.webapp.util import run_wsgi_app
from lib.drive import Drive
from models.score import Score

# Week 1 == Sept 5, 2012
AWAY_NAME = 4
AWAY_SCORE = 5
DAYS = {
    'MON': 1,
    'TUE': 2,
    'WED': 3,
    'THU': 4,
    'FRI': 5,
    'SAT': 6,
    'SUN': 0
    }
DEFAULT_WEEK = 6  #For testing purposes only
DEFAULT_YEAR = 2012
GAME_CLOCK = 3
GAME_DAY = 0
GAME_ID = 10
GAME_STATUS = 2
GAME_TIME = 1
HTTP_OK = 200
HOME_NAME = 6
HOME_SCORE = 7
THRESHOLD = 5
URL_SCOREBOARD = 'http://www.nfl.com/liveupdate/scorestrip/scorestrip.json'
UTC_OFFSET = -4

class MainPage(webapp2.RequestHandler):
    def get(self):
        result = {}
        scores = {}
        spread = {}
        spreadsheet = self.request.get('spreadsheet_name')
        week = self.request.get('week')
        worksheet = self.request.get('worksheet_name')

        # Check incoming parameters
        if week is None or len(week) == 0:
            week = self._get_default_week()

        scores = self._query_scores(week)
        # Check how stale the score is
        if self._is_update_required(scores):
            scores = json.loads(self._fetch_scores())['ss']
            self._save_scores(week, scores)
        else:
            # Format the data for client consumption
            scores = self._format_scores(scores)

        spread = self._fetch_spread(spreadsheet, worksheet)

        # Load the return object with the appropriate data
        result['odds'] = spread['odds']
        result['margin'] = spread['margin']
        result['scoreboard'] = scores
        result['spread'] = spread['spread']

        # TODO: scores might need pre-formatting
        result['scoreboard'] = scores

        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.out.write(json.dumps(result, indent = 4))

    def _is_update_required(self, scores):
        if len(scores) > 0:
            #Shouldn't update if we're querying an archived week
            if scores[0].week != self._get_default_week():
                return False

            today = datetime.datetime.now()
            for game in scores:
                # today is a gameday
                if today.weekday() == DAYS[game.game_day.upper()]:
                    offset = 12   # !!! Assume all games are in the afternoon
                    index = game.game_time.index(':')
                    game_hour = int(game.game_time[:index]) + offset
                    game_minute = int(game.game_time[(index+1):])

                    # Check if the game has already started
                    if game_hour > (today.hour + UTC_OFFSET):
                        # Don't fetch if the game is over
                        if 'Final' in game.game_status:
                            continue
                        elif 'final' in game.game_status:
                            continue

                        # Check if timestamp is stale
                        time_delta = today - game.timestamp
                        if time_delta >= datetime.timedelta(minutes=THRESHOLD):
                            return True
                    elif game_hour == (today.hour + UTC_OFFSET):
                        if game_minute >= today.minute:
                            # It's hard to believe a game is less than an hour
                            # Check if timestamp is stale

                            time_delta = today - game.timestamp
                            threshold = datetime.timedelta(minutes=THRESHOLD)
                            if time_delta >= threshold:
                                return True
                else:
                    # Only update if the timestamp is stale by at least a day
                    if today.weekday() != game.timestamp.weekday():
                        return True
        else:
            # Query set is empty
            return True

        return False

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

    def _format_scores(self, scores):
        result = []
        
        for game in scores:
            result.append([
                game.game_day,
                game.game_time,
                game.game_status,
                game.game_clock,
                game.away_name,
                str(game.away_score),
                game.home_name,
                str(game.home_score)
            ])

        return result

    def _get_default_week(self):
        week_one = datetime.datetime(2012, 9, 5, 0, 0, 0)
        current = datetime.datetime.now()
        
        delta = current - week_one
        
        return ((delta.days / 7) + 1)

    def _query_scores(self, week):
        query = {}
        result = {}

        query = Score.all()
        query.filter('week =', week)
        query.order('game_id')
        result = query.fetch(25)
        
        return result

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

app = webapp2.WSGIApplication([('/spread', MainPage)],
                              debug=True)

def main():
    run_wsgi_app(app)

if __name__ == "__main__":
    main()
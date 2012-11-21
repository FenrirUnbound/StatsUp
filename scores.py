#! /usr/bin/env python

import lib.constants as constants
import datetime
import json
import logging
import webapp2

from google.appengine.api import urlfetch
from google.appengine.ext.webapp.util import run_wsgi_app
from lib.drive import Drive
from models.score import Score

class MainPage(webapp2.RequestHandler):
    DEBUG = False

    def get(self):
        debug_flag = self.request.get('debug')
        odds = self.request.get('odds')
        query_select = {}
        result = {}
        to_save = self.request.get('save')
        week = self.request.get('week')

        # Check incoming parameters
        if week is None or len(week) == 0:
            week = self._get_current_week()
        if debug_flag is None or len(debug_flag) == 0:
            DEBUG = False
        else:
            global DEBUG
            DEBUG = True

        # Always do a fresh fetch/save when given given the option
        if to_save is None or len(to_save) == 0:
            query_select = self._query_scores(week)
            if self._is_update_required(query_select):
                result = self._update_scores()
                self._save_scores(week, result)
            else:
                # Format the data for client consumption
                result = self._format_scores(query_select)
        else:
            result = self._update_scores()
            self._save_scores(week, result)         

        # Currently a hack; will be pushed into post-endpoint
        if odds is not None and odds:
            spread_data = self._fetch_odds(week)
            self._save_spread(week, spread_data)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.out.write(json.dumps(result, indent = 4))
        
    # TODO: This
    # TODO: Accept client-side data
    def post(self):
        result = {}
        week = self.request.get('week')
        
        if week is None or len(week) == 0:
            week = self._get_current_week()
    
        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.out.write(json.dumps(result, indent = 4))

    def _fetch_odds(self, week):
        data = {}
        drive = Drive()
        margin = {}
        odds = 0
        result = {}
        spread = {}
        spreadsheet = ''
        target = ''
        worksheet = constants.DEFAULT_WORKSHEET

        # Obtain the correct spread sheet
        data_sheets = drive.list_spreadsheets()
        try:
            if week < 10:
                target = 'W0' + str(week)
            else:
                target = 'W' + str(week)
            index = data_sheets.index('S' + str(constants.YEAR) + target)
            spreadsheet = data_sheets[index]
        except ValueError:
            #No data sheet currently available
            logging.warning('Failed to load data sheet:  ' + spreadsheet)
            spreadsheet = ''

        data = drive.get_data(spreadsheet, worksheet)
        if len(data) > 0:
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
                # Skip total-game-points tally
                if 'TOTAL' in team:
                    continue

                # Detect for underdog
                if team[0] == '_':
                    last_team = constants.TEAM_NAME[team[1:].upper()]
                    spread[last_team] = (odds * -1)
                else:
                    # Format is: "TEAMNAME-12345 1/2"
                    deliminator = team.index('-')
                    
                    odds = int(team[deliminator:-3])
                    odds = (odds - 0.5)
                  
                    last_team = constants.TEAM_NAME[team[:deliminator].upper()]
                
                    spread[last_team] = odds

        result['odds'] = spread
        result['margin'] = margin
        return result

    def _fetch_scores(self):
        response = {}
        result = {}
        rpc = urlfetch.create_rpc()

        urlfetch.make_fetch_call(rpc, constants.URL_SCOREBOARD)
        try:
            response = rpc.get_result()
            if response.status_code == constants.HTTP_OK:
                counter = 100
                length = 0
                text = response.content

                # Format the incoming data into proper json
                while length != text.__len__():
                    length = text.__len__()
                    text = text.replace(',,', ',0,')
                    
                    # Prevent infinite loops
                    if counter != 0:
                        counter -= 1
                    else:
                        break

                result = json.loads(text)
            else:
                result = {
                    'status_code': response.status_code
                    }
        except urlfetch.DownloadError:
            result = {
                'Error': 'An unexpected error occurred.'
                }

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
                str(game.home_score),
                constants.GAME_PADDING,
                constants.GAME_PADDING,
                game.game_id,
                constants.GAME_PADDING,
                'REG11',    # magic string; we don't know what it is :(
                game.year,
                game.spread_margin,
                game.spread_odds
            ])

        return result

    def _get_current_week(self):
        current = datetime.datetime.now()
        delta = current - constants.WEEK_ONE
        
        return ((delta.days / 7) + 1)

    def _is_update_required(self, scores):
        if DEBUG:
            logging.debug('\"scores\" length:  ' + str(len(scores)))
        else:
            logging.debug('No debug statements')
    
        if len(scores) > 0:
            #Shouldn't update if we're querying an archived week
            if scores[0].week != self._get_current_week():
                if DEBUG:
                    logging.debug('Querying an archived week')
                return False

            today = (datetime.datetime.now() - 
                    datetime.timedelta(hours=constants.UTC_OFFSET))
            if DEBUG:
                logging.debug('Today-- ' + str(today))
            for game in scores:
                # today is a gameday
                if today.weekday() == constants.DAYS[game.game_day.upper()]:
                    offset = 12   # !!! Assume all games are in the afternoon
                    index = game.game_time.index(':')
                    game_hour = int(game.game_time[:index]) + offset
                    game_minute = int(game.game_time[(index+1):])

                    # Check if the game has already started
                    if today.hour > game_hour:
                        # Don't fetch if the game is over
                        if 'Final' in game.game_status:
                            continue
                        elif 'final' in game.game_status:
                            continue

                        # Check if timestamp is stale
                        time_delta = today - game.timestamp
                        if time_delta >= datetime.timedelta(
                                minutes=constants.THRESHOLD
                                ):
                            return True
                        elif DEBUG:
                            logging.debug('Game started; fresh timestamp')
                    elif today.hour == game_hour:
                        if game_minute >= today.minute:
                            # It's hard to believe a game is less than an hour
                            # Check if timestamp is stale

                            time_delta = today - game.timestamp
                            threshold = datetime.timedelta(
                                    minutes=constants.THRESHOLD
                                    )
                            if time_delta >= threshold:
                                return True
                            elif DEBUG:
                                logging.debug('Game started; fresh timestamp')
                    elif DEBUG:
                        logging.debug('Game--Today(Hour):  ' + str(game_hour) +
                                '--' + str(today.hour))
                else:
                    # Only update if the timestamp is stale by at least a day
                    if today.weekday() != game.timestamp.weekday():
                        if DEBUG:
                            logging.debug('Timestamp > 1day')
                        return True
        else:
            # Query set is empty
            return True

        return False

    def _query_scores(self, week):
        query = {}
        result = {}

        query = Score.all()
        query.filter('week =', week)
        query.order('game_id')
        result = query.fetch(constants.TOTAL_TEAMS)
        
        return result

    def _save_scores(self, week, scores):
        '''
        Side-Effect: Appends a game's margin & odds
        '''
        current = {}
        key = None
        matchup = None
        query = Score.all()
        query_select = {}
        scorebox = {}
        right_now = (datetime.datetime.now() - 
                datetime.timedelta(hours=constants.UTC_OFFSET))
        
        query.filter('week =', week)
        query_select = query.fetch(constants.TOTAL_TEAMS)

        if len(query_select) == 0:
            # Completely new save
            for game in scores:
                scorebox = Score(
                    year = int(game[constants.GAME_SEASON]),
                    week = int(week),
                    away_name = game[constants.AWAY_NAME].encode('ascii',
                                                                    'ignore'),
                    away_score = int(game[constants.AWAY_SCORE]),
                    game_clock = str(game[constants.GAME_CLOCK]),
                    game_day = game[constants.GAME_DAY].encode('ascii',
                                                                    'ignore'),
                    game_id = int(game[constants.GAME_ID]),
                    game_status = game[constants.GAME_STATUS],
                    game_time = game[constants.GAME_TIME],
                    home_name = game[constants.HOME_NAME].encode('ascii',
                                                                    'ignore'),
                    home_score = int(game[constants.HOME_SCORE]),
                    spread_margin = float(game[constants.GAME_SPREAD_MARGIN]),
                    spread_odds = float(game[constants.GAME_SPREAD_ODDS]),
                    timestamp = right_now
                    )
                
                scorebox.put()
        else:
            # Update the scores
            for scorebox in query_select:
                # Find the related game score
                for game in scores:
                    if game[constants.AWAY_NAME] == scorebox.away_name:
                        current = game
                        break

                key = scorebox.key()
                matchup = Score.get(key)
                
                # Update
                matchup.away_score = int(game[constants.AWAY_SCORE])
                matchup.game_clock = str(game[constants.GAME_CLOCK])
                matchup.game_status = game[constants.GAME_STATUS]
                matchup.home_score = int(game[constants.HOME_SCORE])
                matchup.timestamp = right_now
                
                # Pull margin & odds data while we have the data
                game[constants.GAME_SPREAD_MARGIN] = matchup.spread_margin
                game[constants.GAME_SPREAD_ODDS] = matchup.spread_odds
                
                # Push update
                matchup.put()

    def _save_spread(self, week, spread):
        margins = spread['margin']
        odds = spread['odds']
        query = Score.all()
        result = {}

        query.filter('week =', week)
        result = query.fetch(constants.QUERY_LIMIT)

        if len(result) > 0:
            # By design, we only augment spread-data to existing scores
            for score in result:
                key = score.key()
                matchup = Score.get(key)
                spread_odds = 0.0
                spread_margin = 0.0
                
                if matchup.home_name in odds:
                    # Spread is relative to home team
                    spread_odds = odds[matchup.home_name]

                # Margin is relative only to game, not team
                if matchup.home_name in margins:
                    spread_margin = margins[matchup.home_name]
                elif matchup.away_name in margins:
                    spread_margin = margins[matchup.away_name]

                # Update
                matchup.spread_odds = spread_odds
                matchup.spread_margin = spread_margin
                
                # Push update
                matchup.put()

    def _update_scores(self):
        game_status = ''
        result = []
        scores = (self._fetch_scores())[constants.SCORES_FETCHED]
        
        for game in scores:
            # Fix for proper formatting of games in overtime
            game_status = game[constants.GAME_STATUS]
            if game_status == 'final overtime':
                game_status = 'Final Overtime'
            
            result.append([
                game[constants.GAME_DAY],
                game[constants.GAME_TIME],
                game_status,
                game[constants.GAME_CLOCK],
                game[constants.AWAY_NAME],
                game[constants.AWAY_SCORE],
                game[constants.HOME_NAME],
                game[constants.HOME_SCORE],
                constants.GAME_PADDING,
                constants.GAME_PADDING,
                game[constants.GAME_ID],
                constants.GAME_PADDING,
                game[12],   # magic number; we don't know what it is :(
                game[constants.GAME_SEASON],
                constants.GAME_PADDING, # For margin
                constants.GAME_PADDING  # For odds
            ])

        return result


app = webapp2.WSGIApplication([('/scores', MainPage)],
                              debug=True)

def main():
    run_wsgi_app(app)

if __name__ == "__main__":
    main()
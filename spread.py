#! /usr/bin/env python

import datetime
import json
import lib.constants as constants
import logging
import webapp2

from google.appengine.ext.webapp.util import run_wsgi_app
from lib.drive import Drive
from models.score import Score
from models.spread import Spread

class MainPage(webapp2.RequestHandler):
    def get(self):
        result = {}
        spreadsheet = self.request.get('spreadsheet')
        week = self.request.get('week')
        worksheet = self.request.get('worksheet')
        
        # Check parameters
        if week is None or len(week) == 0:
            week = self._get_current_week()

        result = self._query_database(week)
        if result is None or len(result) == 0:
            # Need to fetch from spreadsheet
            result = self._fetch_spreadsheet(spreadsheet, worksheet)
            # NOTE: only saves spread picks, not odds or magin(ie, over/under)
            # odds & margin should be saved with scores
            result = result['spread']
            self._save_spread(week, result)

        result = self._format_query(result)

        self.response.headers['Content-Type'] = 'application/json'
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.out.write(json.dumps(result, indent = 4))

    # TODO: Accept client-side data
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

    def _fetch_spreadsheet(self, spreadsheet, worksheet):
        current_season = 'S' + str(constants.YEAR)
        current_week = self._get_current_week()
        data = None
        drive = Drive()
        index = 0
        margin = {}
        odds = 0
        over_under = ''
        result = {}
        selections = {}
        spread = {}
        target = ''
        team_name = ''
        total_score = 0
        
        # Default values
        if spreadsheet is None or len(spreadsheet) == 0:
            # Format for single-digit & double-digit week numbers
            if current_week < 10:
                target = 'W0' + str(current_week)
            else:
                target = 'W' + str(current_week)

            data_sheets = drive.list_spreadsheets()
            try:
                index = data_sheets.index(current_season + target)
                spreadsheet = data_sheets[index]
            except ValueError:
                # No data sheet currently available
                logging.warning('Failed to load data sheet:  ' + spreadsheet +
                        '(' + worksheet + ')')
                spreadsheet = ''
        if worksheet is None or len(worksheet) == 0:
            worksheet = constants.DEFAULT_WORKSHEET

        data = drive.get_data(spreadsheet, worksheet)
        if len(data) > 0:
            # START: Get each individual's spread choices
            for i in data:
                current = data[i]
                header = current[0]

                # Skip the labels
                if 'GAME' in header or 'WEEK' in header:
                    continue

                # Clear local values
                flush = False
                over_under = ''
                selections[header] = []
                team_name = ''
                total_score = ''

                # 1-->offset; 3-->season-long information
                for picks in current[1+3:]:
                    # No team name; fresh start
                    if len(team_name) == 0:
                        team_name = picks
                    # Team name set, but not over/under
                    elif len(over_under) == 0:
                        # Check if over...
                        if picks == 'OV':
                            over_under = picks
                        # ...check if under...
                        elif picks == 'UN':
                            over_under = picks
                        # ...it's anoter team
                        else:
                            over_under = '0'
                            total_score = '0'
                            flush = True
                    # Team name & over/under set, but not total score
                    elif len(total_score) == 0:
                        try:
                            total_score = str(int(picks))
                        except ValueError:
                            # It's not a number...
                            total_score = '0'

                        flush = True

                    if flush:
                        # Save data
                        selections[header].append([
                            team_name,
                            over_under,
                            total_score
                            ])

                        # Reset
                        if total_score == '0':
                            # Flushed early if total_score is 0
                            team_name = picks
                        else:
                            team_name = ''
                        over_under = ''
                        total_score = ''
                        flush = False
            # END: Get each individual's spread choices

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
                # Skip total-game-points tally
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


    def _get_current_week(self):
        current = datetime.datetime.now()
        delta = current - constants.WEEK_ONE
        
        return ((delta.days / 7) + 1)

    def _format_query(self, query):
        result = {}

        for item in query:
            person = item.person
            if person not in result:
                result[person] = [
                    item.team_name,
                    item.margin,
                    item.total_score
                ]
            else:
                # result needs to be array of arrays
                result[item.person].append([
                    item.team_name,
                    item.margin,
                    item.total_score
                    ])
        
        return result

    def _query_database(self, week):
        query = {}
        result = {}
        
        query = Spread.all()
        query.filter('week =', week)
        query.order('person')

        result = query.fetch(constants.QUERY_LIMIT)
        return result

    # TODO: Only saves. Needs to update as well
    def _save_spread(self, week, spread):
        query = Spread.all()
        result = None
        item = None

        query.filter('week =', week)
        result = query.fetch(constants.QUERY_LIMIT)
        
        if len(result) == 0:
            #completely new save
            for person in spread:
                for line in spread[person]:
                    item = Spread(
                        year = constants.YEAR,
                        week = week,
                        person = person,
                        team_name = line[constants.SPREAD_TEAM_NAME],
                        over_under = line[constants.SPREAD_OVER_UNDER],
                        total_score = int(line[constants.SPREAD_TOTAL_SCORE])
                        )

                    item.put()


app = webapp2.WSGIApplication([('/spread', MainPage)],
                              debug=True)

def main():
    run_wsgi_app(app)

if __name__ == "__main__":
    main()
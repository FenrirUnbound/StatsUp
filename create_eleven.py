#! /usr/bin/env python

import logging

from google.appengine.ext import db
from models.team import Team
from lib.drive import Drive
from lib.const import Const

def main():
    drive = Drive()
    
    league = _league_stats(drive)
    
    for team in league.keys():
        _upload_stats(team, league[team])


def _aggregate_defense(drive):
    result = {}
    
    # First page
    stats = drive.get_data(Const.SPREADSHEET_NAME, Const.DEFENSE_PAGE_ONE)
    for i in range(Const.START_ROW, len(stats[Const.NAME_COL])):
        name = stats[Const.NAME_COL][i]
        
        if name not in result:
            result[name] = {}

        result[name]['pass'] = int(stats[Const.PASS_COL][i])
        result[name]['rush'] = int(stats[Const.RUSH_COL][i])

    # Second page
    stats = drive.get_data(Const.SPREADSHEET_NAME, Const.DEFENSE_PAGE_TWO)
    for i in range(Const.START_ROW, len(stats[Const.NAME_COL])):
        name = stats[Const.NAME_COL][i]
        
        if name not in result:
            result[name] = {}

        result[name]['first_down'] = int(stats[Const.FIRST_DOWN_COL][i])
    
    return result

def _aggregate_offense(drive):
    result = {}

    # First page
    stats = drive.get_data(Const.SPREADSHEET_NAME, Const.OFFENSE_PAGE_ONE)
    for i in range(Const.START_ROW, len(stats[Const.NAME_COL])):
        name = stats[Const.NAME_COL][i]
        
        if name not in result:
            result[name] = {}
        
        result[name]['pass'] = int(stats[Const.PASS_COL][i])
        result[name]['rush'] = int(stats[Const.RUSH_COL][i])

    # Second page
    stats = drive.get_data(Const.SPREADSHEET_NAME, Const.OFFENSE_PAGE_TWO)
    for i in range(Const.START_ROW, len(stats[Const.NAME_COL])):
        name = stats[Const.NAME_COL][i]
        
        if name not in result:
            result[name] = {}

        result[name]['first_down'] = int(stats[Const.FIRST_DOWN_COL][i])
    
    return result

def _league_stats(drive):
    defense_stats = _aggregate_defense(drive)
    offense_stats = _aggregate_offense(drive)
    result = {}

    # Offense
    for name in offense_stats.keys():
        if name not in result:
            result[name] = {}

        if 'offense' not in result[name]:
            result[name]['offense'] = {}

        team = result[name]['offense']

        team['first_down'] = offense_stats[name]['first_down']
        team['pass'] = offense_stats[name]['pass']
        team['rush'] = offense_stats[name]['rush']

    # Defense
    for name in defense_stats.keys():
        if name not in result:
            result[name] = {}

        if 'defense' not in result[name]:
            result[name]['defense'] = {}

        team = result[name]['defense']
        
        team['first_down'] = defense_stats[name]['first_down']
        team['pass'] = defense_stats[name]['pass']
        team['rush'] = defense_stats[name]['rush']
    
    return result

def _upload_stats(team_name, stats):
    query = Team.all()
    query.filter('name =', team_name)
    result = query.fetch(1)

    if len(result) > 0:
        for team in result:
            team.year = Const.LAST_YEAR
            team.offense_passing = stats['offense']['pass']
            team.offense_rushing = stats['offense']['rush']
            team.offense_first_down = stats['offense']['first_down']
            team.defense_passing = stats['defense']['pass']
            team.defense_rushing = stats['defense']['rush']
            team.defense_first_down = stats['defense']['first_down']

            team.put()
    else:
        team = Team(name = team_name,
                    year = Const.LAST_YEAR,
                    offense_passing = stats['offense']['pass'],
                    offense_rushing = stats['offense']['rush'],
                    offense_first_down = stats['offense']['first_down'],
                    defense_passing = stats['defense']['pass'],
                    defense_rushing = stats['defense']['rush'],
                    defense_first_down = stats['defense']['first_down'])

        team.put()

if __name__ == "__main__":
    main()
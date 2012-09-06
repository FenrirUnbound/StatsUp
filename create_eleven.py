#! /usr/bin/env python

import logging

from google.appengine.ext import db
from models.team import Team
from lib.drive import Drive
from lib.const import Const

def main():
    drive = Drive()

    offense_stats = _aggregate_offense(drive)
    defense_stats = _aggregate_defense(drive)
    
    league = _munge_stats(offense_stats, defense_stats)


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

def _munge_stats(offense_stats, defense_stats):
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

if __name__ == "__main__":
    main()
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
    logging.info(defense_stats)

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

        result[name]['first_downs'] = int(stats[Const.FIRST_DOWN_COL][i])
    
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

        result[name]['first_downs'] = int(stats[Const.FIRST_DOWN_COL][i])
    
    return result

if __name__ == "__main__":
    main()
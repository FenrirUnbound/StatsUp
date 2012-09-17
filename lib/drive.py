#! /usr/bin/env python

import logging

import gdata.spreadsheet.service
from my_user import User

class Drive:
    """A wrapper class for the GDocs Python Client.
    
    Although it does limit the client's uses and implementation uses, it
    simplifies the feature-set for the project at hand.

    """

    def __init__(self):
        """Base constructor.
        
        Mainly used to initiate the client login and maintain the session.
        
        WARNING: If the session expires before the completion of this program,
        you're going to have a bad time.
            1. A session is apx 24 hours
            2. If a session expires before this program terminates, then it
               is getting stuck somewhere else during its operation.

        """
        self._user = User()
        self._client = gdata.spreadsheet.service.SpreadsheetsService()

        self._client.ClientLogin(self._user.email, self._user.ticket)

    def get_data(self, spreadsheet, worksheet):
        """Obtain all the cell data within a spreadsheet
        
        TODO: 1. Add bias to dict structure
                * Right now it favors columns
                * Add bias for favoring either columns or rows
        
        """
        result = {}

        # Traverse spreadsheets tree

        spreadsheets_feed = self._client.GetSpreadsheetsFeed()
        index = self._search_feed(spreadsheet, spreadsheets_feed)
        # spreadsheet not found
        if(index < 0):
            return result

        id_parts = spreadsheets_feed.entry[index].id.text.split('/')
        spreadsheet_id = id_parts[len(id_parts) - 1]
        
        # Traverse worksheets tree
        
        worksheets_feed = self._client.GetWorksheetsFeed(spreadsheet_id)
        index = self._search_feed(worksheet, worksheets_feed)
        # worksheet not found
        if(index < 0):
            return result

        id_parts = worksheets_feed.entry[index].id.text.split('/')
        worksheet_id = id_parts[len(id_parts) - 1]

        cells_feed = self._client.GetCellsFeed(spreadsheet_id, worksheet_id)
        
        # Format the cell data into the dictionary
        for cell in cells_feed.entry:
            id_parts = cell.id.text.split('/')
            id_ = id_parts[len(id_parts) - 1]

            col_index = id_.index('C') + 1
            col = int(id_[col_index:])
            
            # Create entry for the column if it's the first one encountered
            if(result.has_key(col) == False):
                result[col] = []

            # TODO: Improve this to accomodate for blank entries
            result[col].append(cell.content.text.strip())

        return result

    def list_spreadsheets(self):
        """Get the list of accessible spreadsheets

        """
        result = []
        feed = self._client.GetSpreadsheetsFeed()
        
        return self._feed_content(feed)

    # This can be improved
    ## Possible "if string in other_string" instead of for-loop
    def list_worksheets(self, spreadsheet):
        """Get the list of worksheets within a spreadsheet
        
        If the spreadsheet isn't accessible by the client, then an empty list
        is returned. 
        
        """
        spreadsheets_feed = self._client.GetSpreadsheetsFeed()
        index = self._search_feed(spreadsheet, spreadsheets_feed)

        if index >= 0:
            # Grab the ID
            id_parts = spreadsheets_feed.entry[index].id.text.split('/')
            id_ = id_parts[len(id_parts) - 1]

            worksheets_feed = self._client.GetWorksheetsFeed(id_)
                
            return self._feed_content(worksheets_feed)

        return []

    def _equalize_array(self, string_array):
        """Equalize all strings in an array

        """
        result = []

        for element in string_array:
            result.append(self._equalize_string(element))

        return result

    def _equalize_string(self, string):
        """Equalize a string
        
        To treat all strings (nearly) equally, it is changed to lower-case
        characters, then is stripped of all whitespace (including spaces
        between words).
        
        TODO: Strip special characters.
                * Simplifies future implementation
                * Assists in (highly potential) typos

        """
        return string.lower().replace(' ', '')

    def _feed_content(self, feed):
        """Obtain the content text of a given feed

        """
        result = []

        for item in feed.entry:
            result.append(item.content.text)

        return result

    def _search_feed(self, title, feed):
        """Search for a particular text within a feed

        """
        index = -1

        content = self._feed_content(feed)
        target = self._equalize_string(title)
        for element in content:
            index += 1

            if target == self._equalize_string(element):
                return index

        return -1

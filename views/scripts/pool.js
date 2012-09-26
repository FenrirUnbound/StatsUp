var AWAY_NAME = 4,
    AWAY_SCORE = 5,
    AWAY_TEAM = 0,
    GAME_CLOCK = 3,
    GAME_MARGIN = 1,
    GAME_START_DAY = 0,
    GAME_START_TIME = 1,
    GAME_STATUS = 2,
    HOME_NAME = 6
    HOME_SCORE = 7,
    HOME_TEAM = 1,
    NAMES = {
      'ARI': 'Arizona',
      'ATL': 'Atlanta',
      'BAL': 'Baltimore',
      'BUF': 'Buffalo',
      'CAR': 'Carolina',
      'CHI': 'Chicago',
      'CIN': 'Cincinnati',
      'CLE': 'Cleveland',
      'DAL': 'Dallas',
      'DEN': 'Denver',
      'DET': 'Detroit',
      'GB': 'Green Bay',
      'HOU': 'Houston',
      'IND': 'Indianapolis',
      'JAC': 'Jacksonville',
      'KC': 'Kansas City',
      'MIA': 'Miami',
      'MIN': 'Minnesota',
      'NE': 'New England',
      'NO': 'New Orleans',
      'NYG': 'NY Giants',
      'NYJ': 'NY Jets',
      'OAK': 'Oakland',
      'PHI': 'Philadelphia',
      'PIT': 'Pittsburgh',
      'SD': 'San Diego',
      'SF': 'San Francisco',
      'SEA': 'Seattle',
      'STL': 'St. Louis',
      'TB': 'Tampa Bay',
      'TEN': 'Tennessee',
      'WAS': 'Washington'
    },
    TEAM_NAME = 0;

var scoreboard_ = {},
    spread_ = {};

$(document).ready(function() {
  var scoreboardUrl = 'http://matsumoto26sunday.appspot.com/scoreboard',
      spreadUrl = 'http://matsumoto26sunday.appspot.com/pool',
      templateName = '',
      templates = $('script[data-jsv-tmpl]');

  // Get spread data
  $.when($.get(spreadUrl))
      .done(function(data) {
          var element = '',
              players = {};

          spread_ = formatSpread_(data); //Save spread data

          players = Object.keys(data).sort().reverse();
          for(var i = players.length - 1; i >= 0; i -= 1) {
            element += $.render.tmpl_listoption({
              'name': players[i],
              'value': players.length-i    
            });
          }
          
          // Load the selector
          $('#selectSpread').html(element);
          // Enable the select button
          $('#selectButton').click(engageSpread_);
          
      });

  // Get scoreboard
  $.when($.get(scoreboardUrl))
      .done(function(data) {
        var current = {},
            gameScoreData = ($.parseJSON(data))['ss'].reverse(),
            result = {'scores': []};

        scoreboard_ = gameScoreData;

        for(var i = gameScoreData.length - 1; i >= 0; i -= 1) {
          current = gameScoreData[i];

          result['scores'].push({
            'awayName': NAMES[current[AWAY_NAME]],
            'awayScore': current[AWAY_SCORE],
            'gameClock': current[GAME_CLOCK],
            'gameStatus': current[GAME_STATUS],
            'gameStartDay': current[GAME_START_DAY],
            'gameStartTime': current[GAME_START_TIME],
            'homeName': NAMES[current[HOME_NAME]],
            'homeScore': current[HOME_SCORE]
          });
        }

        $('#gameScores').empty().html(
          $.render.tmpl_scoreboard(result)
        );
      });

  // Load templates from DOM
  for(var i = templates.length - 1; i >= 0; i -= 1) {
    templateName = $(templates[i]).attr('id');
    $.templates(templateName, templates[i]);
  }
});

var engageSpread_ = (function() {
  var awayTeam,
      current,
      homeTeam,
      person = $('#selectSpread').find('option:selected').text(),
      scores = $('#gameScores > ul > li > article');
  
  for(var i = scores.length - 1; i >= 0; i -= 1) {
    // Extra away team
    current = $(scores[i]).find('ul');
    awayTeam = $(current[AWAY_TEAM]);
    console.log(awayTeam);
  }
});

/**
 * Format the spread to guarantee tuplets of Name,Margin,Score
 */
var formatSpread_ = (function(spread) {
  var current = [],
      players = [],
      result = {},
      working;
  
  players = Object.keys(spread);
  for(var i = players.length - 1; i >= 0; i -= 1) {
    result[players[i]] = [];

    current = spread[players[i]];
    while(current.length > 0) {
      working = current.splice(0, 3);
      
      if(working[GAME_MARGIN] == 'UN' || working[GAME_MARGIN] == 'OV') {
        result[players[i]].push(working[0]);
        result[players[i]].push(working[1]);
        result[players[i]].push(working[2]);
      }
      else {
        // First one is always a name
        result[players[i]].push(working[0]);
        result[players[i]].push(0);
        result[players[i]].push(0);
        
        // If last set is game_margin, put everything else back
        if(working[2] == 'UN' || working[2] == 'OV') {
          current.unshift(working[2]);
          current.unshift(working[1]);
        }
        else {
          result[players[i]].push(working[1]);
          result[players[i]].push(0);
          result[players[i]].push(0);
          
          // No guarantees on last element; put back
          current.unshift(working[2]);
        } 
      }
    }
  }

  return result;
});
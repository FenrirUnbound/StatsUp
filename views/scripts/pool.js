var AWAY_NAME = 4,
    AWAY_SCORE = 5,
    AWAY_TEAM = 0,
    GAME_CLOCK = 3,
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
    SPREAD_MARGIN =1,
    TEAM_NAME = 0;

var odds_ = {},
    scoreboard_ = {},
    spread_ = {};

$(document).ready(function() {
  var scoreboardUrl = 'http://matsumoto26sunday.appspot.com/scoreboard',
      spreadUrl = 'http://matsumoto26sunday.appspot.com/pool',
      templateName = '',
      templates = $('script[data-jsv-tmpl]');

  /* Until we combine the two endpoints, the scoreboard data is dependant
   * upon the spread data (for line, over/under, total).
   */
  // Get spread data
  $.when($.get(spreadUrl))
      .done(function(spreadData) {
        // Setup spread
        $.when(setupSpread_(spreadData))
            .done(function() {
              // Get scoreboard
              $.when($.get(scoreboardUrl))
                  .done(function(scoreboardData) {
                      // Setup scoreboard
                      setupScoreboard_(scoreboardData);
                  });
            });
      });

  // Load templates from DOM
  for(var i = templates.length - 1; i >= 0; i -= 1) {
    templateName = $(templates[i]).attr('id');
    $.templates(templateName, templates[i]);
  }
});

var engageSpread_ = (function() {
  var difference,
      current,
      index = 0,
      key,
      person = $('#selectSpread').find('option:selected').text(),
      scores = $('#gameScores > ul > li > article'),
      teamName;

  current = spread_[person];
  for(var i = scoreboard_.length - 1; i >= 0; i -= 1) {
    index = 0;

    //Find which spread applies to this game
    for(var j = current.length - 1; j >= 0; j -= 1) {
      teamName = current[j]['team'];
      
      //Fix for differences in Arizona short-hand spelling
      teamName = (teamName === 'AZ') ? 'ARI' : teamName;
      
      if(scoreboard_[i][AWAY_NAME] === teamName || 
          scoreboard_[i][HOME_NAME] === teamName) {
        index = i;
        break;
      }
    }

    // Check for winner
    if(scoreboard_[i][AWAY_NAME] === teamName) {
      difference = scoreboard_[i][AWAY_SCORE] - scoreboard_[i][HOME_SCORE];
    }
    else {
      difference = scoreboard_[i][HOME_SCORE] - scoreboard_[i][AWAY_SCORE];
    }
    
    // Weight the difference with the game odds
    key = NAMES[teamName].toUpperCase();
    difference += odds_[key];
    
    // For debugging purposes
    console.log(teamName + '(' + odds_[key] + ')');
    
    // Only apply color filter on games that are started
    if(scoreboard_[i][GAME_STATUS] !== 'Pregame') {
      if(difference > 0) {
        $(scores[i]).removeClass('white').removeClass('red').addClass('green');
      }
      else if(difference < 0) {
        $(scores[i]).removeClass('white').removeClass('green').addClass('red');
      }
    }
  }
});

/**
 * Format the spread to guarantee tuplets of Name,Margin,Score
 */
var formatSpread_ = (function(spread) {
  var current = [],
      players = Object.keys(spread),
      result = {},
      working;

  for(var i = players.length - 1; i >= 0; i -= 1) {
    result[players[i]] = [];
    current = spread[players[i]];

    while(current.length > 0) {
      working = current.splice(0, 3);

      if(working[SPREAD_MARGIN] === 'UN' || working[SPREAD_MARGIN] === 'OV') {
        result[players[i]].push({
          'team': working[0],
          'margin': working[1],
          'total': working[2]
        });
      }
      else {
        //First one is always a name
        result[players[i]].push({
          'team': working[0],
          'margin': 0,
          'total': 0
        });
        
        //If last set is game_margin, put everything else back
        if(working[2] === 'UN' || working[2] === 'OV') {
          current.unshift(working[2]);
          current.unshift(working[1]);
        }
        else {
          result[players[i]].push({
            'team': working[1],
            'margin': 0,
            'total': 0
          });
          
          //No guarantees on last element; put back
          current.unshift(working[2]);
        }
      }
    }
  }

  return result;
});

var setupScoreboard_ = (function(data) {
  var awayName,
      current = {},
      gameScoreData = ($.parseJSON(data))['ss'].reverse(),
      favorite,
      gameStatus,
      homeName,
      result = {'scores': []};

  scoreboard_ = ($.parseJSON(data))['ss'];

  for(var i = gameScoreData.length - 1; i >= 0; i -= 1) {
    current = gameScoreData[i];
    
    awayName = NAMES[current[AWAY_NAME]];
    gameStatus = current[GAME_STATUS];
    homeName = NAMES[current[HOME_NAME]];

    //Handle for OverTime
    gameStatus = (gameStatus === 'final overtime') ? 
        'Final Overtime' : gameStatus;

    // Figure out team favorite
    favorite = (odds_[homeName.toUpperCase()] < 0) ?
        current[HOME_NAME] : current[AWAY_NAME];

    result['scores'].push({
      'awayName': awayName,
      'awayScore': current[AWAY_SCORE],
      'favorite': favorite,
      'gameClock': current[GAME_CLOCK],
      'gameStatus': gameStatus,
      'gameStartDay': current[GAME_START_DAY],
      'gameStartTime': current[GAME_START_TIME],
      'homeName': homeName,
      'homeScore': current[HOME_SCORE],
      'line': odds_[NAMES[favorite].toUpperCase()]
    });
  }
        
  $('#gameScores').empty().html(
    $.render.tmpl_scoreboard(result)
  );
});

var setupSpread_ = (function(data) {
  var element = '',
      players = {},
      spreadSelection = data['spread'];

  odds_ = data['odds'];
  spread_ = formatSpread_(spreadSelection);

  players = Object.keys(spreadSelection).sort().reverse();
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
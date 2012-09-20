var AWAY_NAME = 4,
    AWAY_SCORE = 5,
    GAME_CLOCK = 3,
    GAME_START_DAY = 0,
    GAME_START_TIME = 1,
    GAME_STATUS = 2,
    HOME_NAME = 6
    HOME_SCORE = 7,
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
    };

$(document).ready(function() {
  var scoreboardUrl = 'http://matsumoto26sunday.appspot.com/scoreboard',
      spreadUrl = 'http://matsumoto26sunday.appspot.com/pool',
      templateName = '',
      templates = $('script[data-jsv-tmpl]');

  // Get scoreboard
  $.when($.get(scoreboardUrl))
      .done(function(data) {
        var current = {},
            gameScoreData = ($.parseJSON(data))['ss'].reverse(),
            result = {'scores': []};

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

  // Get spread data
  $.when($.get(spreadUrl))
      .done(function(data) {
          var element = '',
              players = {};

          players = Object.keys(data).sort().reverse();
          for(var i = players.length - 1; i >= 0; i -= 1) {
            element += $.render.tmpl_listoption({
              'name': players[i],
              'value': players.length-i    
            });
          }
          
          $('#selectSpread').html(element);
      });

  // Load templates from DOM
  for(var i = templates.length - 1; i >= 0; i -= 1) {
    templateName = $(templates[i]).attr('id');
    $.templates(templateName, templates[i]);
  }
});
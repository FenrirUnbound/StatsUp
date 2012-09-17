var AWAY_NAME = 4,
    AWAY_SCORE = 5,
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
      templateName,
      templates = $('script[data-jsv-tmpl]');
  
  $.when($.get(scoreboardUrl))
      .done(function(data) {
        var current,
            gameScoreData = ($.parseJSON(data))['ss'].reverse(),
            result = {'scores': []},
            working;

        for(var i = gameScoreData.length - 1; i >= 0; i -= 1) {
          current = gameScoreData[i];

          result['scores'].push({
            'awayName': NAMES[current[AWAY_NAME]],
            'awayScore': current[AWAY_SCORE],
            'homeName': NAMES[current[HOME_NAME]],
            'homeScore': current[HOME_SCORE]
          });
        }

        $('#gameScores').empty().html(
          $.render.scoreboard(result)
        );

        console.log('finished');
      });

  // Load templates from DOM
  for(var i = templates.length - 1; i >= 0; i -= 1) {
    templateName = $(templates[i]).attr('id');
    $.templates(templateName, templates[i]);
  }
  console.log('done');
});
var spread = spread || {};

$(document).ready(function() {
  var dataUrl = 'http://matsumoto26sunday.appspot.com/all',
      templateName = '',
      templates = $('script[data-jsv-tmpl]');

  // Get spread data
  $.when($.get(dataUrl)).done(function(data) {
    spread.init(data);
  });

  // Load templates from DOM
  for(var i = templates.length - 1; i >= 0; i -= 1) {
    templateName = $(templates[i]).attr('id');
    $.templates(templateName, templates[i]);
  }
});

spread = (function() {
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
      LOOP_THRESHOLD = 100,
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

  var margin_ = {},
      odds_ = {},
      scoreboard = {},
      spread = {};

  function engageSpread_() {
    var difference,
        combinedScore,
        current,
        element,
        index = 0,
        key,
        margin,
        person = $('#selectSpread').find('option:selected').text(),
        scores = $('#gameScores > article > section:nth-child(1)'),
        spreadDetails = $('#gameScores > article > section:nth-child(2)'),
        tally = 0,
        teamName,
        totalScore;

    current = spread[person];
    for(var i = scoreboard.length - 1; i >= 0; i -= 1) {
      index = 0;

      //Find which spread applies to this game
      for(var j = current.length - 1; j >= 0; j -= 1) {
        combinedScore = parseInt(scoreboard[i][AWAY_SCORE]) +
            parseInt(scoreboard[i][HOME_SCORE]);
        teamName = current[j]['team'];
        totalScore = current[j]['total'];
      
        //Fix for differences in Arizona short-hand spelling
        teamName = (teamName === 'AZ') ? 'ARI' : teamName;
      
        if(scoreboard[i][AWAY_NAME] === teamName || 
            scoreboard[i][HOME_NAME] === teamName) {
          index = i;
          break;
        }
      }

      /*
       * Dynamic Elements
       */

      // Embed the player's picked team
      $('#teamChoice > li:nth-child(2)', spreadDetails[i])
          .text(NAMES[teamName]);

      // Dynamically embed the total score in the detail drawer
      $('#totalScore > li:nth-child(2)', spreadDetails[i])
          .text(totalScore + ' (' + combinedScore + ')');
    
      // Emphasize the player's choice on over/under margin
      if(current[index]['margin']) {
        element = $('#margin > li:nth-child(1)', spreadDetails[i]);
        element.html('Over/Under');  // Reset

        if(current[index]['margin'] === 'UN') {
          element.html('Over/<span>Under</span>');
        }
        else if(current[index]['margin'] === 'OV') {
          element.html('<span>Over</span>/Under');
        }
      }

      // Only calculate spread-line on games that are started
      if(scoreboard[i][GAME_STATUS] === 'Pregame')
        continue;
        
      /*
       * Highlights
       */

      // Check for winner
      if(scoreboard[i][AWAY_NAME] === teamName) {
        difference = scoreboard[i][AWAY_SCORE] - scoreboard[i][HOME_SCORE];
      }
      else {
        difference = scoreboard[i][HOME_SCORE] - scoreboard[i][AWAY_SCORE];
      }
    
      // Weight the difference with the game odds
      key = NAMES[teamName].toUpperCase();
      difference += odds_[key];
    
      // For debugging purposes
      console.log(teamName + '(' + odds_[key] + ')');

      // Apply color filter
      if(difference > 0) {
        // Entire scorebox
        $(scores[i]).removeClass('white').removeClass('red').addClass('green');
        // Spread-details drawer
        $('#teamChoice > li:nth-child(2)', spreadDetails[i])
            .removeClass('white')
            .removeClass('red')
            .addClass('green');

        tally += 1;
      }
      else if(difference < 0) {
        // Entire scorebox
        $(scores[i]).removeClass('white').removeClass('green').addClass('red');
        // Spread-details drawer
        $('#teamChoice > li:nth-child(2)', spreadDetails[i])
            .removeClass('white')
            .removeClass('green')
            .addClass('red');
      }

      // Highlight if score is within scoring range
      if(totalScore >= (combinedScore - 3) &&
          totalScore <= (combinedScore + 3)) {
        $('#totalScore > li:nth-child(2)', spreadDetails[i])
            .removeClass('red')
            .removeClass('white')
            .addClass('green');

        tally += 1;
        // Extra point for getting exact total score.
        if(totalScore === combinedScore)
          tally += 1;
      }
      else {
        $('#totalScore > li:nth-child(2)', spreadDetails[i])
            .removeClass('white')
            .removeClass('green')
            .addClass('red');
      }
    
      // Highlight correct margin
      margin = margin_[NAMES[scoreboard[i][AWAY_NAME]].toUpperCase()] ||
          margin_[NAMES[scoreboard[i][HOME_NAME]].toUpperCase()];
      if(margin && current[j]['margin']) {
        // Check if UNDER is successful
        if(current[index]['margin'] === 'UN' && combinedScore < margin) {
          $('#margin > li:nth-child(2)', spreadDetails[i])
              .removeClass('red')
              .removeClass('white')
              .addClass('green');
              
          tally += 1;
        }
        // Check if OVER is successful
        else if(current[index]['margin'] === 'OV' && combinedScore > margin) {
          $('#margin > li:nth-child(2)', spreadDetails[i])
              .removeClass('red')
              .removeClass('white')
              .addClass('green');
              
          tally += 1;
        }
        // Failed margin
        else {
          $('#margin > li:nth-child(2)', spreadDetails[i])
              .removeClass('green')
              .removeClass('white')
              .addClass('red');
        }
      }
    }

    console.log('tally: ' + tally);
  }
  
  function formatSpread_(spread) {
    var count,
        current = [],
        players = Object.keys(spread),
        result = {},
        working;

    for(var i = players.length - 1; i >= 0; i -= 1) {
      count = 0;
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
        
        // Check for infinite-loop threshold
        count += 1;
        if(count >= LOOP_THRESHOLD) {
          console.log(players[i]);
          break;
        }
      }
    }

    return result;
  }

  function setupScoreboard_(data) {
    var awayName,
        current = {},
        favorite,
        gameStatus,
        homeName,
        scoreboardLength,
        margin,
        result = {'scores': []};

    scoreboard = data;
    scoreboardLength = scoreboard.length;

    for(var i = 0; i < scoreboardLength; i += 1) {
      current = scoreboard[i];
    
      awayName = NAMES[current[AWAY_NAME]];
      gameStatus = current[GAME_STATUS];
      homeName = NAMES[current[HOME_NAME]];

      //Handle for OverTime
      gameStatus = (gameStatus === 'final overtime') ? 
          'Final Overtime' : gameStatus;

      // Figure out team favorite
      favorite = (odds_[homeName.toUpperCase()] < 0) ?
          current[HOME_NAME] : current[AWAY_NAME];

      margin = margin_[awayName.toUpperCase()] || 
          margin_[homeName.toUpperCase()];

      result['scores'].push({
        'awayName': awayName,
        'awayScore': current[AWAY_SCORE],
        'favoriteShort': favorite,
        'favoriteLong': NAMES[favorite],
        'gameClock': current[GAME_CLOCK],
        'gameStatus': gameStatus,
        'gameStartDay': current[GAME_START_DAY],
        'gameStartTime': current[GAME_START_TIME],
        'homeName': homeName,
        'homeScore': current[HOME_SCORE],
        'line': odds_[NAMES[favorite].toUpperCase()],
        'margin': margin,
        'pickedTeam': '--',
        'totalScore': (margin) ? '--' : 0 
      });
    }

    // Render the scoreboards    
    $('#gameScores').empty().html(
      $.render.tmpl_scoreboard(result)
    );
  
    // Enable expansion of spread details
    // TODO: Only have 1 drawer out at any given moment
    $('ul#expandSpreadDetails').click(function() {
      var element = $(this).parent().siblings('#spreadDetails'),
          height = element.height(),
          newHeight,
          offset = element.outerHeight();

      // Toggle open/close action based on initial height
      if( height > 1 ) {
        element.css({
          'height': '0px',
          'visibility': 'hidden'
        });
      }
      else {
        // Calculate the height of the actual element behind the scenes
        element.css({
          'height': 'auto',
          'position': 'absolute'
        }); 
        newHeight = element.height();

        // Reset the element
        element.css({
          'height': '0px',
          'position': 'static'
        });
        // Increase the height
        element.css({
          'height': newHeight + offset + 'px',
          'visibility': 'visible'
        });
      }
    });
  }
  
  function setupSpread_(data) {
    var element = '',
        players = {},
        spreadSelection = data['spread'];

    margin_ = data['margin'];
    odds_ = data['odds'];
    spread = formatSpread_(spreadSelection);

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
  }
  
  return {
    'init': function(data) {
      setupSpread_(data);
      setupScoreboard_(data['scoreboard']);
    },
    'scoreboard': scoreboard,
    'spread': spread
  }
  
})();
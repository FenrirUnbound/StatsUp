var loadingBar = loadingBar || {},
    spread = spread || {};

$(document).ready(function() {
  var templateName = '',
      templates = $('script[data-jsv-tmpl]');

  spread.init(loadingBar);

  // Load templates from DOM
  for(var i = templates.length - 1; i >= 0; i -= 1) {
    templateName = $(templates[i]).attr('id');
    $.templates(templateName, templates[i]);
  }
});

spread = (function($) {
  var BIG_NUMBER = 9001,
      DEPENDENCIES = 2,
      SCORE_URL = 'http://matsumoto26sunday.appspot.com/scores',
      SCORES_AWAY_NAME = 4,
      SCORES_AWAY_SCORE = 5,
      SCORES_AWAY_TEAM = 0,
      SCORES_GAME_CLOCK = 3,
      SCORES_GAME_LINE = 15,
      SCORES_GAME_MARGIN = 14,
      SCORES_GAME_START_DAY = 0,
      SCORES_GAME_START_TIME = 1,
      SCORES_GAME_STATUS = 2,
      SCORES_HOME_NAME = 6,
      SCORES_HOME_SCORE = 7,
      SPREAD_TEAM_NAME = 0,
      SPREAD_MARGIN = 1,
      SPREAD_TOTAL_SCORE = 2,
      SPREAD_URL = 'http://matsumoto26sunday.appspot.com/spread';

  var scores_ = [],
      spread_ = {};

  function getScores() {
    return scores_;
  }
  
  function getSpread() {
    return spread_;
  }

  function init(opt_loadingBar) {
    if(opt_loadingBar !== undefined)
      opt_loadingBar.init(DEPENDENCIES);
  
    updateScores(opt_loadingBar);
    fetchSpread_(opt_loadingBar);
  }
  
  function updateScores(opt_loadingBar) {
    $.get(SCORE_URL)
        .success(function(scoreData) {
          scores_ = scoreData;
          deployScoreboard_(scores_);
        }).
        complete(function() {
          if(opt_loadingBar !== undefined)
            opt_loadingBar.itemLoaded(showAll);
        });
  }
  
  function deployScoreboard_(score) {
    var current = {},
        favorite = '',
        scoreboard = {'scores': []},
        scoreLength = score.length,
        spreadLine = 0.0;
    
    score.reverse();
    for(var i = scoreLength - 1; i >= 0; i -= 1) {
      current = score[i];
      
      spreadLine = current[SCORES_GAME_LINE];      
      if(spreadLine < 0)
        favorite = current[SCORES_HOME_NAME];
      else {
        favorite = current[SCORES_AWAY_NAME];
        spreadLine *= -1;
      }
      
      scoreboard['scores'].push({
        'awayName': current[SCORES_AWAY_NAME],
        'awayScore': current[SCORES_AWAY_SCORE],
        'favoriteShort': favorite,
        'favoriteLong': favorite,
        'gameClock': current[SCORES_GAME_CLOCK],
        'gameStatus': current[SCORES_GAME_STATUS],
        'gameStartDay': current[SCORES_GAME_START_DAY],
        'gameStartTime': current[SCORES_GAME_START_TIME],
        'homeName': current[SCORES_HOME_NAME],
        'homeScore': current[SCORES_HOME_SCORE],
        'line': spreadLine,
        'margin': current[SCORES_GAME_MARGIN],
        'pickedTeam': '--',
        'totalScore': (current[SCORES_GAME_MARGIN]) ? '--' : 0
      });
      
      //Render the scoreboard
      $('#gameScores').empty().html(
        $.render.tmpl_scoreboard(scoreboard)
      );

      // Enable expansion of spread details
      $('ul#expandSpreadDetails').click(scoreboardDrawer_);
    }
  }
  
  function showAll() {
    // Cannot tell if this makes not-so loose coupling
    $('#sectionLoading').css({
      'display': 'none'
    });
  
    $('#sectionSpread').css({
      'max-height': BIG_NUMBER + 'px',
      'visibility': 'visible'
    });
  }
  
  function applySpread_() {
    var combinedScore = 0,
        current = {},
        element = {},
        index = 0,
        person = $('#selectSpread').find('option:selected').text(),
        scoreboard = $('#gameScores > article > section:nth-child(1)'),
        scoreDiff = 0.0,
        scores = getScores(),
        scoresLength = scores.length,
        spreadDetails = $('#gameScores > article > section:nth-child(2)'),
        spreadDetailsIndex = 0,
        tally = 0,
        teamName = '',
        totalScore = 0;
    
    current = getSpread()[person];
    for(var i = scoresLength - 1; i >= 0; i -= 1) {
      combinedScore = parseInt(scores[i][SCORES_AWAY_SCORE]) + 
          parseInt(scores[i][SCORES_HOME_SCORE]);

      for(index = 0; index < current.length; index += 1) {
        teamName = current[index][SPREAD_TEAM_NAME];
        //Fix for differences in Arizona short-hand spelling
        teamName = (teamName === 'AZ') ? 'ARI' : teamName;

        if(teamName === scores[i][SCORES_AWAY_NAME] ||
            teamName === scores[i][SCORES_HOME_NAME]) {
          totalScore = current[index][SPREAD_TOTAL_SCORE];
          break;
        }
      }
      
      // Safety catch to skip if we don't find the correct team
      if(index >= current.length)
        continue;
      
      /*
       * Dynamic Elements
       */
       
      // 'spreadDetails' is reversed, so we need to invert the index
      // for spreaDetails
      spreadDetailsIndex = (scoresLength - 1) - i;
      
      // Embed the player's picked team
      $('#teamChoice > li:nth-child(2)', spreadDetails[spreadDetailsIndex])
          .text(teamName);

      // Dynamically embed the total score in the detail drawer
      $('#totalScore > li:nth-child(2)', spreadDetails[spreadDetailsIndex])
          .text(totalScore + ' (' + combinedScore + ')');

      // Emphasize the player's choice on over/under margin
      if(current[index][SPREAD_MARGIN]) {
        element = $('#margin > li:nth-child(1)',
            spreadDetails[spreadDetailsIndex]);
        element.html('Over/Under');  // Reset

        if(current[index][SPREAD_MARGIN] === 'UN') {
          element.html('Over/<span>Under</span>');
        } else if(current[index][SPREAD_MARGIN] === 'OV') {
          element.html('<span>Over</span>/Under');
        }
      }
      
      // Only calculate spread-line on games that are started
      if(scores[i][SCORES_GAME_STATUS] === 'Pregame')
        continue;
      
      /*
       * Highlights
       */

      // Check for winner
      // HomeScore + Odds - AwayScore; positive means home wins
      scoreDiff = parseInt(scores[i][SCORES_HOME_SCORE]) +
          parseInt(scores[i][SCORES_GAME_LINE]) -
          parseInt(scores[i][SCORES_AWAY_SCORE]);

      if(scoreDiff > 0 && teamName === scores[i][SCORES_HOME_NAME]) {
        // Entire scorebox
        $(scoreboard[spreadDetailsIndex])
            .removeClass('white')
            .removeClass('red')
            .addClass('green');
        // Spread-details drawer
        $('#teamChoice > li:nth-child(2)', spreadDetails[spreadDetailsIndex])
            .removeClass('white')
            .removeClass('red')
            .addClass('green');

        tally += 1;
      } else if(scoreDiff < 0 && teamName === scores[i][SCORES_AWAY_NAME]) {
        // Entire scorebox
        $(scoreboard[spreadDetailsIndex])
            .removeClass('white')
            .removeClass('red')
            .addClass('green');
        // Spread-details drawer
        $('#teamChoice > li:nth-child(2)', spreadDetails[spreadDetailsIndex])
            .removeClass('white')
            .removeClass('red')
            .addClass('green');

        tally += 1;
      } else {
        // Entire scorebox
        $(scoreboard[spreadDetailsIndex])
            .removeClass('white')
            .removeClass('green')
            .addClass('red');
        // Spread-details drawer
        $('#teamChoice > li:nth-child(2)', spreadDetails[spreadDetailsIndex])
            .removeClass('white')
            .removeClass('green')
            .addClass('red');
      }
      
      // Highlight if score is within scoring range
      if(totalScore >= (combinedScore - 3) &&
          totalScore <= (combinedScore + 3)) {
        $('#totalScore > li:nth-child(2)', spreadDetails[spreadDetailsIndex])
            .removeClass('red')
            .removeClass('white')
            .addClass('green');

        tally += 1;
        // Extra point for getting exact total score.
        if(totalScore == combinedScore)
          tally += 1;    
      }
      else {
        $('#totalScore > li:nth-child(2)', spreadDetails[spreadDetailsIndex])
            .removeClass('white')
            .removeClass('green')
            .addClass('red');
      }

      // Highlight correct margin
      if(current[index][SPREAD_MARGIN] === 'UN' &&
          combinedScore < scores[i][SCORES_GAME_MARGIN]) {
        // UNDER is successful
        $('#margin > li:nth-child(2)', spreadDetails[spreadDetailsIndex])
            .removeClass('red')
            .removeClass('white')
            .addClass('green');
              
        tally += 1;
      } else if(current[index][SPREAD_MARGIN] === 'OV' &&
          combinedScore > scores[i][SCORES_GAME_MARGIN]) {
        // OVER is successful
        $('#margin > li:nth-child(2)', spreadDetails[spreadDetailsIndex])
            .removeClass('red')
            .removeClass('white')
            .addClass('green');
              
        tally += 1;
      } else {
        // Failed margin
        $('#margin > li:nth-child(2)', spreadDetails[spreadDetailsIndex])
            .removeClass('green')
            .removeClass('white')
            .addClass('red');
      }
    }
    
    // Update spread tally
    $('#selectTally').text(tally);
  }
  
  function deploySpread_(spread) {
    var list = [],
        players = Object.keys(spread).sort().reverse(),
        playersLength = players.length,
        result = '';

    for(var i = playersLength - 1; i >= 0; i -= 1) {
      list.push($.render.tmpl_listoption({
        'name': players[i],
        'value': playersLength - i
      }));
    }
    result = list.join('');

    // Load the list selector
    $('#selectSpread').html(result);
  }
  
  function fetchSpread_(opt_loadingBar) {
    $.get(SPREAD_URL)
        .success(function(spreadData) {
          spread_ = spreadData;
          deploySpread_(spread_);
          
          // Enable the spread-select button
          $('#selectButton').click(applySpread_);
        })
        .complete(function() {
          if(opt_loadingBar !== undefined)
            opt_loadingBar.itemLoaded(showAll);
        });
  }
  
  function scoreboardDrawer_() {
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
    } else {
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
  }
  
  return {
    'getScores': getScores,
    'getSpread': getSpread,
    'init': init,
    'showAll': showAll,
    'updateScores': updateScores
  }
})(jQuery);

loadingBar = (function() {
  var loadedFiles_ = 0,
      totalFiles_ = 0,
      value_ = 0;

  function init(totalFiles) {
    loadedFiles_ = 0;
    totalFiles_ = totalFiles;
    value_ = 0;
  }
  
  function itemLoaded(opt_complete) {
    loadedFiles_ += 1;
    setValue_(loadedFiles_ * 100 / totalFiles_);
    
    // Are all the files loaded?
    if(loadedFiles_ === totalFiles_) {
      setTimeout(function() { hide(); }, 500);
      
      if(opt_complete !== undefined)
        setTimeout(function() { opt_complete(); }, 1000);
    }
  }
  
  function hide() {
    var loadingBox = document.getElementById('sectionLoading');

    loadingBox.style.height = '0px';
    loadingBox.style.padding = '0px';
    loadingBox.style.borderWidth = '0px';
    loadingBox.style.visibility = 'hidden';
  }
  
  function reset() {
    init(totalFiles_);
    setValue_(value_);
  }
  
  // Set the value position of the bar (Only 0-100 values allowed)
  function setValue_(value) {
    if(value >= 0 && value <= 100) {
      document.getElementById('loadingProgressBar')
          .style.width = value + '%';
      document.getElementById('loadingProgress')
          .innerHTML = parseInt(value) + '%';
    }
  }

  return {
    'hide': hide,
    'init': init,
    'itemLoaded': itemLoaded,
    'reset': reset
  }
})();
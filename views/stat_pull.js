var calcCounter = 0,
    stats = {};

var PPU_FIRST_DOWN = 1.140160643,
    PPU_PASS = 0.096563805,
    PPU_RUSH = 0.18933609,
    TOTAL_SEASON_GAMES = 16;

/***
 * Initialize all functions and features
 */
$(document).ready(function() {
  var templates = $('script[data-jsv-tmpl]'),
      url_stats = 'http://matsumoto26sunday.appspot.com/stats';

  // Fetch & load stats data 
  $.when($.get(url_stats))
      .done(function(statData) {
        stats = statData;
        loadData_(stats);
      });

  // Load templates from DOM
  for(var i = templates.length - 1; i >= 0; i -= 1) {
    templateName = $(templates[i]).attr('id');
    $.templates(templateName, templates[i]);
  }

  // Initialize calculate button
  $('.button').click(calculate_);
});

var calculate_ = (function() {
    var awayTeam = $('#awayList').find('option:selected').text(),
        defenseStats,
        homeTeam = $('#homeList').find('option:selected').text();

    // Unhide the results block
    if(++calcCounter)
      $('#results').removeClass('hidden');

    // Insert the results
    $('#scoreBox').empty().html(
      $.render.singleResult({
        'value': estimateTotal_(stats[homeTeam], stats[awayTeam])
      })
    );

    offenseStats = estimateSquad_(stats[homeTeam]['offense'],
                                  stats[awayTeam]['offense']);
    $('#offenseBox > ol').empty().html(
      $.render.displayStats({
        'title': [
          'First Downs',
          'Pass Yards',
          'Rush Yards'
        ],
        'stats': [
          offenseStats.firstDown,
          offenseStats.pass,
          offenseStats.rush
        ]
      })
    );

    defenseStats = estimateSquad_(stats[homeTeam]['defense'],
                                  stats[awayTeam]['defense']);
    $('#defenseBox > ol').empty().html(
      $.render.displayStats({
        'title': [
          'First Downs',
          'Pass Yards',
          'Rush Yards'
        ],
        'stats': [
          defenseStats.firstDown,
          defenseStats.pass,
          defenseStats.rush
        ]
      })
    );
});

var estimateSquad_ = (function(homeTeam, awayTeam) {
  var awayTeamFirstDown = awayTeam['first_down']/TOTAL_SEASON_GAMES,
      awayTeamPass = awayTeam['pass']/TOTAL_SEASON_GAMES,
      awayTeamRush = awayTeam['rush']/TOTAL_SEASON_GAMES,
      homeTeamFirstDown = homeTeam['first_down']/TOTAL_SEASON_GAMES,
      homeTeamPass = homeTeam['pass']/TOTAL_SEASON_GAMES,
      homeTeamRush = homeTeam['rush']/TOTAL_SEASON_GAMES,
      result = {};


  result['firstDown'] = {
    'average': (awayTeamFirstDown + homeTeamFirstDown)/2,
    'away': awayTeamFirstDown,
    'home': homeTeamFirstDown,
    'weighted': (awayTeamFirstDown + homeTeamFirstDown)/2 * PPU_FIRST_DOWN
  }
  
  result['pass'] = {
    'average': (awayTeamPass + homeTeamPass)/2,
    'away': awayTeamPass,
    'home': homeTeamPass,
    'weighted': (awayTeamPass + homeTeamPass)/2 * PPU_PASS
  }
  
  result['rush'] = {
    'average': (awayTeamRush + homeTeamRush)/2,
    'away': awayTeamRush,
    'home': homeTeamRush,
    'weighted': (awayTeamRush + homeTeamRush)/2 * PPU_RUSH
  }
  
  return result;
});

// TODO: Some of these calculations will occur twice
//        in other portions of the code. Refactor
//        to reduce the amount of calculations
var estimateTotal_ = (function(firstTeam, secondTeam) {
  var avgDefense,
      avgDefenseFirstDown,
      avgDefensePass,
      avgDefenseRush,
      avgOffense,
      avgOffenseFirstDown,
      avgOffensePass,
      avgOffenseRush,
      firstDefense = firstTeam.defense,
      firstOffense = firstTeam.offense,
      secondDefense = secondTeam.defense,
      secondOffense = secondTeam.offense;

  avgDefenseFirstDown = (firstDefense['first_down']/TOTAL_SEASON_GAMES + 
      secondDefense['first_down']/TOTAL_SEASON_GAMES)/2;
  avgOffenseFirstDown = (firstOffense['first_down']/TOTAL_SEASON_GAMES + 
      secondOffense['first_down']/TOTAL_SEASON_GAMES)/2;

  avgDefensePass = (firstDefense.pass/TOTAL_SEASON_GAMES + 
      secondDefense.pass/TOTAL_SEASON_GAMES)/2;
  avgOffensePass = (firstOffense.pass/TOTAL_SEASON_GAMES + 
      secondOffense.pass/TOTAL_SEASON_GAMES)/2;
    
  avgDefenseRush = (firstDefense.rush/TOTAL_SEASON_GAMES + 
      secondDefense.rush/TOTAL_SEASON_GAMES)/2;
  avgOffenseRush = (firstOffense.rush/TOTAL_SEASON_GAMES + 
      secondOffense.rush/TOTAL_SEASON_GAMES)/2;

  avgDefense = (avgDefenseFirstDown * PPU_FIRST_DOWN + 
      avgDefensePass * PPU_PASS + avgDefenseRush * PPU_RUSH)/3;
  avgOffense = (avgOffenseFirstDown * PPU_FIRST_DOWN +
      avgOffensePass * PPU_PASS + avgOffenseRush * PPU_RUSH)/3;

    return avgDefense + avgOffense;
});

var loadData_ = (function(data) {
  var element = '',
      teams = Object.keys(stats).sort().reverse();        

  for(var i = teams.length - 1; i >= 0; i -= 1) {
    element += $.render.listOption({
      'name': teams[i],
      'value': teams.length-i
    });
  }

  $('#homeList').html(element);
  $('#awayList').html(element);
});
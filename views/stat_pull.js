var calcCounter = 0,
    stats = {};

var PPU_FIRST_DOWN = 1.140160643,
    PPU_PASS = 0.096563805,
    PPU_RUSH = 0.18933609,
    TOTAL_SEASON_GAMES = 16;


$(document).ready(function() {
  var url_stats = 'http://matsumoto26sunday.appspot.com/stats',
      url_templates = 'http://matsumoto26sunday.appspot.com/templates';

  $.when($.get(url_templates))
      .done(function(tmplData) {
        var templateName,
            templates = $(tmplData).filter('script');
        
        for(var i = templates.length - 1; i >= 0; i -= 1) {
          templateName = $(templates[i]).attr('id');
          $.templates(templateName, templates[i]);
        }
        
        $.when($.get(url_stats))
            .done(function(statData) {
              stats = statData;
              loadData_(stats);
            });
      });

  // Initialize calculate button
  $('.button').click(function () {
    var awayTeam = $('#awayList').find('option:selected').text(),
        homeTeam = $('#homeList').find('option:selected').text(),
        result;

    result = {
      'estTotalScore': estimateTotal_(stats[homeTeam], stats[awayTeam])
    }

    displayResults_(result);
  });
});

var displayResults_ = (function(result) {
    if(++calcCounter)
      $('#results').removeClass('hidden');

    $('#results > ol').empty().html(
      $.render.singleResult({
        'value': result.estTotalScore
      })
    );
});

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
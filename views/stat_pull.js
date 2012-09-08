var stats = {};

var PPU_FIRST_DOWN = 1.140160643,
    PPU_PASS = 0.096563805,
    PPU_RUSH = 0.18933609,
    TOTAL_SEASON_GAMES = 16;


$(document).ready(function() {
  var url = 'http://matsumoto26sunday.appspot.com/stats';

  $.get(url, function(data) {
    stats = data;

        // Fetch the style templates to display the data
        /*
        $.get('./templates.html', function(templates) {
            $('body').append(templates);

            loadData_(stats);
        });
        */
    loadData_(stats);
  });
    
  // Initialize calculate button
  $('.button').click(function () {
    var awayTeam = $('#awayList').find('option:selected').text(),
        homeTeam = $('#homeList').find('option:selected').text(),
        result;

    result = estimateTotal_(stats[homeTeam], stats[awayTeam]);
    
    console.log('result:  ' + result);

    //engageMatch_(homeTeam, awayTeam);
  });
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

    console.log(firstDefense);

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

var engageMatch_ = (function(firstTeamName, secondTeamName) {
    var firstTeam = stats[firstTeamName]['offense'],
        secondTeam = stats[secondTeamName]['offense'],
        values = {};
    
    $('#results').removeClass('hidden');
    $('#results > ol').empty();
    $('#offenseResults').tmpl(values).appendTo('#results');
});

var loadData_ = (function(data) {
    var element = '',
        teams = Object.keys(stats).sort().reverse();        

    for(var i = teams.length - 1; i >= 0; i -= 1) {
        element += '<option value="' + i + '">' + teams[i] + '</option>';
    }
    
    $('#homeList').append(element);
    $('#awayList').append(element);
});
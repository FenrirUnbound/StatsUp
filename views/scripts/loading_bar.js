var loading_bar = loading_bar || {};

loading_bar = (function() {
  var loadedFiles_ = 0,
      totalFiles_ = 0,
      value_ = 0;

  function init(totalFiles) {
    totalFiles_ = totalFiles;
  }

  function run() {
    return true;
  }
  
  function loaded_() {
    loadedFiles += 1;
    setValue_(loadedFiles_ * 100 / totalFiles_);
    
    // Are all the files loaded?
    if(loadedFiles_ === totalFiles_)
      setTimeout('myBar.hide()', 300);
  }
  
  // Center in the screen
  function locate_() {
    var loadingZone = document.getElementById('loadingZone'),
        popupHeight = loadingZone.clientHeight,
        popupWidth = loadingZone.clientWidth,
        windowHeight = document.documentElement.clientHeight,
        windowWidth = document.documentElement.clientWidth;
        
    loadingZone.style.position = 'absolute';
    loadingZone.style.top = parseInt(windowHeight/2-popupHeight/2) + 'px';
    loadingZone.style.left = parseInt(windowWidth/2-popupWidth/2) + 'px';
  }
  
  // Set the bottom text value
  function setAction_(action) {
    document.getElementById('infoLoading').innerHTML = action;
  }
  
  // Set the value position of the bar (Only 0-100 values allowed)
  function setValue_(value) {
    if(value >= 0 && value <= 100) {
      document.getElementById('progressBar').style.width = value + '%';
      document.getElementById('infoProgress').innerHTML = parseInt(value) + '%';
    }
  }

  return {
    'init': init,
    'run': run
  }
})();
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
  
  function loaded() {
    loadedFiles_ += 1;
    setValue_(loadedFiles_ * 100 / totalFiles_);
    
    // Are all the files loaded?
    if(loadedFiles_ === totalFiles_)
      setTimeout('loading_bar.hide()', 300);
  }
  
  function hide() {
    document.getElementById('loadingSection').style.visibility = 'hidden';
  }
  
  // Center in the screen
  function locate_() {
    var loadingZone = document.getElementById('loadingSection'),
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
    document.getElementById('loadingInfo').innerHTML = action;
  }
  
  // Set the value position of the bar (Only 0-100 values allowed)
  function setValue_(value) {
    if(value >= 0 && value <= 100) {
      document.getElementById('loadingProgressBar').style.width = value + '%';
      document.getElementById('loadingProgress').innerHTML = parseInt(value) + '%';
    }
  }

  return {
    'hide': hide,
    'init': init,
    'loaded': loaded,
    'run': run
  }
})();
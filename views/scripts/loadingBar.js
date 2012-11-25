var loadingBar = loadingBar || {};

loadingBar = (function() {
  var loadedFiles_ = 0,
      totalFiles_ = 0,
      value_ = 0;

  function init(totalFiles) {
    loadedFiles_ = 0;
    totalFiles_ = totalFiles;
    value_ = 0;
  }
  
  function itemLoaded() {
    loadedFiles_ += 1;
    setValue_(loadedFiles_ * 100 / totalFiles_);
    
    // Are all the files loaded?
    if(loadedFiles_ === totalFiles_) {
      setTimeout('loadingBar.hide()', 1000);
    }
  }
  
  function hide() {
    document.getElementById('sectionLoading').style.display = 'none';
  }
  
  function reset() {
    init(totalFiles_);
    setValue_(value_);
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
    'itemLoaded': itemLoaded
  }
})();
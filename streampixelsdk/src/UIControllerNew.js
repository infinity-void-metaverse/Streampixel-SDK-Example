class UIControllerNew {

  constructor(uiControlOptions) {
    this.uiControlOptions = uiControlOptions;

    this.audioEnabled = true;
    this.maxWidth =  this.uiControlOptions.maxWidth;
    this.maxHeight =  this.uiControlOptions.maxHeight;

    if ( this.uiControlOptions.resolutionMode === "Dynamic Resolution Mode") {
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.handleResize();  
        }, 200);
      });
    }
  }




  toggleAudio() {
    const audioElement = this.uiControlOptions.appStream.stream._webRtcController.streamController.audioElement;
    audioElement.play();
    audioElement.muted = !this.audioEnabled;
    this.audioEnabled = !this.audioEnabled;
  }



  handleResMax(value) {
    const hwsplit = value.split('x');

    if (this.uiControlOptions.resolutionMode === "Dynamic Resolution Mode" ||
        this.uiControlOptions.resolutionMode === "Crop on Resize Mode") {
      
      this.maxHeight = parseInt(hwsplit[1], 10);
      this.maxWidth = parseInt(hwsplit[0], 10);
      this.handleResize();
    } else {
      if (this.uiControlOptions.appStream.stream) {
        const resolutionNew = value + 'f';
        this.uiControlOptions.appStream.stream.emitConsoleCommand(`r.SetRes ${resolutionNew}`);
      }
    }
  }

  handleResize() {

    const viewportH = Math.floor(window.innerHeight * window.devicePixelRatio);
    const viewportW = Math.floor(window.innerWidth * window.devicePixelRatio);
    const maxPixel = Math.floor(this.maxHeight * this.maxWidth);
    const viewportPixel = viewportH * viewportW;

    let resolution;
    if (maxPixel > viewportPixel) {
      resolution = `${viewportW}x${viewportH}f`;
    } else {
      const divideFactor = Math.min(this.maxWidth / viewportW, this.maxHeight / viewportH);
      const resW = Math.floor(divideFactor * viewportW);
      const resH = Math.floor(divideFactor * viewportH);
      resolution = `${resW}x${resH}f`;
    }

    this.handleResolution(resolution);
  }

  handleResolution(resolution) {

    if (this.uiControlOptions.appStream.stream) {
      this.uiControlOptions.appStream.stream.emitConsoleCommand(`r.SetRes ${resolution}`);
    }

  }

   parseStatistics(statsDiv) {
  const stats = {};

  if (!statsDiv) return stats;

  statsDiv.querySelectorAll("div").forEach(child => {
    const text = child.textContent;
    const [key, value] = text.split(":").map(str => str.trim());

    let parsedValue;
    if (value === "true") parsedValue = true;
    else if (value === "false") parsedValue = false;
    else if (!isNaN(value.replace(/,/g, ''))) parsedValue = parseFloat(value.replace(/,/g, ''));
    else parsedValue = value;

    stats[key] = parsedValue;
  });

  return stats;
}

  getStreamStats() {
    this.uiControlOptions.appStream.statsPanel.show();
    const statsElement = this.uiControlOptions.appStream.statsPanel._statsResult;
    const statsJSON = this.parseStatistics(statsElement);
    return statsJSON;
  }
}

module.exports = UIControllerNew;  

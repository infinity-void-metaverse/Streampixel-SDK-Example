// src/UIController.js
class UIController {
  constructor(uiControlOptions) {
    console.log("uiControlOptions:", uiControlOptions);
    this.uiControlOptions = uiControlOptions;

    this.audioEnabled = true;
    this.fullscreen = false;

    this.maxWidth = 0;
    this.maxHeight = 0;
    this.activeResolution = null;
    this.lastTimeResized = Date.now();

    this.createUI();
    this.injectStyles();
    this.injectSVGIcons();
    this.updateAudioIcon();
    this.updateScreenIcon();

    this.audioBtn.addEventListener('click', () => this.toggleAudio());
    this.screenBtn.addEventListener('click', () => this.toggleFullscreen());
    document.addEventListener('fullscreenchange', () => {
      this.fullscreen = !!document.fullscreenElement;
      this.updateScreenIcon();
    });

    window.addEventListener('resize', () => this.handleResize());
  }

  createUI() {
    this.controlBar = document.createElement('div');
    this.controlBar.id = 'control-bar';

    this.audioBtn = document.createElement('button');
    this.audioIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.audioBtn.appendChild(this.audioIcon);

    this.screenBtn = document.createElement('button');
    this.screenIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.screenBtn.appendChild(this.screenIcon);

    this.controlBar.appendChild(this.audioBtn);
    this.controlBar.appendChild(this.screenBtn);
    document.body.appendChild(this.controlBar);
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #control-bar {
          position: fixed;
          bottom: 20px;
          left: 20px;
          display: flex;
          gap: 10px;
          background: rgba(0, 0, 0, 0.6);
          padding: 10px 15px;
          border-radius: 10px;
          z-index: 1000;
      }
      #control-bar button {
          background: none;
          border: none;
          padding: 5px;
          cursor: pointer;
          color: white;
      }
      #control-bar svg {
          fill: white;
          width: 24px;
          height: 24px;
      }
    `;
    document.head.appendChild(style);
  }

  injectSVGIcons() {
    this.icons = {
      micOn: `<path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z"/><path d="M19 11a7 7 0 01-14 0h2a5 5 0 0010 0h2z"/>`,
      micOff: `<path d="M15 11V5a3 3 0 00-6 0v1.18l6.82 6.82A2.99 2.99 0 0015 11z"/><path d="M4.27 3L3 4.27 7.73 9H5v2a7 7 0 0012.9 2.32l1.81 1.81 1.27-1.27L4.27 3z"/>`,
      fullscreen: `<path d="M7 14H5v5h5v-2H7v-3zm0-4h2V7h3V5H7v5zm10 0V7h-3V5h5v5h-2zm0 4h2v5h-5v-2h3v-3z"/>`,
      exitFullscreen: `<path d="M9 14H5v5h5v-2H7v-3h2v-2zm0-4V7h2v3h3v2H9zm6 4v2h2v3h-3v2h5v-5h-4zm0-6h3v3h-2V9h-3V7h2z"/>`
    };
  }

  updateAudioIcon() {
    this.audioIcon.innerHTML = this.audioEnabled ? this.icons.micOn : this.icons.micOff;
    this.audioIcon.setAttribute("viewBox", "0 0 24 24");
  }

  updateScreenIcon() {
    this.screenIcon.innerHTML = this.fullscreen ? this.icons.exitFullscreen : this.icons.fullscreen;
    this.screenIcon.setAttribute("viewBox", "0 0 24 24");
  }

  toggleAudio() {
    this.audioEnabled = !this.audioEnabled;
    this.updateAudioIcon();
    console.log(`Audio ${this.audioEnabled ? 'on' : 'muted'}`);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  handleResMax(value, resolution) {
    const hwsplit = value.split('x');
    this.activeResolution = resolution;

    if (this.uiControlOptions.resolutionMode === "Dynamic Resolution Mode" ||
        this.uiControlOptions.resolutionMode === "Crop on Resize Mode") {
      
      this.maxHeight = parseInt(hwsplit[1], 10);
      this.maxWidth = parseInt(hwsplit[0], 10);
      this.handleResize();
    } else {
      if (this.uiControlOptions.stream) {
        const resolutionNew = value + 'f';
        this.uiControlOptions.stream.emitConsoleCommand(`r.SetRes ${resolutionNew}`);
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
    const now = Date.now();
    const timeSinceLastResize = now - this.lastTimeResized;

    if (this.uiControlOptions.stream) {
      this.uiControlOptions.stream.emitConsoleCommand(`r.SetRes ${resolution}`);
    }

    this.lastTimeResized = now;
  }

  getStreamStats() {
    console.log("STATS");
  }
}

module.exports = UIController;  // Exports using CommonJS

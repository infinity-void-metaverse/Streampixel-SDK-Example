// Copyright Epic Games, Inc. All Rights Reserved.

import { ActionOverlay } from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.5';

/**
 * Show an overlay for when the session is unattended, it begins a countdown timer, which when elapsed will disconnect the stream.
 */
export class AFKOverlay extends ActionOverlay {
    /**
     * @returns The created root element of this overlay.
     */
    static createRootElement() {


        
        const afkOverlayHtml = document.createElement('div');
        afkOverlayHtml.style.zIndex = 1000;
        afkOverlayHtml.id = 'afkOverlay';
        afkOverlayHtml.className = 'clickableState';
        return afkOverlayHtml;
    }

    /**
     * @returns The created content element of this overlay, which contain some text for an afk count down.
     */
    static createContentElement() {
        const afkOverlayHtmlInner = document.createElement('div');
        afkOverlayHtmlInner.id = 'afkOverlayInner';
        afkOverlayHtmlInner.innerHTML =
            '<center>No activity detected<br>Disconnecting in <span id="afkCountDownNumber"></span> seconds<br>Click to continue<br></center>';



        return afkOverlayHtmlInner;
    }

    /**
     * Construct an Afk overlay
     * @param parentElement - the element this overlay will be inserted into
     */
    constructor(rootDiv) {
        super(
            rootDiv,
            AFKOverlay.createRootElement(),
            AFKOverlay.createContentElement()
        );

        this.rootElement.addEventListener('click', () => {
            this.activate();

           const message = {
                "type": "stream-state",
                "value": "afkAbort"
              }
      
              window.parent.postMessage(message, "*");

        });
    }

    /**
     * Update the count down spans number for the overlay
     * @param countdown - the count down number to be inserted into the span for updating
     */
    updateCountdown(countdown) {
        this.textElement.innerHTML = `<center>No activity detected<br>Disconnecting in <span id="afkCountDownNumber">${countdown}</span> seconds<br>Click to continue<br></center>`;
    }
}

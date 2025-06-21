// Copyright Epic Games, Inc. All Rights Reserved.

import { ActionOverlay } from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.5';

/**
 * Overlay shown during disconnection, has a reconnection element that can be clicked to reconnect.
 */
export class DisconnectOverlay extends ActionOverlay {
    /**
     * @returns The created root element of this overlay.
     */
    static createRootElement() {
        const disconnectOverlayHtml = document.createElement('div');
        disconnectOverlayHtml.style.zIndex = 1000;
        disconnectOverlayHtml.id = 'disconnectOverlay';
        disconnectOverlayHtml.className = 'clickableState';
        return disconnectOverlayHtml;
    }

    /**
     * @returns The created content element of this overlay, which contains whatever content this element contains, like text or a button.
     */
    static createContentElement() {
        // build the inner html container
        const disconnectOverlayHtmlContainer = document.createElement('div');
        disconnectOverlayHtmlContainer.id = 'disconnectButton';
        disconnectOverlayHtmlContainer.innerHTML = 'Click To Restart';

        return disconnectOverlayHtmlContainer;
    }

    /**
     * Construct a disconnect overlay with a retry connection icon.
     * @param parentElem - the parent element this overlay will be inserted into.
     */
    constructor(parentElem) {
        super(
            parentElem,
            DisconnectOverlay.createRootElement(),
            DisconnectOverlay.createContentElement()
        );

        // add the new event listener
        this.rootElement.addEventListener('click', () => {
          window.location.reload();
        });
    }
}

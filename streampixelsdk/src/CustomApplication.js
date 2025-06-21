// CustomApplication.js

const { Application,  PlayOverlay, InfoOverlay, ErrorOverlay,PixelStreamingApplicationStyle } = require('@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.5');
const {ConnectOverlay} = require('./ConnectOverlay');
const {DisconnectOverlay} = require('./DisconnectOverlay');
const {AFKOverlay} = require('./AFKOverlay');



/*const PixelStreamingApplicationStyles = new StreamingApplicationStyles();
PixelStreamingApplicationStyles.applyStyleSheet();
*/

const PixelStreamingApplicationStyles =new PixelStreamingApplicationStyle();
PixelStreamingApplicationStyles.applyStyleSheet();


function hideLoadingSpinner() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

class CustomApplication extends Application {
    

    
    createOverlays() {
        this.disconnectOverlay = new DisconnectOverlay(this.stream.videoElementParent);
        this.disconnectOverlay.onAction(() => this.stream.reconnect());

        this.connectOverlay = new ConnectOverlay(this.stream.videoElementParent);

  
        var wsController = this.stream.signallingProtocol;
        
   
    var isConnected = wsController.isConnected();
   if(isConnected){
    
    wsController.transport.on('message', (msgRaw) => {
        try {
            

            if(msgRaw.message == "You are in Queue"){

                var msgFormate = msgRaw.message +" "+msgRaw.position;

                this.showTextOverlay(msgFormate);
        
        
            }

            


        } catch (error) {
            console.error("Failed to parse message:", error);
            return;
        }
    })

   }
   
        this.connectOverlay.onAction(() => this.stream.connect());

        this.playOverlay = new PlayOverlay(this.stream.videoElementParent);

        this.playOverlay.onAction(() => this.stream.videoElementParent);

        this.infoOverlay = new InfoOverlay(this.stream.videoElementParent);
        this.errorOverlay = new ErrorOverlay(this.stream.videoElementParent);

       this.afkOverlay = new AFKOverlay(this.stream.videoElementParent);
    }
}
    


module.exports = CustomApplication;

// CustomApplication.js

const {WebSocketTransport } = require('@epicgames-ps/lib-pixelstreamingcommon-ue5.5');


class WebSocketController extends WebSocketTransport {
    
handleOnMessage(msg){
}

    handleOnClose(event){
    }

}

module.exports = WebSocketController;

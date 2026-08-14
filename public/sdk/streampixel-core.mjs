var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/sdp/sdp.js
var require_sdp = __commonJS({
  "node_modules/sdp/sdp.js"(exports, module) {
    "use strict";
    var SDPUtils2 = {};
    SDPUtils2.generateIdentifier = function() {
      return Math.random().toString(36).substring(2, 12);
    };
    SDPUtils2.localCName = SDPUtils2.generateIdentifier();
    SDPUtils2.splitLines = function(blob) {
      return blob.trim().split("\n").map((line) => line.trim());
    };
    SDPUtils2.splitSections = function(blob) {
      const parts = blob.split("\nm=");
      return parts.map((part, index) => (index > 0 ? "m=" + part : part).trim() + "\r\n");
    };
    SDPUtils2.getDescription = function(blob) {
      const sections = SDPUtils2.splitSections(blob);
      return sections && sections[0];
    };
    SDPUtils2.getMediaSections = function(blob) {
      const sections = SDPUtils2.splitSections(blob);
      sections.shift();
      return sections;
    };
    SDPUtils2.matchPrefix = function(blob, prefix) {
      return SDPUtils2.splitLines(blob).filter((line) => line.indexOf(prefix) === 0);
    };
    SDPUtils2.parseCandidate = function(line) {
      let parts;
      if (line.indexOf("a=candidate:") === 0) {
        parts = line.substring(12).split(" ");
      } else {
        parts = line.substring(10).split(" ");
      }
      const candidate = {
        foundation: parts[0],
        component: { 1: "rtp", 2: "rtcp" }[parts[1]] || parts[1],
        protocol: parts[2].toLowerCase(),
        priority: parseInt(parts[3], 10),
        ip: parts[4],
        address: parts[4],
        // address is an alias for ip.
        port: parseInt(parts[5], 10),
        // skip parts[6] == 'typ'
        type: parts[7]
      };
      for (let i = 8; i < parts.length; i += 2) {
        switch (parts[i]) {
          case "raddr":
            candidate.relatedAddress = parts[i + 1];
            break;
          case "rport":
            candidate.relatedPort = parseInt(parts[i + 1], 10);
            break;
          case "tcptype":
            candidate.tcpType = parts[i + 1];
            break;
          case "ufrag":
            candidate.ufrag = parts[i + 1];
            candidate.usernameFragment = parts[i + 1];
            break;
          default:
            if (candidate[parts[i]] === void 0) {
              candidate[parts[i]] = parts[i + 1];
            }
            break;
        }
      }
      return candidate;
    };
    SDPUtils2.writeCandidate = function(candidate) {
      const sdp = [];
      sdp.push(candidate.foundation);
      const component = candidate.component;
      if (component === "rtp") {
        sdp.push(1);
      } else if (component === "rtcp") {
        sdp.push(2);
      } else {
        sdp.push(component);
      }
      sdp.push(candidate.protocol.toUpperCase());
      sdp.push(candidate.priority);
      sdp.push(candidate.address || candidate.ip);
      sdp.push(candidate.port);
      const type = candidate.type;
      sdp.push("typ");
      sdp.push(type);
      if (type !== "host" && candidate.relatedAddress && candidate.relatedPort !== void 0) {
        sdp.push("raddr");
        sdp.push(candidate.relatedAddress);
        sdp.push("rport");
        sdp.push(candidate.relatedPort);
      }
      if (candidate.tcpType && candidate.protocol.toLowerCase() === "tcp") {
        sdp.push("tcptype");
        sdp.push(candidate.tcpType);
      }
      if (candidate.usernameFragment || candidate.ufrag) {
        sdp.push("ufrag");
        sdp.push(candidate.usernameFragment || candidate.ufrag);
      }
      return "candidate:" + sdp.join(" ");
    };
    SDPUtils2.parseIceOptions = function(line) {
      return line.substring(14).split(" ");
    };
    SDPUtils2.parseRtpMap = function(line) {
      let parts = line.substring(9).split(" ");
      const parsed = {
        payloadType: parseInt(parts.shift(), 10)
        // was: id
      };
      parts = parts[0].split("/");
      parsed.name = parts[0];
      parsed.clockRate = parseInt(parts[1], 10);
      parsed.channels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
      parsed.numChannels = parsed.channels;
      return parsed;
    };
    SDPUtils2.writeRtpMap = function(codec) {
      let pt = codec.payloadType;
      if (codec.preferredPayloadType !== void 0) {
        pt = codec.preferredPayloadType;
      }
      const channels = codec.channels || codec.numChannels || 1;
      return "a=rtpmap:" + pt + " " + codec.name + "/" + codec.clockRate + (channels !== 1 ? "/" + channels : "") + "\r\n";
    };
    SDPUtils2.parseExtmap = function(line) {
      const parts = line.substring(9).split(" ");
      return {
        id: parseInt(parts[0], 10),
        direction: parts[0].indexOf("/") > 0 ? parts[0].split("/")[1] : "sendrecv",
        uri: parts[1],
        attributes: parts.slice(2).join(" ")
      };
    };
    SDPUtils2.writeExtmap = function(headerExtension) {
      return "a=extmap:" + (headerExtension.id || headerExtension.preferredId) + (headerExtension.direction && headerExtension.direction !== "sendrecv" ? "/" + headerExtension.direction : "") + " " + headerExtension.uri + (headerExtension.attributes ? " " + headerExtension.attributes : "") + "\r\n";
    };
    SDPUtils2.parseFmtp = function(line) {
      const parsed = {};
      let kv;
      const parts = line.substring(line.indexOf(" ") + 1).split(";");
      for (let j = 0; j < parts.length; j++) {
        kv = parts[j].trim().split("=");
        parsed[kv[0].trim()] = kv[1];
      }
      return parsed;
    };
    SDPUtils2.writeFmtp = function(codec) {
      let line = "";
      let pt = codec.payloadType;
      if (codec.preferredPayloadType !== void 0) {
        pt = codec.preferredPayloadType;
      }
      if (codec.parameters && Object.keys(codec.parameters).length) {
        const params = [];
        Object.keys(codec.parameters).forEach((param) => {
          if (codec.parameters[param] !== void 0) {
            params.push(param + "=" + codec.parameters[param]);
          } else {
            params.push(param);
          }
        });
        line += "a=fmtp:" + pt + " " + params.join(";") + "\r\n";
      }
      return line;
    };
    SDPUtils2.parseRtcpFb = function(line) {
      const parts = line.substring(line.indexOf(" ") + 1).split(" ");
      return {
        type: parts.shift(),
        parameter: parts.join(" ")
      };
    };
    SDPUtils2.writeRtcpFb = function(codec) {
      let lines = "";
      let pt = codec.payloadType;
      if (codec.preferredPayloadType !== void 0) {
        pt = codec.preferredPayloadType;
      }
      if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
        codec.rtcpFeedback.forEach((fb) => {
          lines += "a=rtcp-fb:" + pt + " " + fb.type + (fb.parameter && fb.parameter.length ? " " + fb.parameter : "") + "\r\n";
        });
      }
      return lines;
    };
    SDPUtils2.parseSsrcMedia = function(line) {
      const sp = line.indexOf(" ");
      const parts = {
        ssrc: parseInt(line.substring(7, sp), 10)
      };
      const colon = line.indexOf(":", sp);
      if (colon > -1) {
        parts.attribute = line.substring(sp + 1, colon);
        parts.value = line.substring(colon + 1);
      } else {
        parts.attribute = line.substring(sp + 1);
      }
      return parts;
    };
    SDPUtils2.parseSsrcGroup = function(line) {
      const parts = line.substring(13).split(" ");
      return {
        semantics: parts.shift(),
        ssrcs: parts.map((ssrc) => parseInt(ssrc, 10))
      };
    };
    SDPUtils2.getMid = function(mediaSection) {
      const mid = SDPUtils2.matchPrefix(mediaSection, "a=mid:")[0];
      if (mid) {
        return mid.substring(6);
      }
    };
    SDPUtils2.parseFingerprint = function(line) {
      const parts = line.substring(14).split(" ");
      return {
        algorithm: parts[0].toLowerCase(),
        // algorithm is case-sensitive in Edge.
        value: parts[1].toUpperCase()
        // the definition is upper-case in RFC 4572.
      };
    };
    SDPUtils2.getDtlsParameters = function(mediaSection, sessionpart) {
      const lines = SDPUtils2.matchPrefix(
        mediaSection + sessionpart,
        "a=fingerprint:"
      );
      return {
        role: "auto",
        fingerprints: lines.map(SDPUtils2.parseFingerprint)
      };
    };
    SDPUtils2.writeDtlsParameters = function(params, setupType) {
      let sdp = "a=setup:" + setupType + "\r\n";
      params.fingerprints.forEach((fp) => {
        sdp += "a=fingerprint:" + fp.algorithm + " " + fp.value + "\r\n";
      });
      return sdp;
    };
    SDPUtils2.parseCryptoLine = function(line) {
      const parts = line.substring(9).split(" ");
      return {
        tag: parseInt(parts[0], 10),
        cryptoSuite: parts[1],
        keyParams: parts[2],
        sessionParams: parts.slice(3)
      };
    };
    SDPUtils2.writeCryptoLine = function(parameters) {
      return "a=crypto:" + parameters.tag + " " + parameters.cryptoSuite + " " + (typeof parameters.keyParams === "object" ? SDPUtils2.writeCryptoKeyParams(parameters.keyParams) : parameters.keyParams) + (parameters.sessionParams ? " " + parameters.sessionParams.join(" ") : "") + "\r\n";
    };
    SDPUtils2.parseCryptoKeyParams = function(keyParams) {
      if (keyParams.indexOf("inline:") !== 0) {
        return null;
      }
      const parts = keyParams.substring(7).split("|");
      return {
        keyMethod: "inline",
        keySalt: parts[0],
        lifeTime: parts[1],
        mkiValue: parts[2] ? parts[2].split(":")[0] : void 0,
        mkiLength: parts[2] ? parts[2].split(":")[1] : void 0
      };
    };
    SDPUtils2.writeCryptoKeyParams = function(keyParams) {
      return keyParams.keyMethod + ":" + keyParams.keySalt + (keyParams.lifeTime ? "|" + keyParams.lifeTime : "") + (keyParams.mkiValue && keyParams.mkiLength ? "|" + keyParams.mkiValue + ":" + keyParams.mkiLength : "");
    };
    SDPUtils2.getCryptoParameters = function(mediaSection, sessionpart) {
      const lines = SDPUtils2.matchPrefix(
        mediaSection + sessionpart,
        "a=crypto:"
      );
      return lines.map(SDPUtils2.parseCryptoLine);
    };
    SDPUtils2.getIceParameters = function(mediaSection, sessionpart) {
      const ufrag = SDPUtils2.matchPrefix(
        mediaSection + sessionpart,
        "a=ice-ufrag:"
      )[0];
      const pwd = SDPUtils2.matchPrefix(
        mediaSection + sessionpart,
        "a=ice-pwd:"
      )[0];
      if (!(ufrag && pwd)) {
        return null;
      }
      return {
        usernameFragment: ufrag.substring(12),
        password: pwd.substring(10)
      };
    };
    SDPUtils2.writeIceParameters = function(params) {
      let sdp = "a=ice-ufrag:" + params.usernameFragment + "\r\na=ice-pwd:" + params.password + "\r\n";
      if (params.iceLite) {
        sdp += "a=ice-lite\r\n";
      }
      return sdp;
    };
    SDPUtils2.parseRtpParameters = function(mediaSection) {
      const description = {
        codecs: [],
        headerExtensions: [],
        fecMechanisms: [],
        rtcp: []
      };
      const lines = SDPUtils2.splitLines(mediaSection);
      const mline = lines[0].split(" ");
      description.profile = mline[2];
      for (let i = 3; i < mline.length; i++) {
        const pt = mline[i];
        const rtpmapline = SDPUtils2.matchPrefix(
          mediaSection,
          "a=rtpmap:" + pt + " "
        )[0];
        if (rtpmapline) {
          const codec = SDPUtils2.parseRtpMap(rtpmapline);
          const fmtps = SDPUtils2.matchPrefix(
            mediaSection,
            "a=fmtp:" + pt + " "
          );
          codec.parameters = fmtps.length ? SDPUtils2.parseFmtp(fmtps[0]) : {};
          codec.rtcpFeedback = SDPUtils2.matchPrefix(
            mediaSection,
            "a=rtcp-fb:" + pt + " "
          ).map(SDPUtils2.parseRtcpFb);
          description.codecs.push(codec);
          switch (codec.name.toUpperCase()) {
            case "RED":
            case "ULPFEC":
              description.fecMechanisms.push(codec.name.toUpperCase());
              break;
            default:
              break;
          }
        }
      }
      SDPUtils2.matchPrefix(mediaSection, "a=extmap:").forEach((line) => {
        description.headerExtensions.push(SDPUtils2.parseExtmap(line));
      });
      const wildcardRtcpFb = SDPUtils2.matchPrefix(mediaSection, "a=rtcp-fb:* ").map(SDPUtils2.parseRtcpFb);
      description.codecs.forEach((codec) => {
        wildcardRtcpFb.forEach((fb) => {
          const duplicate = codec.rtcpFeedback.find((existingFeedback) => {
            return existingFeedback.type === fb.type && existingFeedback.parameter === fb.parameter;
          });
          if (!duplicate) {
            codec.rtcpFeedback.push(fb);
          }
        });
      });
      return description;
    };
    SDPUtils2.writeRtpDescription = function(kind, caps) {
      let sdp = "";
      sdp += "m=" + kind + " ";
      sdp += caps.codecs.length > 0 ? "9" : "0";
      sdp += " " + (caps.profile || "UDP/TLS/RTP/SAVPF") + " ";
      sdp += caps.codecs.map((codec) => {
        if (codec.preferredPayloadType !== void 0) {
          return codec.preferredPayloadType;
        }
        return codec.payloadType;
      }).join(" ") + "\r\n";
      sdp += "c=IN IP4 0.0.0.0\r\n";
      sdp += "a=rtcp:9 IN IP4 0.0.0.0\r\n";
      caps.codecs.forEach((codec) => {
        sdp += SDPUtils2.writeRtpMap(codec);
        sdp += SDPUtils2.writeFmtp(codec);
        sdp += SDPUtils2.writeRtcpFb(codec);
      });
      let maxptime = 0;
      caps.codecs.forEach((codec) => {
        if (codec.maxptime > maxptime) {
          maxptime = codec.maxptime;
        }
      });
      if (maxptime > 0) {
        sdp += "a=maxptime:" + maxptime + "\r\n";
      }
      if (caps.headerExtensions) {
        caps.headerExtensions.forEach((extension) => {
          sdp += SDPUtils2.writeExtmap(extension);
        });
      }
      return sdp;
    };
    SDPUtils2.parseRtpEncodingParameters = function(mediaSection) {
      const encodingParameters = [];
      const description = SDPUtils2.parseRtpParameters(mediaSection);
      const hasRed = description.fecMechanisms.indexOf("RED") !== -1;
      const hasUlpfec = description.fecMechanisms.indexOf("ULPFEC") !== -1;
      const ssrcs = SDPUtils2.matchPrefix(mediaSection, "a=ssrc:").map((line) => SDPUtils2.parseSsrcMedia(line)).filter((parts) => parts.attribute === "cname");
      const primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
      let secondarySsrc;
      const flows = SDPUtils2.matchPrefix(mediaSection, "a=ssrc-group:FID").map((line) => {
        const parts = line.substring(17).split(" ");
        return parts.map((part) => parseInt(part, 10));
      });
      if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
        secondarySsrc = flows[0][1];
      }
      description.codecs.forEach((codec) => {
        if (codec.name.toUpperCase() === "RTX" && codec.parameters.apt) {
          let encParam = {
            ssrc: primarySsrc,
            codecPayloadType: parseInt(codec.parameters.apt, 10)
          };
          if (primarySsrc && secondarySsrc) {
            encParam.rtx = { ssrc: secondarySsrc };
          }
          encodingParameters.push(encParam);
          if (hasRed) {
            encParam = JSON.parse(JSON.stringify(encParam));
            encParam.fec = {
              ssrc: primarySsrc,
              mechanism: hasUlpfec ? "red+ulpfec" : "red"
            };
            encodingParameters.push(encParam);
          }
        }
      });
      if (encodingParameters.length === 0 && primarySsrc) {
        encodingParameters.push({
          ssrc: primarySsrc
        });
      }
      let bandwidth = SDPUtils2.matchPrefix(mediaSection, "b=");
      if (bandwidth.length) {
        if (bandwidth[0].indexOf("b=TIAS:") === 0) {
          bandwidth = parseInt(bandwidth[0].substring(7), 10);
        } else if (bandwidth[0].indexOf("b=AS:") === 0) {
          bandwidth = parseInt(bandwidth[0].substring(5), 10) * 1e3 * 0.95 - 50 * 40 * 8;
        } else {
          bandwidth = void 0;
        }
        encodingParameters.forEach((params) => {
          params.maxBitrate = bandwidth;
        });
      }
      return encodingParameters;
    };
    SDPUtils2.parseRtcpParameters = function(mediaSection) {
      const rtcpParameters = {};
      const remoteSsrc = SDPUtils2.matchPrefix(mediaSection, "a=ssrc:").map((line) => SDPUtils2.parseSsrcMedia(line)).filter((obj) => obj.attribute === "cname")[0];
      if (remoteSsrc) {
        rtcpParameters.cname = remoteSsrc.value;
        rtcpParameters.ssrc = remoteSsrc.ssrc;
      }
      const rsize = SDPUtils2.matchPrefix(mediaSection, "a=rtcp-rsize");
      rtcpParameters.reducedSize = rsize.length > 0;
      rtcpParameters.compound = rsize.length === 0;
      const mux = SDPUtils2.matchPrefix(mediaSection, "a=rtcp-mux");
      rtcpParameters.mux = mux.length > 0;
      return rtcpParameters;
    };
    SDPUtils2.writeRtcpParameters = function(rtcpParameters) {
      let sdp = "";
      if (rtcpParameters.reducedSize) {
        sdp += "a=rtcp-rsize\r\n";
      }
      if (rtcpParameters.mux) {
        sdp += "a=rtcp-mux\r\n";
      }
      if (rtcpParameters.ssrc !== void 0 && rtcpParameters.cname) {
        sdp += "a=ssrc:" + rtcpParameters.ssrc + " cname:" + rtcpParameters.cname + "\r\n";
      }
      return sdp;
    };
    SDPUtils2.parseMsid = function(mediaSection) {
      let parts;
      const spec = SDPUtils2.matchPrefix(mediaSection, "a=msid:");
      if (spec.length === 1) {
        parts = spec[0].substring(7).split(" ");
        return { stream: parts[0], track: parts[1] };
      }
      const planB = SDPUtils2.matchPrefix(mediaSection, "a=ssrc:").map((line) => SDPUtils2.parseSsrcMedia(line)).filter((msidParts) => msidParts.attribute === "msid");
      if (planB.length > 0) {
        parts = planB[0].value.split(" ");
        return { stream: parts[0], track: parts[1] };
      }
    };
    SDPUtils2.parseSctpDescription = function(mediaSection) {
      const mline = SDPUtils2.parseMLine(mediaSection);
      const maxSizeLine = SDPUtils2.matchPrefix(mediaSection, "a=max-message-size:");
      let maxMessageSize;
      if (maxSizeLine.length > 0) {
        maxMessageSize = parseInt(maxSizeLine[0].substring(19), 10);
      }
      if (isNaN(maxMessageSize)) {
        maxMessageSize = 65536;
      }
      const sctpPort = SDPUtils2.matchPrefix(mediaSection, "a=sctp-port:");
      if (sctpPort.length > 0) {
        return {
          port: parseInt(sctpPort[0].substring(12), 10),
          protocol: mline.fmt,
          maxMessageSize
        };
      }
      const sctpMapLines = SDPUtils2.matchPrefix(mediaSection, "a=sctpmap:");
      if (sctpMapLines.length > 0) {
        const parts = sctpMapLines[0].substring(10).split(" ");
        return {
          port: parseInt(parts[0], 10),
          protocol: parts[1],
          maxMessageSize
        };
      }
    };
    SDPUtils2.writeSctpDescription = function(media, sctp) {
      let output = [];
      if (media.protocol !== "DTLS/SCTP") {
        output = [
          "m=" + media.kind + " 9 " + media.protocol + " " + sctp.protocol + "\r\n",
          "c=IN IP4 0.0.0.0\r\n",
          "a=sctp-port:" + sctp.port + "\r\n"
        ];
      } else {
        output = [
          "m=" + media.kind + " 9 " + media.protocol + " " + sctp.port + "\r\n",
          "c=IN IP4 0.0.0.0\r\n",
          "a=sctpmap:" + sctp.port + " " + sctp.protocol + " 65535\r\n"
        ];
      }
      if (sctp.maxMessageSize !== void 0) {
        output.push("a=max-message-size:" + sctp.maxMessageSize + "\r\n");
      }
      return output.join("");
    };
    SDPUtils2.generateSessionId = function() {
      return Math.random().toString().substr(2, 22);
    };
    SDPUtils2.writeSessionBoilerplate = function(sessId, sessVer, sessUser) {
      let sessionId;
      const version = sessVer !== void 0 ? sessVer : 2;
      if (sessId) {
        sessionId = sessId;
      } else {
        sessionId = SDPUtils2.generateSessionId();
      }
      const user = sessUser || "thisisadapterortc";
      return "v=0\r\no=" + user + " " + sessionId + " " + version + " IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";
    };
    SDPUtils2.getDirection = function(mediaSection, sessionpart) {
      const lines = SDPUtils2.splitLines(mediaSection);
      for (let i = 0; i < lines.length; i++) {
        switch (lines[i]) {
          case "a=sendrecv":
          case "a=sendonly":
          case "a=recvonly":
          case "a=inactive":
            return lines[i].substring(2);
          default:
        }
      }
      if (sessionpart) {
        return SDPUtils2.getDirection(sessionpart);
      }
      return "sendrecv";
    };
    SDPUtils2.getKind = function(mediaSection) {
      const lines = SDPUtils2.splitLines(mediaSection);
      const mline = lines[0].split(" ");
      return mline[0].substring(2);
    };
    SDPUtils2.isRejected = function(mediaSection) {
      return mediaSection.split(" ", 2)[1] === "0";
    };
    SDPUtils2.parseMLine = function(mediaSection) {
      const lines = SDPUtils2.splitLines(mediaSection);
      const parts = lines[0].substring(2).split(" ");
      return {
        kind: parts[0],
        port: parseInt(parts[1], 10),
        protocol: parts[2],
        fmt: parts.slice(3).join(" ")
      };
    };
    SDPUtils2.parseOLine = function(mediaSection) {
      const line = SDPUtils2.matchPrefix(mediaSection, "o=")[0];
      const parts = line.substring(2).split(" ");
      return {
        username: parts[0],
        sessionId: parts[1],
        sessionVersion: parseInt(parts[2], 10),
        netType: parts[3],
        addressType: parts[4],
        address: parts[5]
      };
    };
    SDPUtils2.isValidSDP = function(blob) {
      if (typeof blob !== "string" || blob.length === 0) {
        return false;
      }
      const lines = SDPUtils2.splitLines(blob);
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length < 2 || lines[i].charAt(1) !== "=") {
          return false;
        }
      }
      return true;
    };
    if (typeof module === "object") {
      module.exports = SDPUtils2;
    }
  }
});

// src/auth.ts
var DEFAULT_PLATFORM = "https://platform.streampixel.io";
var AuthError = class extends Error {
  constructor(message, kind, status) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.name = "AuthError";
  }
};
async function resolveAccess(platformHost, appId) {
  const host = platformHost ?? DEFAULT_PLATFORM;
  const url = appId ? `${host}/api/v1/stream/access/${encodeURIComponent(appId)}` : `${host}/api/v1/stream/access/by-domain/${encodeURIComponent(location.hostname)}`;
  const res = await fetchOrThrow(url);
  if (res.status === 404) {
    throw new AuthError(
      appId ? `Project ${appId} not found` : `No project is bound to ${location.hostname}`,
      "project-not-found",
      404
    );
  }
  await assertOk(res);
  const descriptor = await res.json();
  const projectId = descriptor.projectId ?? appId;
  if (!projectId) throw new AuthError("Access descriptor carried no projectId", "server");
  return { projectId, descriptor };
}
function ssoStartUrl(platformHost, projectId, returnTo) {
  const host = platformHost ?? DEFAULT_PLATFORM;
  return `${host}/api/v1/stream/sso/${encodeURIComponent(projectId)}/start?returnTo=${encodeURIComponent(returnTo)}`;
}
async function mintTicket(platformHost, projectId, auth, opts) {
  if (auth.mode === "ticket") {
    return decodeProgrammaticTicket(auth.ticket);
  }
  const host = platformHost ?? DEFAULT_PLATFORM;
  const body = { projectId };
  if (auth.mode === "password") body.password = auth.password;
  if (opts?.ssoGrant) body.ssoGrant = opts.ssoGrant;
  if (opts?.viewerId) body.viewerId = opts.viewerId;
  const res = await fetchOrThrow(`${host}/api/v1/stream/ticket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // The response is a short-lived bearer credential — never let it cache.
    cache: "no-store"
  });
  if (res.status === 401 || res.status === 403) {
    const msg = await safeMessage(res);
    if (/password/i.test(msg)) {
      throw new AuthError(
        msg,
        auth.mode === "password" ? "password-wrong" : "password-required",
        res.status
      );
    }
    if (/sso/i.test(msg)) throw new AuthError(msg, "sso-required", res.status);
    if (/programmatic/i.test(msg)) throw new AuthError(msg, "programmatic-only", res.status);
    throw new AuthError(msg, "server", res.status);
  }
  if (res.status === 404) throw new AuthError("Project not found", "project-not-found", 404);
  if (res.status === 409 || res.status === 423) {
    throw new AuthError(await safeMessage(res), "project-offline", res.status);
  }
  await assertOk(res);
  return await res.json();
}
function decodeProgrammaticTicket(ticketOrResponse) {
  const trimmed = ticketOrResponse.trim();
  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed);
    if (!parsed.ticket) throw new AuthError("Programmatic auth object has no `ticket`", "server");
    return parsed;
  }
  return { ticket: trimmed, telemetryToken: "", config: { status: true, ready: true } };
}
var TRANSIENT_STATUSES = /* @__PURE__ */ new Set([502, 503, 504]);
var RETRY_ATTEMPTS = 3;
async function fetchOrThrow(url, init) {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, init);
      if (TRANSIENT_STATUSES.has(res.status) && i < RETRY_ATTEMPTS - 1) {
        await sleep(300 * (i + 1));
        continue;
      }
      return res;
    } catch (err) {
      if (i >= RETRY_ATTEMPTS - 1) {
        throw new AuthError(
          `Cannot reach the StreamPixel platform (${err.message})`,
          "network"
        );
      }
      await sleep(300 * (i + 1));
    }
  }
}
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function assertOk(res) {
  if (!res.ok) throw new AuthError(await safeMessage(res), "server", res.status);
}
async function safeMessage(res) {
  try {
    const body = await res.json();
    return body.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

// node_modules/@epicgames-ps/lib-pixelstreamingcommon-ue5.7/dist/esm/Logger/Logger.js
var LogLevel;
(function(LogLevel2) {
  LogLevel2[LogLevel2["Disabled"] = 0] = "Disabled";
  LogLevel2[LogLevel2["Error"] = 1] = "Error";
  LogLevel2[LogLevel2["Warning"] = 2] = "Warning";
  LogLevel2[LogLevel2["Info"] = 3] = "Info";
  LogLevel2[LogLevel2["Debug"] = 4] = "Debug";
})(LogLevel || (LogLevel = {}));
var LoggerContext = class {
  constructor() {
    this.logLevel = LogLevel.Debug;
    this.includeStack = true;
  }
};
var LoggerType = class {
  /**
   * Set the log verbosity level
   */
  InitLogging(logLevel, includeStack) {
    this.ValidateContext();
    this.context.logLevel = logLevel;
    this.context.includeStack = includeStack;
  }
  /**
   * Logging output for debugging
   * @param message - the message to be logged
   */
  Debug(message) {
    this.ValidateContext();
    if (this.context.logLevel >= LogLevel.Debug) {
      this.CommonLog("Debug", message);
    }
  }
  /**
   * Basic logging output for standard messages
   * @param message - the message to be logged
   */
  Info(message) {
    this.ValidateContext();
    if (this.context.logLevel >= LogLevel.Info) {
      this.CommonLog("Info", message);
    }
  }
  /**
   * Logging for warnings
   * @param message - the message to be logged
   */
  Warning(message) {
    this.ValidateContext();
    if (this.context.logLevel >= LogLevel.Warning) {
      this.CommonLog("Warning", message);
    }
  }
  /**
   * Error logging
   * @param message - the message to be logged
   */
  Error(message) {
    this.ValidateContext();
    if (this.context.logLevel >= LogLevel.Error) {
      this.CommonLog("Error", message);
    }
  }
  /**
   * The common log function that all other log functions call to.
   * @param level - the level of this log message.
   * @param stack - an optional stack trace string from where the log message was called.
   * @param message - the message to be logged.
   */
  CommonLog(level, message) {
    let logMessage = `[${level}] - ${message}`;
    if (this.context.includeStack) {
      logMessage += `
Stack: ${this.GetStackTrace()}`;
    }
    if (level === "Error") {
      console.error(logMessage);
    } else if (level === "Warning") {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  }
  /**
   * Captures the stack and returns it
   * @returns the current stack
   */
  GetStackTrace() {
    const error = new Error();
    let formattedStack = "No Stack Available for this browser";
    if (error.stack) {
      formattedStack = error.stack.toString().replace(/Error/g, "");
    }
    return formattedStack;
  }
  /**
   * Since there can be multiple execution contexts, (stats reporting and some webxr logging comes from
   * different execution contexts we can end up with multiple static Logger instances. Here we try to
   * work around it by storing the context on the window object.
   */
  ValidateContext() {
    if (!this.context) {
      if (typeof window == "undefined" || !window) {
        this.context = new LoggerContext();
      } else if (!window.loggerContext) {
        this.context = new LoggerContext();
        window.loggerContext = this.context;
      } else {
        this.context = window.loggerContext;
      }
    }
  }
};
var Logger = new LoggerType();

// node_modules/@epicgames-ps/lib-pixelstreamingcommon-ue5.7/dist/esm/Event/EventEmitter.js
var PixelStreamingEventListener = class {
  constructor(callback) {
    this._args = [];
    this._callback = callback;
  }
  handleEvent(_evt) {
    this._callback(...this._args);
    this._args = [];
  }
  setArgs(...args) {
    this._args = args;
  }
};
var EventEmitter = class extends EventTarget {
  constructor() {
    super();
    this._eventListeners = /* @__PURE__ */ new Map();
  }
  removeListenerInternal(eventName, listener) {
    if (this._eventListeners.has(eventName)) {
      const listeners = this._eventListeners.get(eventName);
      if (listeners === void 0) {
        return this;
      }
      for (let i = 0; i < listeners.length; ++i) {
        const eventPair = listeners[i];
        if (eventPair.callback === listener) {
          super.removeEventListener(eventName, eventPair.eventListenerWrapper);
          listeners.splice(i, 1);
          break;
        }
      }
    }
    return this;
  }
  /**
   * Alias for `emitter.on(eventName, listener)`.
   */
  addListener(eventName, listener) {
    return this.on(eventName, listener);
  }
  /**
   * Adds the `listener` function to the end of the listeners array for the event
   * named `eventName`.
   *
   * ```js
   * server.on('connection', (stream) => {
   *   console.log('someone connected!');
   * });
   * ```
   *
   * Returns a reference to the `EventEmitter`, so that calls can be chained.
   *
   * @param eventName - The name of the event.
   * @param listener - The callback function
   */
  on(eventName, listener) {
    var _a;
    const eventListenerWrapper = new PixelStreamingEventListener(listener);
    super.addEventListener(eventName, eventListenerWrapper);
    if (!this._eventListeners.has(eventName)) {
      this._eventListeners.set(eventName, new Array());
    }
    (_a = this._eventListeners.get(eventName)) === null || _a === void 0 ? void 0 : _a.push({ callback: listener, eventListenerWrapper });
    return this;
  }
  /**
   * Adds a **one-time** `listener` function for the event named `eventName`. The
   * next time `eventName` is triggered, this listener is removed and then invoked.
   *
   * ```js
   * server.once('connection', (stream) => {
   *   console.log('Ah, we have our first user!');
   * });
   * ```
   *
   * Returns a reference to the `EventEmitter`, so that calls can be chained.
   * @param eventName - The name of the event.
   * @param listener - The callback function
   */
  once(eventName, listener) {
    var _a;
    const eventListenerOpts = { once: true };
    const eventListenerWrapper = new PixelStreamingEventListener((...args) => {
      listener(...args);
      this.removeListenerInternal(eventName, listener);
    });
    super.addEventListener(eventName, eventListenerWrapper, eventListenerOpts);
    if (!this._eventListeners.has(eventName)) {
      this._eventListeners.set(eventName, new Array());
    }
    (_a = this._eventListeners.get(eventName)) === null || _a === void 0 ? void 0 : _a.push({ callback: listener, eventListenerWrapper });
    return this;
  }
  /**
   * Removes the specified `listener` from this EventEmitter.
   *
   * ```js
   * const callback = (stream) => {
   *   console.log('someone connected!');
   * };
   * server.on('connection', callback);
   * // ...
   * server.removeListener('connection', callback);
   * ```
   * Returns a reference to the `EventEmitter`, so that calls can be chained.
   */
  removeListener(eventName, listener) {
    this.removeListenerInternal(eventName, listener);
    return this;
  }
  /**
   * Alias for `emitter.removeListener()`.
   */
  off(eventName, listener) {
    return this.removeListener(eventName, listener);
  }
  /**
   * Removes all listeners, or those of the specified `eventName`.
   * Returns a reference to the `EventEmitter`, so that calls can be chained.
   */
  removeAllListeners(eventName) {
    if (this._eventListeners.has(eventName)) {
      const listeners = this._eventListeners.get(eventName);
      if (listeners === void 0) {
        return this;
      }
      for (const listenerPair of listeners) {
        this.removeEventListener(eventName, listenerPair.eventListenerWrapper);
      }
      this._eventListeners.delete(eventName);
    }
    return this;
  }
  /**
   * Synchronously calls each of the listeners registered for the event named `eventName`, in the order they were registered, passing the supplied arguments
   * to each.
   *
   * Returns `true` if the event had listeners, `false` otherwise.
   *
   * ```js
   * import { EventEmitter } from 'node:events';
   * const myEmitter = new EventEmitter();
   *
   * // First listener
   * myEmitter.on('event', function firstListener() {
   *   console.log('Helloooo! first listener');
   * });
   * // Second listener
   * myEmitter.on('event', function secondListener(arg1, arg2) {
   *   console.log(`event with parameters ${arg1}, ${arg2} in second listener`);
   * });
   * // Third listener
   * myEmitter.on('event', function thirdListener(...args) {
   *   const parameters = args.join(', ');
   *   console.log(`event with parameters ${parameters} in third listener`);
   * });
   *
   * console.log(myEmitter.listeners('event'));
   *
   * myEmitter.emit('event', 1, 2, 3, 4, 5);
   *
   * // Prints:
   * // [
   * //   [Function: firstListener],
   * //   [Function: secondListener],
   * //   [Function: thirdListener]
   * // ]
   * // Helloooo! first listener
   * // event with parameters 1, 2 in second listener
   * // event with parameters 1, 2, 3, 4, 5 in third listener
   * ```
   */
  emit(eventName, ...args) {
    if (this._eventListeners.has(eventName)) {
      const listeners = this._eventListeners.get(eventName);
      if (listeners === void 0) {
        return false;
      }
      for (const listenerPair of listeners) {
        listenerPair.eventListenerWrapper.setArgs(...args);
      }
      super.dispatchEvent(new Event(eventName));
      return true;
    }
    return false;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingcommon-ue5.7/dist/esm/Transport/WebSocketTransport.js
var WebSocketTransport = class extends EventEmitter {
  /**
   * Constructs a new WebSocketTransport for browser contexts.
   * @param protocols - An optional string or list of strings to pass to the new websocket protocols param
   */
  constructor(protocols) {
    super();
    this.WS_OPEN_STATE = 1;
    this.protocols = protocols;
  }
  /**
   * Sends a message over the websocket.
   * @param msg - The message to send.
   */
  sendMessage(msg) {
    if (this.webSocket) {
      this.webSocket.send(msg);
    }
  }
  /**
   * Connect to the signaling server
   * @param connectionURL - The Address of the signaling server
   * @returns If there is a connection
   */
  connect(connectionURL) {
    Logger.Info(connectionURL);
    try {
      this.webSocket = new WebSocket(connectionURL, this.protocols);
      this.webSocket.onopen = (_) => this.handleOnOpen();
      this.webSocket.onerror = (_) => this.handleOnError();
      this.webSocket.onclose = (event) => this.handleOnClose(event);
      this.webSocket.onmessage = (event) => this.handleOnMessage(event);
      this.webSocket.onmessagebinary = (event) => this.handleOnMessageBinary(event);
      return true;
    } catch (error) {
      Logger.Error(error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  /**
   * Disconnect this transport.
   * @param code - An optional disconnect code.
   * @param reason - A descriptive string for the disconnect reason.
   */
  disconnect(code, reason) {
    if (this.webSocket) {
      this.webSocket.close(code, reason);
    }
  }
  /**
   * Should return true when the transport is connected and ready to send/receive messages.
   * @returns True if the transport is connected.
   */
  isConnected() {
    return !!this.webSocket && this.webSocket.readyState != WebSocket.CLOSED;
  }
  /**
   * Handles what happens when a message is received in binary form
   * @param event - Message Received
   */
  handleOnMessageBinary(event) {
    if (!event || !event.data) {
      return;
    }
    event.data.text().then((messageString) => {
      const constructedMessage = new MessageEvent("messageFromBinary", {
        data: messageString
      });
      this.handleOnMessage(constructedMessage);
    }).catch((error) => {
      Logger.Error(`Failed to parse binary blob from websocket, reason: ${error.message}`);
    });
  }
  /**
   * Handles what happens when a message is received
   * @param event - Message Received
   */
  handleOnMessage(event) {
    if (event.data && event.data instanceof Blob) {
      this.handleOnMessageBinary(event);
      return;
    }
    if (this.onMessage) {
      this.onMessage(event.data);
    }
  }
  /**
   * Handles when the Websocket is opened
   */
  handleOnOpen() {
    Logger.Info("Connected to the signalling server via WebSocket");
    this.emit("open");
  }
  /**
   * Handles when there is an error on the websocket
   */
  handleOnError() {
    this.emit("error");
  }
  /**
   * Handles when the Websocket is closed
   * @param event - Close Event
   */
  handleOnClose(event) {
    Logger.Info("Disconnected to the signalling server via WebSocket: " + JSON.stringify(event.code) + " - " + event.reason);
    this.emit("close", event);
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingcommon-ue5.7/dist/esm/Protocol/SignallingProtocol.js
var SignallingProtocol = class extends EventEmitter {
  static get SIGNALLING_VERSION() {
    return "1.3.0";
  }
  constructor(transport) {
    super();
    this.transport = transport;
    transport.onMessage = (msg) => {
      let parsedMessage;
      try {
        const parsedData = JSON.parse(msg);
        Logger.Debug("Protocol received => \n" + JSON.stringify(parsedData, void 0, 4));
        parsedMessage = parsedData;
      } catch (e) {
        if (e instanceof Error) {
          Logger.Error(`Error parsing message string ${msg}.
${e.message}`);
        } else {
          Logger.Error(`Unknown error while parsing message data in handleOnMessage`);
        }
        return;
      }
      transport.emit("message", parsedMessage);
      if (!this.emit(parsedMessage.type, parsedMessage)) {
        this.emit("unhandled", parsedMessage);
      }
    };
  }
  /**
   * Asks the transport to connect to the given URL.
   * @param url - The url to connect to.
   * @returns True if the connection call succeeded.
   */
  connect(url) {
    return this.transport.connect(url);
  }
  /**
   * Asks the transport to disconnect from any connection it might have.
   * @param code - An optional disconnection code.
   * @param reason - An optional descriptive string for the disconnect reason.
   */
  disconnect(code, reason) {
    this.transport.disconnect(code, reason);
  }
  /**
   * Returns true if the transport is connected and ready to send/receive messages.
   * @returns True if the protocol is connected.
   */
  isConnected() {
    return this.transport.isConnected();
  }
  /**
   * Passes a message to the transport to send to the other end.
   * @param msg - The message to send.
   */
  sendMessage(msg) {
    this.transport.sendMessage(JSON.stringify(msg));
    this.transport.emit("out", msg);
    Logger.Debug("Protocol sent => \n" + JSON.stringify(msg, void 0, 4));
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingcommon-ue5.7/dist/esm/Messages/signalling_messages.js
var signalling_messages_exports = {};
__export(signalling_messages_exports, {
  answer: () => answer,
  base_message: () => base_message,
  config: () => config,
  dataChannelRequest: () => dataChannelRequest,
  disconnectPlayer: () => disconnectPlayer,
  endpointId: () => endpointId,
  endpointIdConfirm: () => endpointIdConfirm,
  iceCandidate: () => iceCandidate,
  iceCandidateData: () => iceCandidateData,
  identify: () => identify,
  layerPreference: () => layerPreference,
  listStreamers: () => listStreamers,
  offer: () => offer,
  peerConnectionOptions: () => peerConnectionOptions,
  peerDataChannels: () => peerDataChannels,
  peerDataChannelsReady: () => peerDataChannelsReady,
  ping: () => ping,
  playerConnected: () => playerConnected,
  playerCount: () => playerCount,
  playerDisconnected: () => playerDisconnected,
  pong: () => pong,
  startStreaming: () => startStreaming,
  stats: () => stats,
  stopStreaming: () => stopStreaming,
  streamerDataChannels: () => streamerDataChannels,
  streamerDisconnected: () => streamerDisconnected,
  streamerIdChanged: () => streamerIdChanged,
  streamerList: () => streamerList,
  subscribe: () => subscribe,
  subscribeFailed: () => subscribeFailed,
  unsubscribe: () => unsubscribe
});

// node_modules/@protobuf-ts/runtime/build/es2015/json-typings.js
function typeofJsonValue(value) {
  let t = typeof value;
  if (t == "object") {
    if (Array.isArray(value))
      return "array";
    if (value === null)
      return "null";
  }
  return t;
}
function isJsonObject(value) {
  return value !== null && typeof value == "object" && !Array.isArray(value);
}

// node_modules/@protobuf-ts/runtime/build/es2015/base64.js
var encTable = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
var decTable = [];
for (let i = 0; i < encTable.length; i++)
  decTable[encTable[i].charCodeAt(0)] = i;
decTable["-".charCodeAt(0)] = encTable.indexOf("+");
decTable["_".charCodeAt(0)] = encTable.indexOf("/");
function base64decode(base64Str) {
  let es = base64Str.length * 3 / 4;
  if (base64Str[base64Str.length - 2] == "=")
    es -= 2;
  else if (base64Str[base64Str.length - 1] == "=")
    es -= 1;
  let bytes = new Uint8Array(es), bytePos = 0, groupPos = 0, b, p = 0;
  for (let i = 0; i < base64Str.length; i++) {
    b = decTable[base64Str.charCodeAt(i)];
    if (b === void 0) {
      switch (base64Str[i]) {
        case "=":
          groupPos = 0;
        // reset state when padding found
        case "\n":
        case "\r":
        case "	":
        case " ":
          continue;
        // skip white-space, and padding
        default:
          throw Error(`invalid base64 string.`);
      }
    }
    switch (groupPos) {
      case 0:
        p = b;
        groupPos = 1;
        break;
      case 1:
        bytes[bytePos++] = p << 2 | (b & 48) >> 4;
        p = b;
        groupPos = 2;
        break;
      case 2:
        bytes[bytePos++] = (p & 15) << 4 | (b & 60) >> 2;
        p = b;
        groupPos = 3;
        break;
      case 3:
        bytes[bytePos++] = (p & 3) << 6 | b;
        groupPos = 0;
        break;
    }
  }
  if (groupPos == 1)
    throw Error(`invalid base64 string.`);
  return bytes.subarray(0, bytePos);
}
function base64encode(bytes) {
  let base64 = "", groupPos = 0, b, p = 0;
  for (let i = 0; i < bytes.length; i++) {
    b = bytes[i];
    switch (groupPos) {
      case 0:
        base64 += encTable[b >> 2];
        p = (b & 3) << 4;
        groupPos = 1;
        break;
      case 1:
        base64 += encTable[p | b >> 4];
        p = (b & 15) << 2;
        groupPos = 2;
        break;
      case 2:
        base64 += encTable[p | b >> 6];
        base64 += encTable[b & 63];
        groupPos = 0;
        break;
    }
  }
  if (groupPos) {
    base64 += encTable[p];
    base64 += "=";
    if (groupPos == 1)
      base64 += "=";
  }
  return base64;
}

// node_modules/@protobuf-ts/runtime/build/es2015/binary-format-contract.js
var UnknownFieldHandler;
(function(UnknownFieldHandler2) {
  UnknownFieldHandler2.symbol = Symbol.for("protobuf-ts/unknown");
  UnknownFieldHandler2.onRead = (typeName, message, fieldNo, wireType, data) => {
    let container = is(message) ? message[UnknownFieldHandler2.symbol] : message[UnknownFieldHandler2.symbol] = [];
    container.push({ no: fieldNo, wireType, data });
  };
  UnknownFieldHandler2.onWrite = (typeName, message, writer) => {
    for (let { no, wireType, data } of UnknownFieldHandler2.list(message))
      writer.tag(no, wireType).raw(data);
  };
  UnknownFieldHandler2.list = (message, fieldNo) => {
    if (is(message)) {
      let all = message[UnknownFieldHandler2.symbol];
      return fieldNo ? all.filter((uf) => uf.no == fieldNo) : all;
    }
    return [];
  };
  UnknownFieldHandler2.last = (message, fieldNo) => UnknownFieldHandler2.list(message, fieldNo).slice(-1)[0];
  const is = (message) => message && Array.isArray(message[UnknownFieldHandler2.symbol]);
})(UnknownFieldHandler || (UnknownFieldHandler = {}));
var WireType;
(function(WireType2) {
  WireType2[WireType2["Varint"] = 0] = "Varint";
  WireType2[WireType2["Bit64"] = 1] = "Bit64";
  WireType2[WireType2["LengthDelimited"] = 2] = "LengthDelimited";
  WireType2[WireType2["StartGroup"] = 3] = "StartGroup";
  WireType2[WireType2["EndGroup"] = 4] = "EndGroup";
  WireType2[WireType2["Bit32"] = 5] = "Bit32";
})(WireType || (WireType = {}));

// node_modules/@protobuf-ts/runtime/build/es2015/goog-varint.js
function varint64read() {
  let lowBits = 0;
  let highBits = 0;
  for (let shift = 0; shift < 28; shift += 7) {
    let b = this.buf[this.pos++];
    lowBits |= (b & 127) << shift;
    if ((b & 128) == 0) {
      this.assertBounds();
      return [lowBits, highBits];
    }
  }
  let middleByte = this.buf[this.pos++];
  lowBits |= (middleByte & 15) << 28;
  highBits = (middleByte & 112) >> 4;
  if ((middleByte & 128) == 0) {
    this.assertBounds();
    return [lowBits, highBits];
  }
  for (let shift = 3; shift <= 31; shift += 7) {
    let b = this.buf[this.pos++];
    highBits |= (b & 127) << shift;
    if ((b & 128) == 0) {
      this.assertBounds();
      return [lowBits, highBits];
    }
  }
  throw new Error("invalid varint");
}
function varint64write(lo, hi, bytes) {
  for (let i = 0; i < 28; i = i + 7) {
    const shift = lo >>> i;
    const hasNext = !(shift >>> 7 == 0 && hi == 0);
    const byte = (hasNext ? shift | 128 : shift) & 255;
    bytes.push(byte);
    if (!hasNext) {
      return;
    }
  }
  const splitBits = lo >>> 28 & 15 | (hi & 7) << 4;
  const hasMoreBits = !(hi >> 3 == 0);
  bytes.push((hasMoreBits ? splitBits | 128 : splitBits) & 255);
  if (!hasMoreBits) {
    return;
  }
  for (let i = 3; i < 31; i = i + 7) {
    const shift = hi >>> i;
    const hasNext = !(shift >>> 7 == 0);
    const byte = (hasNext ? shift | 128 : shift) & 255;
    bytes.push(byte);
    if (!hasNext) {
      return;
    }
  }
  bytes.push(hi >>> 31 & 1);
}
var TWO_PWR_32_DBL = (1 << 16) * (1 << 16);
function int64fromString(dec) {
  let minus = dec[0] == "-";
  if (minus)
    dec = dec.slice(1);
  const base = 1e6;
  let lowBits = 0;
  let highBits = 0;
  function add1e6digit(begin, end) {
    const digit1e6 = Number(dec.slice(begin, end));
    highBits *= base;
    lowBits = lowBits * base + digit1e6;
    if (lowBits >= TWO_PWR_32_DBL) {
      highBits = highBits + (lowBits / TWO_PWR_32_DBL | 0);
      lowBits = lowBits % TWO_PWR_32_DBL;
    }
  }
  add1e6digit(-24, -18);
  add1e6digit(-18, -12);
  add1e6digit(-12, -6);
  add1e6digit(-6);
  return [minus, lowBits, highBits];
}
function int64toString(bitsLow, bitsHigh) {
  if (bitsHigh >>> 0 <= 2097151) {
    return "" + (TWO_PWR_32_DBL * bitsHigh + (bitsLow >>> 0));
  }
  let low = bitsLow & 16777215;
  let mid = (bitsLow >>> 24 | bitsHigh << 8) >>> 0 & 16777215;
  let high = bitsHigh >> 16 & 65535;
  let digitA = low + mid * 6777216 + high * 6710656;
  let digitB = mid + high * 8147497;
  let digitC = high * 2;
  let base = 1e7;
  if (digitA >= base) {
    digitB += Math.floor(digitA / base);
    digitA %= base;
  }
  if (digitB >= base) {
    digitC += Math.floor(digitB / base);
    digitB %= base;
  }
  function decimalFrom1e7(digit1e7, needLeadingZeros) {
    let partial = digit1e7 ? String(digit1e7) : "";
    if (needLeadingZeros) {
      return "0000000".slice(partial.length) + partial;
    }
    return partial;
  }
  return decimalFrom1e7(
    digitC,
    /*needLeadingZeros=*/
    0
  ) + decimalFrom1e7(
    digitB,
    /*needLeadingZeros=*/
    digitC
  ) + // If the final 1e7 digit didn't need leading zeros, we would have
  // returned via the trivial code path at the top.
  decimalFrom1e7(
    digitA,
    /*needLeadingZeros=*/
    1
  );
}
function varint32write(value, bytes) {
  if (value >= 0) {
    while (value > 127) {
      bytes.push(value & 127 | 128);
      value = value >>> 7;
    }
    bytes.push(value);
  } else {
    for (let i = 0; i < 9; i++) {
      bytes.push(value & 127 | 128);
      value = value >> 7;
    }
    bytes.push(1);
  }
}
function varint32read() {
  let b = this.buf[this.pos++];
  let result = b & 127;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 7;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 14;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 21;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 15) << 28;
  for (let readBytes = 5; (b & 128) !== 0 && readBytes < 10; readBytes++)
    b = this.buf[this.pos++];
  if ((b & 128) != 0)
    throw new Error("invalid varint");
  this.assertBounds();
  return result >>> 0;
}

// node_modules/@protobuf-ts/runtime/build/es2015/pb-long.js
var BI;
function detectBi() {
  const dv = new DataView(new ArrayBuffer(8));
  const ok = globalThis.BigInt !== void 0 && typeof dv.getBigInt64 === "function" && typeof dv.getBigUint64 === "function" && typeof dv.setBigInt64 === "function" && typeof dv.setBigUint64 === "function";
  BI = ok ? {
    MIN: BigInt("-9223372036854775808"),
    MAX: BigInt("9223372036854775807"),
    UMIN: BigInt("0"),
    UMAX: BigInt("18446744073709551615"),
    C: BigInt,
    V: dv
  } : void 0;
}
detectBi();
function assertBi(bi) {
  if (!bi)
    throw new Error("BigInt unavailable, see https://github.com/timostamm/protobuf-ts/blob/v1.0.8/MANUAL.md#bigint-support");
}
var RE_DECIMAL_STR = /^-?[0-9]+$/;
var TWO_PWR_32_DBL2 = 4294967296;
var HALF_2_PWR_32 = 2147483648;
var SharedPbLong = class {
  /**
   * Create a new instance with the given bits.
   */
  constructor(lo, hi) {
    this.lo = lo | 0;
    this.hi = hi | 0;
  }
  /**
   * Is this instance equal to 0?
   */
  isZero() {
    return this.lo == 0 && this.hi == 0;
  }
  /**
   * Convert to a native number.
   */
  toNumber() {
    let result = this.hi * TWO_PWR_32_DBL2 + (this.lo >>> 0);
    if (!Number.isSafeInteger(result))
      throw new Error("cannot convert to safe number");
    return result;
  }
};
var PbULong = class _PbULong extends SharedPbLong {
  /**
   * Create instance from a `string`, `number` or `bigint`.
   */
  static from(value) {
    if (BI)
      switch (typeof value) {
        case "string":
          if (value == "0")
            return this.ZERO;
          if (value == "")
            throw new Error("string is no integer");
          value = BI.C(value);
        case "number":
          if (value === 0)
            return this.ZERO;
          value = BI.C(value);
        case "bigint":
          if (!value)
            return this.ZERO;
          if (value < BI.UMIN)
            throw new Error("signed value for ulong");
          if (value > BI.UMAX)
            throw new Error("ulong too large");
          BI.V.setBigUint64(0, value, true);
          return new _PbULong(BI.V.getInt32(0, true), BI.V.getInt32(4, true));
      }
    else
      switch (typeof value) {
        case "string":
          if (value == "0")
            return this.ZERO;
          value = value.trim();
          if (!RE_DECIMAL_STR.test(value))
            throw new Error("string is no integer");
          let [minus, lo, hi] = int64fromString(value);
          if (minus)
            throw new Error("signed value for ulong");
          return new _PbULong(lo, hi);
        case "number":
          if (value == 0)
            return this.ZERO;
          if (!Number.isSafeInteger(value))
            throw new Error("number is no integer");
          if (value < 0)
            throw new Error("signed value for ulong");
          return new _PbULong(value, value / TWO_PWR_32_DBL2);
      }
    throw new Error("unknown value " + typeof value);
  }
  /**
   * Convert to decimal string.
   */
  toString() {
    return BI ? this.toBigInt().toString() : int64toString(this.lo, this.hi);
  }
  /**
   * Convert to native bigint.
   */
  toBigInt() {
    assertBi(BI);
    BI.V.setInt32(0, this.lo, true);
    BI.V.setInt32(4, this.hi, true);
    return BI.V.getBigUint64(0, true);
  }
};
PbULong.ZERO = new PbULong(0, 0);
var PbLong = class _PbLong extends SharedPbLong {
  /**
   * Create instance from a `string`, `number` or `bigint`.
   */
  static from(value) {
    if (BI)
      switch (typeof value) {
        case "string":
          if (value == "0")
            return this.ZERO;
          if (value == "")
            throw new Error("string is no integer");
          value = BI.C(value);
        case "number":
          if (value === 0)
            return this.ZERO;
          value = BI.C(value);
        case "bigint":
          if (!value)
            return this.ZERO;
          if (value < BI.MIN)
            throw new Error("signed long too small");
          if (value > BI.MAX)
            throw new Error("signed long too large");
          BI.V.setBigInt64(0, value, true);
          return new _PbLong(BI.V.getInt32(0, true), BI.V.getInt32(4, true));
      }
    else
      switch (typeof value) {
        case "string":
          if (value == "0")
            return this.ZERO;
          value = value.trim();
          if (!RE_DECIMAL_STR.test(value))
            throw new Error("string is no integer");
          let [minus, lo, hi] = int64fromString(value);
          if (minus) {
            if (hi > HALF_2_PWR_32 || hi == HALF_2_PWR_32 && lo != 0)
              throw new Error("signed long too small");
          } else if (hi >= HALF_2_PWR_32)
            throw new Error("signed long too large");
          let pbl = new _PbLong(lo, hi);
          return minus ? pbl.negate() : pbl;
        case "number":
          if (value == 0)
            return this.ZERO;
          if (!Number.isSafeInteger(value))
            throw new Error("number is no integer");
          return value > 0 ? new _PbLong(value, value / TWO_PWR_32_DBL2) : new _PbLong(-value, -value / TWO_PWR_32_DBL2).negate();
      }
    throw new Error("unknown value " + typeof value);
  }
  /**
   * Do we have a minus sign?
   */
  isNegative() {
    return (this.hi & HALF_2_PWR_32) !== 0;
  }
  /**
   * Negate two's complement.
   * Invert all the bits and add one to the result.
   */
  negate() {
    let hi = ~this.hi, lo = this.lo;
    if (lo)
      lo = ~lo + 1;
    else
      hi += 1;
    return new _PbLong(lo, hi);
  }
  /**
   * Convert to decimal string.
   */
  toString() {
    if (BI)
      return this.toBigInt().toString();
    if (this.isNegative()) {
      let n = this.negate();
      return "-" + int64toString(n.lo, n.hi);
    }
    return int64toString(this.lo, this.hi);
  }
  /**
   * Convert to native bigint.
   */
  toBigInt() {
    assertBi(BI);
    BI.V.setInt32(0, this.lo, true);
    BI.V.setInt32(4, this.hi, true);
    return BI.V.getBigInt64(0, true);
  }
};
PbLong.ZERO = new PbLong(0, 0);

// node_modules/@protobuf-ts/runtime/build/es2015/binary-reader.js
var defaultsRead = {
  readUnknownField: true,
  readerFactory: (bytes) => new BinaryReader(bytes)
};
function binaryReadOptions(options) {
  return options ? Object.assign(Object.assign({}, defaultsRead), options) : defaultsRead;
}
var BinaryReader = class {
  constructor(buf, textDecoder) {
    this.varint64 = varint64read;
    this.uint32 = varint32read;
    this.buf = buf;
    this.len = buf.length;
    this.pos = 0;
    this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    this.textDecoder = textDecoder !== null && textDecoder !== void 0 ? textDecoder : new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: true
    });
  }
  /**
   * Reads a tag - field number and wire type.
   */
  tag() {
    let tag = this.uint32(), fieldNo = tag >>> 3, wireType = tag & 7;
    if (fieldNo <= 0 || wireType < 0 || wireType > 5)
      throw new Error("illegal tag: field no " + fieldNo + " wire type " + wireType);
    return [fieldNo, wireType];
  }
  /**
   * Skip one element on the wire and return the skipped data.
   * Supports WireType.StartGroup since v2.0.0-alpha.23.
   */
  skip(wireType) {
    let start = this.pos;
    switch (wireType) {
      case WireType.Varint:
        while (this.buf[this.pos++] & 128) {
        }
        break;
      case WireType.Bit64:
        this.pos += 4;
      case WireType.Bit32:
        this.pos += 4;
        break;
      case WireType.LengthDelimited:
        let len = this.uint32();
        this.pos += len;
        break;
      case WireType.StartGroup:
        let t;
        while ((t = this.tag()[1]) !== WireType.EndGroup) {
          this.skip(t);
        }
        break;
      default:
        throw new Error("cant skip wire type " + wireType);
    }
    this.assertBounds();
    return this.buf.subarray(start, this.pos);
  }
  /**
   * Throws error if position in byte array is out of range.
   */
  assertBounds() {
    if (this.pos > this.len)
      throw new RangeError("premature EOF");
  }
  /**
   * Read a `int32` field, a signed 32 bit varint.
   */
  int32() {
    return this.uint32() | 0;
  }
  /**
   * Read a `sint32` field, a signed, zigzag-encoded 32-bit varint.
   */
  sint32() {
    let zze = this.uint32();
    return zze >>> 1 ^ -(zze & 1);
  }
  /**
   * Read a `int64` field, a signed 64-bit varint.
   */
  int64() {
    return new PbLong(...this.varint64());
  }
  /**
   * Read a `uint64` field, an unsigned 64-bit varint.
   */
  uint64() {
    return new PbULong(...this.varint64());
  }
  /**
   * Read a `sint64` field, a signed, zig-zag-encoded 64-bit varint.
   */
  sint64() {
    let [lo, hi] = this.varint64();
    let s = -(lo & 1);
    lo = (lo >>> 1 | (hi & 1) << 31) ^ s;
    hi = hi >>> 1 ^ s;
    return new PbLong(lo, hi);
  }
  /**
   * Read a `bool` field, a variant.
   */
  bool() {
    let [lo, hi] = this.varint64();
    return lo !== 0 || hi !== 0;
  }
  /**
   * Read a `fixed32` field, an unsigned, fixed-length 32-bit integer.
   */
  fixed32() {
    return this.view.getUint32((this.pos += 4) - 4, true);
  }
  /**
   * Read a `sfixed32` field, a signed, fixed-length 32-bit integer.
   */
  sfixed32() {
    return this.view.getInt32((this.pos += 4) - 4, true);
  }
  /**
   * Read a `fixed64` field, an unsigned, fixed-length 64 bit integer.
   */
  fixed64() {
    return new PbULong(this.sfixed32(), this.sfixed32());
  }
  /**
   * Read a `fixed64` field, a signed, fixed-length 64-bit integer.
   */
  sfixed64() {
    return new PbLong(this.sfixed32(), this.sfixed32());
  }
  /**
   * Read a `float` field, 32-bit floating point number.
   */
  float() {
    return this.view.getFloat32((this.pos += 4) - 4, true);
  }
  /**
   * Read a `double` field, a 64-bit floating point number.
   */
  double() {
    return this.view.getFloat64((this.pos += 8) - 8, true);
  }
  /**
   * Read a `bytes` field, length-delimited arbitrary data.
   */
  bytes() {
    let len = this.uint32();
    let start = this.pos;
    this.pos += len;
    this.assertBounds();
    return this.buf.subarray(start, start + len);
  }
  /**
   * Read a `string` field, length-delimited data converted to UTF-8 text.
   */
  string() {
    return this.textDecoder.decode(this.bytes());
  }
};

// node_modules/@protobuf-ts/runtime/build/es2015/assert.js
function assert(condition, msg) {
  if (!condition) {
    throw new Error(msg);
  }
}
var FLOAT32_MAX = 34028234663852886e22;
var FLOAT32_MIN = -34028234663852886e22;
var UINT32_MAX = 4294967295;
var INT32_MAX = 2147483647;
var INT32_MIN = -2147483648;
function assertInt32(arg) {
  if (typeof arg !== "number")
    throw new Error("invalid int 32: " + typeof arg);
  if (!Number.isInteger(arg) || arg > INT32_MAX || arg < INT32_MIN)
    throw new Error("invalid int 32: " + arg);
}
function assertUInt32(arg) {
  if (typeof arg !== "number")
    throw new Error("invalid uint 32: " + typeof arg);
  if (!Number.isInteger(arg) || arg > UINT32_MAX || arg < 0)
    throw new Error("invalid uint 32: " + arg);
}
function assertFloat32(arg) {
  if (typeof arg !== "number")
    throw new Error("invalid float 32: " + typeof arg);
  if (!Number.isFinite(arg))
    return;
  if (arg > FLOAT32_MAX || arg < FLOAT32_MIN)
    throw new Error("invalid float 32: " + arg);
}

// node_modules/@protobuf-ts/runtime/build/es2015/binary-writer.js
var defaultsWrite = {
  writeUnknownFields: true,
  writerFactory: () => new BinaryWriter()
};
function binaryWriteOptions(options) {
  return options ? Object.assign(Object.assign({}, defaultsWrite), options) : defaultsWrite;
}
var BinaryWriter = class {
  constructor(textEncoder) {
    this.stack = [];
    this.textEncoder = textEncoder !== null && textEncoder !== void 0 ? textEncoder : new TextEncoder();
    this.chunks = [];
    this.buf = [];
  }
  /**
   * Return all bytes written and reset this writer.
   */
  finish() {
    this.chunks.push(new Uint8Array(this.buf));
    let len = 0;
    for (let i = 0; i < this.chunks.length; i++)
      len += this.chunks[i].length;
    let bytes = new Uint8Array(len);
    let offset = 0;
    for (let i = 0; i < this.chunks.length; i++) {
      bytes.set(this.chunks[i], offset);
      offset += this.chunks[i].length;
    }
    this.chunks = [];
    return bytes;
  }
  /**
   * Start a new fork for length-delimited data like a message
   * or a packed repeated field.
   *
   * Must be joined later with `join()`.
   */
  fork() {
    this.stack.push({ chunks: this.chunks, buf: this.buf });
    this.chunks = [];
    this.buf = [];
    return this;
  }
  /**
   * Join the last fork. Write its length and bytes, then
   * return to the previous state.
   */
  join() {
    let chunk = this.finish();
    let prev = this.stack.pop();
    if (!prev)
      throw new Error("invalid state, fork stack empty");
    this.chunks = prev.chunks;
    this.buf = prev.buf;
    this.uint32(chunk.byteLength);
    return this.raw(chunk);
  }
  /**
   * Writes a tag (field number and wire type).
   *
   * Equivalent to `uint32( (fieldNo << 3 | type) >>> 0 )`.
   *
   * Generated code should compute the tag ahead of time and call `uint32()`.
   */
  tag(fieldNo, type) {
    return this.uint32((fieldNo << 3 | type) >>> 0);
  }
  /**
   * Write a chunk of raw bytes.
   */
  raw(chunk) {
    if (this.buf.length) {
      this.chunks.push(new Uint8Array(this.buf));
      this.buf = [];
    }
    this.chunks.push(chunk);
    return this;
  }
  /**
   * Write a `uint32` value, an unsigned 32 bit varint.
   */
  uint32(value) {
    assertUInt32(value);
    while (value > 127) {
      this.buf.push(value & 127 | 128);
      value = value >>> 7;
    }
    this.buf.push(value);
    return this;
  }
  /**
   * Write a `int32` value, a signed 32 bit varint.
   */
  int32(value) {
    assertInt32(value);
    varint32write(value, this.buf);
    return this;
  }
  /**
   * Write a `bool` value, a variant.
   */
  bool(value) {
    this.buf.push(value ? 1 : 0);
    return this;
  }
  /**
   * Write a `bytes` value, length-delimited arbitrary data.
   */
  bytes(value) {
    this.uint32(value.byteLength);
    return this.raw(value);
  }
  /**
   * Write a `string` value, length-delimited data converted to UTF-8 text.
   */
  string(value) {
    let chunk = this.textEncoder.encode(value);
    this.uint32(chunk.byteLength);
    return this.raw(chunk);
  }
  /**
   * Write a `float` value, 32-bit floating point number.
   */
  float(value) {
    assertFloat32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setFloat32(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `double` value, a 64-bit floating point number.
   */
  double(value) {
    let chunk = new Uint8Array(8);
    new DataView(chunk.buffer).setFloat64(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `fixed32` value, an unsigned, fixed-length 32-bit integer.
   */
  fixed32(value) {
    assertUInt32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setUint32(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `sfixed32` value, a signed, fixed-length 32-bit integer.
   */
  sfixed32(value) {
    assertInt32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setInt32(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `sint32` value, a signed, zigzag-encoded 32-bit varint.
   */
  sint32(value) {
    assertInt32(value);
    value = (value << 1 ^ value >> 31) >>> 0;
    varint32write(value, this.buf);
    return this;
  }
  /**
   * Write a `fixed64` value, a signed, fixed-length 64-bit integer.
   */
  sfixed64(value) {
    let chunk = new Uint8Array(8);
    let view = new DataView(chunk.buffer);
    let long = PbLong.from(value);
    view.setInt32(0, long.lo, true);
    view.setInt32(4, long.hi, true);
    return this.raw(chunk);
  }
  /**
   * Write a `fixed64` value, an unsigned, fixed-length 64 bit integer.
   */
  fixed64(value) {
    let chunk = new Uint8Array(8);
    let view = new DataView(chunk.buffer);
    let long = PbULong.from(value);
    view.setInt32(0, long.lo, true);
    view.setInt32(4, long.hi, true);
    return this.raw(chunk);
  }
  /**
   * Write a `int64` value, a signed 64-bit varint.
   */
  int64(value) {
    let long = PbLong.from(value);
    varint64write(long.lo, long.hi, this.buf);
    return this;
  }
  /**
   * Write a `sint64` value, a signed, zig-zag-encoded 64-bit varint.
   */
  sint64(value) {
    let long = PbLong.from(value), sign = long.hi >> 31, lo = long.lo << 1 ^ sign, hi = (long.hi << 1 | long.lo >>> 31) ^ sign;
    varint64write(lo, hi, this.buf);
    return this;
  }
  /**
   * Write a `uint64` value, an unsigned 64-bit varint.
   */
  uint64(value) {
    let long = PbULong.from(value);
    varint64write(long.lo, long.hi, this.buf);
    return this;
  }
};

// node_modules/@protobuf-ts/runtime/build/es2015/json-format-contract.js
var defaultsWrite2 = {
  emitDefaultValues: false,
  enumAsInteger: false,
  useProtoFieldName: false,
  prettySpaces: 0
};
var defaultsRead2 = {
  ignoreUnknownFields: false
};
function jsonReadOptions(options) {
  return options ? Object.assign(Object.assign({}, defaultsRead2), options) : defaultsRead2;
}
function jsonWriteOptions(options) {
  return options ? Object.assign(Object.assign({}, defaultsWrite2), options) : defaultsWrite2;
}

// node_modules/@protobuf-ts/runtime/build/es2015/message-type-contract.js
var MESSAGE_TYPE = Symbol.for("protobuf-ts/message-type");

// node_modules/@protobuf-ts/runtime/build/es2015/lower-camel-case.js
function lowerCamelCase(snakeCase) {
  let capNext = false;
  const sb = [];
  for (let i = 0; i < snakeCase.length; i++) {
    let next = snakeCase.charAt(i);
    if (next == "_") {
      capNext = true;
    } else if (/\d/.test(next)) {
      sb.push(next);
      capNext = true;
    } else if (capNext) {
      sb.push(next.toUpperCase());
      capNext = false;
    } else if (i == 0) {
      sb.push(next.toLowerCase());
    } else {
      sb.push(next);
    }
  }
  return sb.join("");
}

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-info.js
var ScalarType;
(function(ScalarType2) {
  ScalarType2[ScalarType2["DOUBLE"] = 1] = "DOUBLE";
  ScalarType2[ScalarType2["FLOAT"] = 2] = "FLOAT";
  ScalarType2[ScalarType2["INT64"] = 3] = "INT64";
  ScalarType2[ScalarType2["UINT64"] = 4] = "UINT64";
  ScalarType2[ScalarType2["INT32"] = 5] = "INT32";
  ScalarType2[ScalarType2["FIXED64"] = 6] = "FIXED64";
  ScalarType2[ScalarType2["FIXED32"] = 7] = "FIXED32";
  ScalarType2[ScalarType2["BOOL"] = 8] = "BOOL";
  ScalarType2[ScalarType2["STRING"] = 9] = "STRING";
  ScalarType2[ScalarType2["BYTES"] = 12] = "BYTES";
  ScalarType2[ScalarType2["UINT32"] = 13] = "UINT32";
  ScalarType2[ScalarType2["SFIXED32"] = 15] = "SFIXED32";
  ScalarType2[ScalarType2["SFIXED64"] = 16] = "SFIXED64";
  ScalarType2[ScalarType2["SINT32"] = 17] = "SINT32";
  ScalarType2[ScalarType2["SINT64"] = 18] = "SINT64";
})(ScalarType || (ScalarType = {}));
var LongType;
(function(LongType2) {
  LongType2[LongType2["BIGINT"] = 0] = "BIGINT";
  LongType2[LongType2["STRING"] = 1] = "STRING";
  LongType2[LongType2["NUMBER"] = 2] = "NUMBER";
})(LongType || (LongType = {}));
var RepeatType;
(function(RepeatType2) {
  RepeatType2[RepeatType2["NO"] = 0] = "NO";
  RepeatType2[RepeatType2["PACKED"] = 1] = "PACKED";
  RepeatType2[RepeatType2["UNPACKED"] = 2] = "UNPACKED";
})(RepeatType || (RepeatType = {}));
function normalizeFieldInfo(field) {
  var _a, _b, _c, _d;
  field.localName = (_a = field.localName) !== null && _a !== void 0 ? _a : lowerCamelCase(field.name);
  field.jsonName = (_b = field.jsonName) !== null && _b !== void 0 ? _b : lowerCamelCase(field.name);
  field.repeat = (_c = field.repeat) !== null && _c !== void 0 ? _c : RepeatType.NO;
  field.opt = (_d = field.opt) !== null && _d !== void 0 ? _d : field.repeat ? false : field.oneof ? false : field.kind == "message";
  return field;
}

// node_modules/@protobuf-ts/runtime/build/es2015/oneof.js
function isOneofGroup(any) {
  if (typeof any != "object" || any === null || !any.hasOwnProperty("oneofKind")) {
    return false;
  }
  switch (typeof any.oneofKind) {
    case "string":
      if (any[any.oneofKind] === void 0)
        return false;
      return Object.keys(any).length == 2;
    case "undefined":
      return Object.keys(any).length == 1;
    default:
      return false;
  }
}

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-type-check.js
var ReflectionTypeCheck = class {
  constructor(info) {
    var _a;
    this.fields = (_a = info.fields) !== null && _a !== void 0 ? _a : [];
  }
  prepare() {
    if (this.data)
      return;
    const req = [], known = [], oneofs = [];
    for (let field of this.fields) {
      if (field.oneof) {
        if (!oneofs.includes(field.oneof)) {
          oneofs.push(field.oneof);
          req.push(field.oneof);
          known.push(field.oneof);
        }
      } else {
        known.push(field.localName);
        switch (field.kind) {
          case "scalar":
          case "enum":
            if (!field.opt || field.repeat)
              req.push(field.localName);
            break;
          case "message":
            if (field.repeat)
              req.push(field.localName);
            break;
          case "map":
            req.push(field.localName);
            break;
        }
      }
    }
    this.data = { req, known, oneofs: Object.values(oneofs) };
  }
  /**
   * Is the argument a valid message as specified by the
   * reflection information?
   *
   * Checks all field types recursively. The `depth`
   * specifies how deep into the structure the check will be.
   *
   * With a depth of 0, only the presence of fields
   * is checked.
   *
   * With a depth of 1 or more, the field types are checked.
   *
   * With a depth of 2 or more, the members of map, repeated
   * and message fields are checked.
   *
   * Message fields will be checked recursively with depth - 1.
   *
   * The number of map entries / repeated values being checked
   * is < depth.
   */
  is(message, depth, allowExcessProperties = false) {
    if (depth < 0)
      return true;
    if (message === null || message === void 0 || typeof message != "object")
      return false;
    this.prepare();
    let keys = Object.keys(message), data = this.data;
    if (keys.length < data.req.length || data.req.some((n) => !keys.includes(n)))
      return false;
    if (!allowExcessProperties) {
      if (keys.some((k) => !data.known.includes(k)))
        return false;
    }
    if (depth < 1) {
      return true;
    }
    for (const name of data.oneofs) {
      const group = message[name];
      if (!isOneofGroup(group))
        return false;
      if (group.oneofKind === void 0)
        continue;
      const field = this.fields.find((f) => f.localName === group.oneofKind);
      if (!field)
        return false;
      if (!this.field(group[group.oneofKind], field, allowExcessProperties, depth))
        return false;
    }
    for (const field of this.fields) {
      if (field.oneof !== void 0)
        continue;
      if (!this.field(message[field.localName], field, allowExcessProperties, depth))
        return false;
    }
    return true;
  }
  field(arg, field, allowExcessProperties, depth) {
    let repeated = field.repeat;
    switch (field.kind) {
      case "scalar":
        if (arg === void 0)
          return field.opt;
        if (repeated)
          return this.scalars(arg, field.T, depth, field.L);
        return this.scalar(arg, field.T, field.L);
      case "enum":
        if (arg === void 0)
          return field.opt;
        if (repeated)
          return this.scalars(arg, ScalarType.INT32, depth);
        return this.scalar(arg, ScalarType.INT32);
      case "message":
        if (arg === void 0)
          return true;
        if (repeated)
          return this.messages(arg, field.T(), allowExcessProperties, depth);
        return this.message(arg, field.T(), allowExcessProperties, depth);
      case "map":
        if (typeof arg != "object" || arg === null)
          return false;
        if (depth < 2)
          return true;
        if (!this.mapKeys(arg, field.K, depth))
          return false;
        switch (field.V.kind) {
          case "scalar":
            return this.scalars(Object.values(arg), field.V.T, depth, field.V.L);
          case "enum":
            return this.scalars(Object.values(arg), ScalarType.INT32, depth);
          case "message":
            return this.messages(Object.values(arg), field.V.T(), allowExcessProperties, depth);
        }
        break;
    }
    return true;
  }
  message(arg, type, allowExcessProperties, depth) {
    if (allowExcessProperties) {
      return type.isAssignable(arg, depth);
    }
    return type.is(arg, depth);
  }
  messages(arg, type, allowExcessProperties, depth) {
    if (!Array.isArray(arg))
      return false;
    if (depth < 2)
      return true;
    if (allowExcessProperties) {
      for (let i = 0; i < arg.length && i < depth; i++)
        if (!type.isAssignable(arg[i], depth - 1))
          return false;
    } else {
      for (let i = 0; i < arg.length && i < depth; i++)
        if (!type.is(arg[i], depth - 1))
          return false;
    }
    return true;
  }
  scalar(arg, type, longType) {
    let argType = typeof arg;
    switch (type) {
      case ScalarType.UINT64:
      case ScalarType.FIXED64:
      case ScalarType.INT64:
      case ScalarType.SFIXED64:
      case ScalarType.SINT64:
        switch (longType) {
          case LongType.BIGINT:
            return argType == "bigint";
          case LongType.NUMBER:
            return argType == "number" && !isNaN(arg);
          default:
            return argType == "string";
        }
      case ScalarType.BOOL:
        return argType == "boolean";
      case ScalarType.STRING:
        return argType == "string";
      case ScalarType.BYTES:
        return arg instanceof Uint8Array;
      case ScalarType.DOUBLE:
      case ScalarType.FLOAT:
        return argType == "number" && !isNaN(arg);
      default:
        return argType == "number" && Number.isInteger(arg);
    }
  }
  scalars(arg, type, depth, longType) {
    if (!Array.isArray(arg))
      return false;
    if (depth < 2)
      return true;
    if (Array.isArray(arg)) {
      for (let i = 0; i < arg.length && i < depth; i++)
        if (!this.scalar(arg[i], type, longType))
          return false;
    }
    return true;
  }
  mapKeys(map, type, depth) {
    let keys = Object.keys(map);
    switch (type) {
      case ScalarType.INT32:
      case ScalarType.FIXED32:
      case ScalarType.SFIXED32:
      case ScalarType.SINT32:
      case ScalarType.UINT32:
        return this.scalars(keys.slice(0, depth).map((k) => parseInt(k)), type, depth);
      case ScalarType.BOOL:
        return this.scalars(keys.slice(0, depth).map((k) => k == "true" ? true : k == "false" ? false : k), type, depth);
      default:
        return this.scalars(keys, type, depth, LongType.STRING);
    }
  }
};

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-long-convert.js
function reflectionLongConvert(long, type) {
  switch (type) {
    case LongType.BIGINT:
      return long.toBigInt();
    case LongType.NUMBER:
      return long.toNumber();
    default:
      return long.toString();
  }
}

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-json-reader.js
var ReflectionJsonReader = class {
  constructor(info) {
    this.info = info;
  }
  prepare() {
    var _a;
    if (this.fMap === void 0) {
      this.fMap = {};
      const fieldsInput = (_a = this.info.fields) !== null && _a !== void 0 ? _a : [];
      for (const field of fieldsInput) {
        this.fMap[field.name] = field;
        this.fMap[field.jsonName] = field;
        this.fMap[field.localName] = field;
      }
    }
  }
  // Cannot parse JSON <type of jsonValue> for <type name>#<fieldName>.
  assert(condition, fieldName, jsonValue) {
    if (!condition) {
      let what = typeofJsonValue(jsonValue);
      if (what == "number" || what == "boolean")
        what = jsonValue.toString();
      throw new Error(`Cannot parse JSON ${what} for ${this.info.typeName}#${fieldName}`);
    }
  }
  /**
   * Reads a message from canonical JSON format into the target message.
   *
   * Repeated fields are appended. Map entries are added, overwriting
   * existing keys.
   *
   * If a message field is already present, it will be merged with the
   * new data.
   */
  read(input, message, options) {
    this.prepare();
    const oneofsHandled = [];
    for (const [jsonKey, jsonValue] of Object.entries(input)) {
      const field = this.fMap[jsonKey];
      if (!field) {
        if (!options.ignoreUnknownFields)
          throw new Error(`Found unknown field while reading ${this.info.typeName} from JSON format. JSON key: ${jsonKey}`);
        continue;
      }
      const localName = field.localName;
      let target;
      if (field.oneof) {
        if (jsonValue === null && (field.kind !== "enum" || field.T()[0] !== "google.protobuf.NullValue")) {
          continue;
        }
        if (oneofsHandled.includes(field.oneof))
          throw new Error(`Multiple members of the oneof group "${field.oneof}" of ${this.info.typeName} are present in JSON.`);
        oneofsHandled.push(field.oneof);
        target = message[field.oneof] = {
          oneofKind: localName
        };
      } else {
        target = message;
      }
      if (field.kind == "map") {
        if (jsonValue === null) {
          continue;
        }
        this.assert(isJsonObject(jsonValue), field.name, jsonValue);
        const fieldObj = target[localName];
        for (const [jsonObjKey, jsonObjValue] of Object.entries(jsonValue)) {
          this.assert(jsonObjValue !== null, field.name + " map value", null);
          let val;
          switch (field.V.kind) {
            case "message":
              val = field.V.T().internalJsonRead(jsonObjValue, options);
              break;
            case "enum":
              val = this.enum(field.V.T(), jsonObjValue, field.name, options.ignoreUnknownFields);
              if (val === false)
                continue;
              break;
            case "scalar":
              val = this.scalar(jsonObjValue, field.V.T, field.V.L, field.name);
              break;
          }
          this.assert(val !== void 0, field.name + " map value", jsonObjValue);
          let key = jsonObjKey;
          if (field.K == ScalarType.BOOL)
            key = key == "true" ? true : key == "false" ? false : key;
          key = this.scalar(key, field.K, LongType.STRING, field.name).toString();
          fieldObj[key] = val;
        }
      } else if (field.repeat) {
        if (jsonValue === null)
          continue;
        this.assert(Array.isArray(jsonValue), field.name, jsonValue);
        const fieldArr = target[localName];
        for (const jsonItem of jsonValue) {
          this.assert(jsonItem !== null, field.name, null);
          let val;
          switch (field.kind) {
            case "message":
              val = field.T().internalJsonRead(jsonItem, options);
              break;
            case "enum":
              val = this.enum(field.T(), jsonItem, field.name, options.ignoreUnknownFields);
              if (val === false)
                continue;
              break;
            case "scalar":
              val = this.scalar(jsonItem, field.T, field.L, field.name);
              break;
          }
          this.assert(val !== void 0, field.name, jsonValue);
          fieldArr.push(val);
        }
      } else {
        switch (field.kind) {
          case "message":
            if (jsonValue === null && field.T().typeName != "google.protobuf.Value") {
              this.assert(field.oneof === void 0, field.name + " (oneof member)", null);
              continue;
            }
            target[localName] = field.T().internalJsonRead(jsonValue, options, target[localName]);
            break;
          case "enum":
            if (jsonValue === null)
              continue;
            let val = this.enum(field.T(), jsonValue, field.name, options.ignoreUnknownFields);
            if (val === false)
              continue;
            target[localName] = val;
            break;
          case "scalar":
            if (jsonValue === null)
              continue;
            target[localName] = this.scalar(jsonValue, field.T, field.L, field.name);
            break;
        }
      }
    }
  }
  /**
   * Returns `false` for unrecognized string representations.
   *
   * google.protobuf.NullValue accepts only JSON `null` (or the old `"NULL_VALUE"`).
   */
  enum(type, json, fieldName, ignoreUnknownFields) {
    if (type[0] == "google.protobuf.NullValue")
      assert(json === null || json === "NULL_VALUE", `Unable to parse field ${this.info.typeName}#${fieldName}, enum ${type[0]} only accepts null.`);
    if (json === null)
      return 0;
    switch (typeof json) {
      case "number":
        assert(Number.isInteger(json), `Unable to parse field ${this.info.typeName}#${fieldName}, enum can only be integral number, got ${json}.`);
        return json;
      case "string":
        let localEnumName = json;
        if (type[2] && json.substring(0, type[2].length) === type[2])
          localEnumName = json.substring(type[2].length);
        let enumNumber = type[1][localEnumName];
        if (typeof enumNumber === "undefined" && ignoreUnknownFields) {
          return false;
        }
        assert(typeof enumNumber == "number", `Unable to parse field ${this.info.typeName}#${fieldName}, enum ${type[0]} has no value for "${json}".`);
        return enumNumber;
    }
    assert(false, `Unable to parse field ${this.info.typeName}#${fieldName}, cannot parse enum value from ${typeof json}".`);
  }
  scalar(json, type, longType, fieldName) {
    let e;
    try {
      switch (type) {
        // float, double: JSON value will be a number or one of the special string values "NaN", "Infinity", and "-Infinity".
        // Either numbers or strings are accepted. Exponent notation is also accepted.
        case ScalarType.DOUBLE:
        case ScalarType.FLOAT:
          if (json === null)
            return 0;
          if (json === "NaN")
            return Number.NaN;
          if (json === "Infinity")
            return Number.POSITIVE_INFINITY;
          if (json === "-Infinity")
            return Number.NEGATIVE_INFINITY;
          if (json === "") {
            e = "empty string";
            break;
          }
          if (typeof json == "string" && json.trim().length !== json.length) {
            e = "extra whitespace";
            break;
          }
          if (typeof json != "string" && typeof json != "number") {
            break;
          }
          let float = Number(json);
          if (Number.isNaN(float)) {
            e = "not a number";
            break;
          }
          if (!Number.isFinite(float)) {
            e = "too large or small";
            break;
          }
          if (type == ScalarType.FLOAT)
            assertFloat32(float);
          return float;
        // int32, fixed32, uint32: JSON value will be a decimal number. Either numbers or strings are accepted.
        case ScalarType.INT32:
        case ScalarType.FIXED32:
        case ScalarType.SFIXED32:
        case ScalarType.SINT32:
        case ScalarType.UINT32:
          if (json === null)
            return 0;
          let int32;
          if (typeof json == "number")
            int32 = json;
          else if (json === "")
            e = "empty string";
          else if (typeof json == "string") {
            if (json.trim().length !== json.length)
              e = "extra whitespace";
            else
              int32 = Number(json);
          }
          if (int32 === void 0)
            break;
          if (type == ScalarType.UINT32)
            assertUInt32(int32);
          else
            assertInt32(int32);
          return int32;
        // int64, fixed64, uint64: JSON value will be a decimal string. Either numbers or strings are accepted.
        case ScalarType.INT64:
        case ScalarType.SFIXED64:
        case ScalarType.SINT64:
          if (json === null)
            return reflectionLongConvert(PbLong.ZERO, longType);
          if (typeof json != "number" && typeof json != "string")
            break;
          return reflectionLongConvert(PbLong.from(json), longType);
        case ScalarType.FIXED64:
        case ScalarType.UINT64:
          if (json === null)
            return reflectionLongConvert(PbULong.ZERO, longType);
          if (typeof json != "number" && typeof json != "string")
            break;
          return reflectionLongConvert(PbULong.from(json), longType);
        // bool:
        case ScalarType.BOOL:
          if (json === null)
            return false;
          if (typeof json !== "boolean")
            break;
          return json;
        // string:
        case ScalarType.STRING:
          if (json === null)
            return "";
          if (typeof json !== "string") {
            e = "extra whitespace";
            break;
          }
          try {
            encodeURIComponent(json);
          } catch (e2) {
            e2 = "invalid UTF8";
            break;
          }
          return json;
        // bytes: JSON value will be the data encoded as a string using standard base64 encoding with paddings.
        // Either standard or URL-safe base64 encoding with/without paddings are accepted.
        case ScalarType.BYTES:
          if (json === null || json === "")
            return new Uint8Array(0);
          if (typeof json !== "string")
            break;
          return base64decode(json);
      }
    } catch (error) {
      e = error.message;
    }
    this.assert(false, fieldName + (e ? " - " + e : ""), json);
  }
};

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-json-writer.js
var ReflectionJsonWriter = class {
  constructor(info) {
    var _a;
    this.fields = (_a = info.fields) !== null && _a !== void 0 ? _a : [];
  }
  /**
   * Converts the message to a JSON object, based on the field descriptors.
   */
  write(message, options) {
    const json = {}, source = message;
    for (const field of this.fields) {
      if (!field.oneof) {
        let jsonValue2 = this.field(field, source[field.localName], options);
        if (jsonValue2 !== void 0)
          json[options.useProtoFieldName ? field.name : field.jsonName] = jsonValue2;
        continue;
      }
      const group = source[field.oneof];
      if (group.oneofKind !== field.localName)
        continue;
      const opt = field.kind == "scalar" || field.kind == "enum" ? Object.assign(Object.assign({}, options), { emitDefaultValues: true }) : options;
      let jsonValue = this.field(field, group[field.localName], opt);
      assert(jsonValue !== void 0);
      json[options.useProtoFieldName ? field.name : field.jsonName] = jsonValue;
    }
    return json;
  }
  field(field, value, options) {
    let jsonValue = void 0;
    if (field.kind == "map") {
      assert(typeof value == "object" && value !== null);
      const jsonObj = {};
      switch (field.V.kind) {
        case "scalar":
          for (const [entryKey, entryValue] of Object.entries(value)) {
            const val = this.scalar(field.V.T, entryValue, field.name, false, true);
            assert(val !== void 0);
            jsonObj[entryKey.toString()] = val;
          }
          break;
        case "message":
          const messageType = field.V.T();
          for (const [entryKey, entryValue] of Object.entries(value)) {
            const val = this.message(messageType, entryValue, field.name, options);
            assert(val !== void 0);
            jsonObj[entryKey.toString()] = val;
          }
          break;
        case "enum":
          const enumInfo = field.V.T();
          for (const [entryKey, entryValue] of Object.entries(value)) {
            assert(entryValue === void 0 || typeof entryValue == "number");
            const val = this.enum(enumInfo, entryValue, field.name, false, true, options.enumAsInteger);
            assert(val !== void 0);
            jsonObj[entryKey.toString()] = val;
          }
          break;
      }
      if (options.emitDefaultValues || Object.keys(jsonObj).length > 0)
        jsonValue = jsonObj;
    } else if (field.repeat) {
      assert(Array.isArray(value));
      const jsonArr = [];
      switch (field.kind) {
        case "scalar":
          for (let i = 0; i < value.length; i++) {
            const val = this.scalar(field.T, value[i], field.name, field.opt, true);
            assert(val !== void 0);
            jsonArr.push(val);
          }
          break;
        case "enum":
          const enumInfo = field.T();
          for (let i = 0; i < value.length; i++) {
            assert(value[i] === void 0 || typeof value[i] == "number");
            const val = this.enum(enumInfo, value[i], field.name, field.opt, true, options.enumAsInteger);
            assert(val !== void 0);
            jsonArr.push(val);
          }
          break;
        case "message":
          const messageType = field.T();
          for (let i = 0; i < value.length; i++) {
            const val = this.message(messageType, value[i], field.name, options);
            assert(val !== void 0);
            jsonArr.push(val);
          }
          break;
      }
      if (options.emitDefaultValues || jsonArr.length > 0 || options.emitDefaultValues)
        jsonValue = jsonArr;
    } else {
      switch (field.kind) {
        case "scalar":
          jsonValue = this.scalar(field.T, value, field.name, field.opt, options.emitDefaultValues);
          break;
        case "enum":
          jsonValue = this.enum(field.T(), value, field.name, field.opt, options.emitDefaultValues, options.enumAsInteger);
          break;
        case "message":
          jsonValue = this.message(field.T(), value, field.name, options);
          break;
      }
    }
    return jsonValue;
  }
  /**
   * Returns `null` as the default for google.protobuf.NullValue.
   */
  enum(type, value, fieldName, optional, emitDefaultValues, enumAsInteger) {
    if (type[0] == "google.protobuf.NullValue")
      return !emitDefaultValues && !optional ? void 0 : null;
    if (value === void 0) {
      assert(optional);
      return void 0;
    }
    if (value === 0 && !emitDefaultValues && !optional)
      return void 0;
    assert(typeof value == "number");
    assert(Number.isInteger(value));
    if (enumAsInteger || !type[1].hasOwnProperty(value))
      return value;
    if (type[2])
      return type[2] + type[1][value];
    return type[1][value];
  }
  message(type, value, fieldName, options) {
    if (value === void 0)
      return options.emitDefaultValues ? null : void 0;
    return type.internalJsonWrite(value, options);
  }
  scalar(type, value, fieldName, optional, emitDefaultValues) {
    if (value === void 0) {
      assert(optional);
      return void 0;
    }
    const ed = emitDefaultValues || optional;
    switch (type) {
      // int32, fixed32, uint32: JSON value will be a decimal number. Either numbers or strings are accepted.
      case ScalarType.INT32:
      case ScalarType.SFIXED32:
      case ScalarType.SINT32:
        if (value === 0)
          return ed ? 0 : void 0;
        assertInt32(value);
        return value;
      case ScalarType.FIXED32:
      case ScalarType.UINT32:
        if (value === 0)
          return ed ? 0 : void 0;
        assertUInt32(value);
        return value;
      // float, double: JSON value will be a number or one of the special string values "NaN", "Infinity", and "-Infinity".
      // Either numbers or strings are accepted. Exponent notation is also accepted.
      case ScalarType.FLOAT:
        assertFloat32(value);
      case ScalarType.DOUBLE:
        if (value === 0)
          return ed ? 0 : void 0;
        assert(typeof value == "number");
        if (Number.isNaN(value))
          return "NaN";
        if (value === Number.POSITIVE_INFINITY)
          return "Infinity";
        if (value === Number.NEGATIVE_INFINITY)
          return "-Infinity";
        return value;
      // string:
      case ScalarType.STRING:
        if (value === "")
          return ed ? "" : void 0;
        assert(typeof value == "string");
        return value;
      // bool:
      case ScalarType.BOOL:
        if (value === false)
          return ed ? false : void 0;
        assert(typeof value == "boolean");
        return value;
      // JSON value will be a decimal string. Either numbers or strings are accepted.
      case ScalarType.UINT64:
      case ScalarType.FIXED64:
        assert(typeof value == "number" || typeof value == "string" || typeof value == "bigint");
        let ulong = PbULong.from(value);
        if (ulong.isZero() && !ed)
          return void 0;
        return ulong.toString();
      // JSON value will be a decimal string. Either numbers or strings are accepted.
      case ScalarType.INT64:
      case ScalarType.SFIXED64:
      case ScalarType.SINT64:
        assert(typeof value == "number" || typeof value == "string" || typeof value == "bigint");
        let long = PbLong.from(value);
        if (long.isZero() && !ed)
          return void 0;
        return long.toString();
      // bytes: JSON value will be the data encoded as a string using standard base64 encoding with paddings.
      // Either standard or URL-safe base64 encoding with/without paddings are accepted.
      case ScalarType.BYTES:
        assert(value instanceof Uint8Array);
        if (!value.byteLength)
          return ed ? "" : void 0;
        return base64encode(value);
    }
  }
};

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-scalar-default.js
function reflectionScalarDefault(type, longType = LongType.STRING) {
  switch (type) {
    case ScalarType.BOOL:
      return false;
    case ScalarType.UINT64:
    case ScalarType.FIXED64:
      return reflectionLongConvert(PbULong.ZERO, longType);
    case ScalarType.INT64:
    case ScalarType.SFIXED64:
    case ScalarType.SINT64:
      return reflectionLongConvert(PbLong.ZERO, longType);
    case ScalarType.DOUBLE:
    case ScalarType.FLOAT:
      return 0;
    case ScalarType.BYTES:
      return new Uint8Array(0);
    case ScalarType.STRING:
      return "";
    default:
      return 0;
  }
}

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-binary-reader.js
var ReflectionBinaryReader = class {
  constructor(info) {
    this.info = info;
  }
  prepare() {
    var _a;
    if (!this.fieldNoToField) {
      const fieldsInput = (_a = this.info.fields) !== null && _a !== void 0 ? _a : [];
      this.fieldNoToField = new Map(fieldsInput.map((field) => [field.no, field]));
    }
  }
  /**
   * Reads a message from binary format into the target message.
   *
   * Repeated fields are appended. Map entries are added, overwriting
   * existing keys.
   *
   * If a message field is already present, it will be merged with the
   * new data.
   */
  read(reader, message, options, length) {
    this.prepare();
    const end = length === void 0 ? reader.len : reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag(), field = this.fieldNoToField.get(fieldNo);
      if (!field) {
        let u = options.readUnknownField;
        if (u == "throw")
          throw new Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.info.typeName}`);
        let d = reader.skip(wireType);
        if (u !== false)
          (u === true ? UnknownFieldHandler.onRead : u)(this.info.typeName, message, fieldNo, wireType, d);
        continue;
      }
      let target = message, repeated = field.repeat, localName = field.localName;
      if (field.oneof) {
        target = target[field.oneof];
        if (target.oneofKind !== localName)
          target = message[field.oneof] = {
            oneofKind: localName
          };
      }
      switch (field.kind) {
        case "scalar":
        case "enum":
          let T = field.kind == "enum" ? ScalarType.INT32 : field.T;
          let L = field.kind == "scalar" ? field.L : void 0;
          if (repeated) {
            let arr = target[localName];
            if (wireType == WireType.LengthDelimited && T != ScalarType.STRING && T != ScalarType.BYTES) {
              let e = reader.uint32() + reader.pos;
              while (reader.pos < e)
                arr.push(this.scalar(reader, T, L));
            } else
              arr.push(this.scalar(reader, T, L));
          } else
            target[localName] = this.scalar(reader, T, L);
          break;
        case "message":
          if (repeated) {
            let arr = target[localName];
            let msg = field.T().internalBinaryRead(reader, reader.uint32(), options);
            arr.push(msg);
          } else
            target[localName] = field.T().internalBinaryRead(reader, reader.uint32(), options, target[localName]);
          break;
        case "map":
          let [mapKey, mapVal] = this.mapEntry(field, reader, options);
          target[localName][mapKey] = mapVal;
          break;
      }
    }
  }
  /**
   * Read a map field, expecting key field = 1, value field = 2
   */
  mapEntry(field, reader, options) {
    let length = reader.uint32();
    let end = reader.pos + length;
    let key = void 0;
    let val = void 0;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case 1:
          if (field.K == ScalarType.BOOL)
            key = reader.bool().toString();
          else
            key = this.scalar(reader, field.K, LongType.STRING);
          break;
        case 2:
          switch (field.V.kind) {
            case "scalar":
              val = this.scalar(reader, field.V.T, field.V.L);
              break;
            case "enum":
              val = reader.int32();
              break;
            case "message":
              val = field.V.T().internalBinaryRead(reader, reader.uint32(), options);
              break;
          }
          break;
        default:
          throw new Error(`Unknown field ${fieldNo} (wire type ${wireType}) in map entry for ${this.info.typeName}#${field.name}`);
      }
    }
    if (key === void 0) {
      let keyRaw = reflectionScalarDefault(field.K);
      key = field.K == ScalarType.BOOL ? keyRaw.toString() : keyRaw;
    }
    if (val === void 0)
      switch (field.V.kind) {
        case "scalar":
          val = reflectionScalarDefault(field.V.T, field.V.L);
          break;
        case "enum":
          val = 0;
          break;
        case "message":
          val = field.V.T().create();
          break;
      }
    return [key, val];
  }
  scalar(reader, type, longType) {
    switch (type) {
      case ScalarType.INT32:
        return reader.int32();
      case ScalarType.STRING:
        return reader.string();
      case ScalarType.BOOL:
        return reader.bool();
      case ScalarType.DOUBLE:
        return reader.double();
      case ScalarType.FLOAT:
        return reader.float();
      case ScalarType.INT64:
        return reflectionLongConvert(reader.int64(), longType);
      case ScalarType.UINT64:
        return reflectionLongConvert(reader.uint64(), longType);
      case ScalarType.FIXED64:
        return reflectionLongConvert(reader.fixed64(), longType);
      case ScalarType.FIXED32:
        return reader.fixed32();
      case ScalarType.BYTES:
        return reader.bytes();
      case ScalarType.UINT32:
        return reader.uint32();
      case ScalarType.SFIXED32:
        return reader.sfixed32();
      case ScalarType.SFIXED64:
        return reflectionLongConvert(reader.sfixed64(), longType);
      case ScalarType.SINT32:
        return reader.sint32();
      case ScalarType.SINT64:
        return reflectionLongConvert(reader.sint64(), longType);
    }
  }
};

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-binary-writer.js
var ReflectionBinaryWriter = class {
  constructor(info) {
    this.info = info;
  }
  prepare() {
    if (!this.fields) {
      const fieldsInput = this.info.fields ? this.info.fields.concat() : [];
      this.fields = fieldsInput.sort((a, b) => a.no - b.no);
    }
  }
  /**
   * Writes the message to binary format.
   */
  write(message, writer, options) {
    this.prepare();
    for (const field of this.fields) {
      let value, emitDefault, repeated = field.repeat, localName = field.localName;
      if (field.oneof) {
        const group = message[field.oneof];
        if (group.oneofKind !== localName)
          continue;
        value = group[localName];
        emitDefault = true;
      } else {
        value = message[localName];
        emitDefault = false;
      }
      switch (field.kind) {
        case "scalar":
        case "enum":
          let T = field.kind == "enum" ? ScalarType.INT32 : field.T;
          if (repeated) {
            assert(Array.isArray(value));
            if (repeated == RepeatType.PACKED)
              this.packed(writer, T, field.no, value);
            else
              for (const item of value)
                this.scalar(writer, T, field.no, item, true);
          } else if (value === void 0)
            assert(field.opt);
          else
            this.scalar(writer, T, field.no, value, emitDefault || field.opt);
          break;
        case "message":
          if (repeated) {
            assert(Array.isArray(value));
            for (const item of value)
              this.message(writer, options, field.T(), field.no, item);
          } else {
            this.message(writer, options, field.T(), field.no, value);
          }
          break;
        case "map":
          assert(typeof value == "object" && value !== null);
          for (const [key, val] of Object.entries(value))
            this.mapEntry(writer, options, field, key, val);
          break;
      }
    }
    let u = options.writeUnknownFields;
    if (u !== false)
      (u === true ? UnknownFieldHandler.onWrite : u)(this.info.typeName, message, writer);
  }
  mapEntry(writer, options, field, key, value) {
    writer.tag(field.no, WireType.LengthDelimited);
    writer.fork();
    let keyValue = key;
    switch (field.K) {
      case ScalarType.INT32:
      case ScalarType.FIXED32:
      case ScalarType.UINT32:
      case ScalarType.SFIXED32:
      case ScalarType.SINT32:
        keyValue = Number.parseInt(key);
        break;
      case ScalarType.BOOL:
        assert(key == "true" || key == "false");
        keyValue = key == "true";
        break;
    }
    this.scalar(writer, field.K, 1, keyValue, true);
    switch (field.V.kind) {
      case "scalar":
        this.scalar(writer, field.V.T, 2, value, true);
        break;
      case "enum":
        this.scalar(writer, ScalarType.INT32, 2, value, true);
        break;
      case "message":
        this.message(writer, options, field.V.T(), 2, value);
        break;
    }
    writer.join();
  }
  message(writer, options, handler, fieldNo, value) {
    if (value === void 0)
      return;
    handler.internalBinaryWrite(value, writer.tag(fieldNo, WireType.LengthDelimited).fork(), options);
    writer.join();
  }
  /**
   * Write a single scalar value.
   */
  scalar(writer, type, fieldNo, value, emitDefault) {
    let [wireType, method, isDefault] = this.scalarInfo(type, value);
    if (!isDefault || emitDefault) {
      writer.tag(fieldNo, wireType);
      writer[method](value);
    }
  }
  /**
   * Write an array of scalar values in packed format.
   */
  packed(writer, type, fieldNo, value) {
    if (!value.length)
      return;
    assert(type !== ScalarType.BYTES && type !== ScalarType.STRING);
    writer.tag(fieldNo, WireType.LengthDelimited);
    writer.fork();
    let [, method] = this.scalarInfo(type);
    for (let i = 0; i < value.length; i++)
      writer[method](value[i]);
    writer.join();
  }
  /**
   * Get information for writing a scalar value.
   *
   * Returns tuple:
   * [0]: appropriate WireType
   * [1]: name of the appropriate method of IBinaryWriter
   * [2]: whether the given value is a default value
   *
   * If argument `value` is omitted, [2] is always false.
   */
  scalarInfo(type, value) {
    let t = WireType.Varint;
    let m;
    let i = value === void 0;
    let d = value === 0;
    switch (type) {
      case ScalarType.INT32:
        m = "int32";
        break;
      case ScalarType.STRING:
        d = i || !value.length;
        t = WireType.LengthDelimited;
        m = "string";
        break;
      case ScalarType.BOOL:
        d = value === false;
        m = "bool";
        break;
      case ScalarType.UINT32:
        m = "uint32";
        break;
      case ScalarType.DOUBLE:
        t = WireType.Bit64;
        m = "double";
        break;
      case ScalarType.FLOAT:
        t = WireType.Bit32;
        m = "float";
        break;
      case ScalarType.INT64:
        d = i || PbLong.from(value).isZero();
        m = "int64";
        break;
      case ScalarType.UINT64:
        d = i || PbULong.from(value).isZero();
        m = "uint64";
        break;
      case ScalarType.FIXED64:
        d = i || PbULong.from(value).isZero();
        t = WireType.Bit64;
        m = "fixed64";
        break;
      case ScalarType.BYTES:
        d = i || !value.byteLength;
        t = WireType.LengthDelimited;
        m = "bytes";
        break;
      case ScalarType.FIXED32:
        t = WireType.Bit32;
        m = "fixed32";
        break;
      case ScalarType.SFIXED32:
        t = WireType.Bit32;
        m = "sfixed32";
        break;
      case ScalarType.SFIXED64:
        d = i || PbLong.from(value).isZero();
        t = WireType.Bit64;
        m = "sfixed64";
        break;
      case ScalarType.SINT32:
        m = "sint32";
        break;
      case ScalarType.SINT64:
        d = i || PbLong.from(value).isZero();
        m = "sint64";
        break;
    }
    return [t, m, i || d];
  }
};

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-create.js
function reflectionCreate(type) {
  const msg = type.messagePrototype ? Object.create(type.messagePrototype) : Object.defineProperty({}, MESSAGE_TYPE, { value: type });
  for (let field of type.fields) {
    let name = field.localName;
    if (field.opt)
      continue;
    if (field.oneof)
      msg[field.oneof] = { oneofKind: void 0 };
    else if (field.repeat)
      msg[name] = [];
    else
      switch (field.kind) {
        case "scalar":
          msg[name] = reflectionScalarDefault(field.T, field.L);
          break;
        case "enum":
          msg[name] = 0;
          break;
        case "map":
          msg[name] = {};
          break;
      }
  }
  return msg;
}

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-merge-partial.js
function reflectionMergePartial(info, target, source) {
  let fieldValue, input = source, output;
  for (let field of info.fields) {
    let name = field.localName;
    if (field.oneof) {
      const group = input[field.oneof];
      if ((group === null || group === void 0 ? void 0 : group.oneofKind) == void 0) {
        continue;
      }
      fieldValue = group[name];
      output = target[field.oneof];
      output.oneofKind = group.oneofKind;
      if (fieldValue == void 0) {
        delete output[name];
        continue;
      }
    } else {
      fieldValue = input[name];
      output = target;
      if (fieldValue == void 0) {
        continue;
      }
    }
    if (field.repeat)
      output[name].length = fieldValue.length;
    switch (field.kind) {
      case "scalar":
      case "enum":
        if (field.repeat)
          for (let i = 0; i < fieldValue.length; i++)
            output[name][i] = fieldValue[i];
        else
          output[name] = fieldValue;
        break;
      case "message":
        let T = field.T();
        if (field.repeat)
          for (let i = 0; i < fieldValue.length; i++)
            output[name][i] = T.create(fieldValue[i]);
        else if (output[name] === void 0)
          output[name] = T.create(fieldValue);
        else
          T.mergePartial(output[name], fieldValue);
        break;
      case "map":
        switch (field.V.kind) {
          case "scalar":
          case "enum":
            Object.assign(output[name], fieldValue);
            break;
          case "message":
            let T2 = field.V.T();
            for (let k of Object.keys(fieldValue))
              output[name][k] = T2.create(fieldValue[k]);
            break;
        }
        break;
    }
  }
}

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-equals.js
function reflectionEquals(info, a, b) {
  if (a === b)
    return true;
  if (!a || !b)
    return false;
  for (let field of info.fields) {
    let localName = field.localName;
    let val_a = field.oneof ? a[field.oneof][localName] : a[localName];
    let val_b = field.oneof ? b[field.oneof][localName] : b[localName];
    switch (field.kind) {
      case "enum":
      case "scalar":
        let t = field.kind == "enum" ? ScalarType.INT32 : field.T;
        if (!(field.repeat ? repeatedPrimitiveEq(t, val_a, val_b) : primitiveEq(t, val_a, val_b)))
          return false;
        break;
      case "map":
        if (!(field.V.kind == "message" ? repeatedMsgEq(field.V.T(), objectValues(val_a), objectValues(val_b)) : repeatedPrimitiveEq(field.V.kind == "enum" ? ScalarType.INT32 : field.V.T, objectValues(val_a), objectValues(val_b))))
          return false;
        break;
      case "message":
        let T = field.T();
        if (!(field.repeat ? repeatedMsgEq(T, val_a, val_b) : T.equals(val_a, val_b)))
          return false;
        break;
    }
  }
  return true;
}
var objectValues = Object.values;
function primitiveEq(type, a, b) {
  if (a === b)
    return true;
  if (type !== ScalarType.BYTES)
    return false;
  let ba = a;
  let bb = b;
  if (ba.length !== bb.length)
    return false;
  for (let i = 0; i < ba.length; i++)
    if (ba[i] != bb[i])
      return false;
  return true;
}
function repeatedPrimitiveEq(type, a, b) {
  if (a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++)
    if (!primitiveEq(type, a[i], b[i]))
      return false;
  return true;
}
function repeatedMsgEq(type, a, b) {
  if (a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++)
    if (!type.equals(a[i], b[i]))
      return false;
  return true;
}

// node_modules/@protobuf-ts/runtime/build/es2015/message-type.js
var baseDescriptors = Object.getOwnPropertyDescriptors(Object.getPrototypeOf({}));
var messageTypeDescriptor = baseDescriptors[MESSAGE_TYPE] = {};
var MessageType = class {
  constructor(name, fields, options) {
    this.defaultCheckDepth = 16;
    this.typeName = name;
    this.fields = fields.map(normalizeFieldInfo);
    this.options = options !== null && options !== void 0 ? options : {};
    messageTypeDescriptor.value = this;
    this.messagePrototype = Object.create(null, baseDescriptors);
    this.refTypeCheck = new ReflectionTypeCheck(this);
    this.refJsonReader = new ReflectionJsonReader(this);
    this.refJsonWriter = new ReflectionJsonWriter(this);
    this.refBinReader = new ReflectionBinaryReader(this);
    this.refBinWriter = new ReflectionBinaryWriter(this);
  }
  create(value) {
    let message = reflectionCreate(this);
    if (value !== void 0) {
      reflectionMergePartial(this, message, value);
    }
    return message;
  }
  /**
   * Clone the message.
   *
   * Unknown fields are discarded.
   */
  clone(message) {
    let copy = this.create();
    reflectionMergePartial(this, copy, message);
    return copy;
  }
  /**
   * Determines whether two message of the same type have the same field values.
   * Checks for deep equality, traversing repeated fields, oneof groups, maps
   * and messages recursively.
   * Will also return true if both messages are `undefined`.
   */
  equals(a, b) {
    return reflectionEquals(this, a, b);
  }
  /**
   * Is the given value assignable to our message type
   * and contains no [excess properties](https://www.typescriptlang.org/docs/handbook/interfaces.html#excess-property-checks)?
   */
  is(arg, depth = this.defaultCheckDepth) {
    return this.refTypeCheck.is(arg, depth, false);
  }
  /**
   * Is the given value assignable to our message type,
   * regardless of [excess properties](https://www.typescriptlang.org/docs/handbook/interfaces.html#excess-property-checks)?
   */
  isAssignable(arg, depth = this.defaultCheckDepth) {
    return this.refTypeCheck.is(arg, depth, true);
  }
  /**
   * Copy partial data into the target message.
   */
  mergePartial(target, source) {
    reflectionMergePartial(this, target, source);
  }
  /**
   * Create a new message from binary format.
   */
  fromBinary(data, options) {
    let opt = binaryReadOptions(options);
    return this.internalBinaryRead(opt.readerFactory(data), data.byteLength, opt);
  }
  /**
   * Read a new message from a JSON value.
   */
  fromJson(json, options) {
    return this.internalJsonRead(json, jsonReadOptions(options));
  }
  /**
   * Read a new message from a JSON string.
   * This is equivalent to `T.fromJson(JSON.parse(json))`.
   */
  fromJsonString(json, options) {
    let value = JSON.parse(json);
    return this.fromJson(value, options);
  }
  /**
   * Write the message to canonical JSON value.
   */
  toJson(message, options) {
    return this.internalJsonWrite(message, jsonWriteOptions(options));
  }
  /**
   * Convert the message to canonical JSON string.
   * This is equivalent to `JSON.stringify(T.toJson(t))`
   */
  toJsonString(message, options) {
    var _a;
    let value = this.toJson(message, options);
    return JSON.stringify(value, null, (_a = options === null || options === void 0 ? void 0 : options.prettySpaces) !== null && _a !== void 0 ? _a : 0);
  }
  /**
   * Write the message to binary format.
   */
  toBinary(message, options) {
    let opt = binaryWriteOptions(options);
    return this.internalBinaryWrite(message, opt.writerFactory(), opt).finish();
  }
  /**
   * This is an internal method. If you just want to read a message from
   * JSON, use `fromJson()` or `fromJsonString()`.
   *
   * Reads JSON value and merges the fields into the target
   * according to protobuf rules. If the target is omitted,
   * a new instance is created first.
   */
  internalJsonRead(json, options, target) {
    if (json !== null && typeof json == "object" && !Array.isArray(json)) {
      let message = target !== null && target !== void 0 ? target : this.create();
      this.refJsonReader.read(json, message, options);
      return message;
    }
    throw new Error(`Unable to parse message ${this.typeName} from JSON ${typeofJsonValue(json)}.`);
  }
  /**
   * This is an internal method. If you just want to write a message
   * to JSON, use `toJson()` or `toJsonString().
   *
   * Writes JSON value and returns it.
   */
  internalJsonWrite(message, options) {
    return this.refJsonWriter.write(message, options);
  }
  /**
   * This is an internal method. If you just want to write a message
   * in binary format, use `toBinary()`.
   *
   * Serializes the message in binary format and appends it to the given
   * writer. Returns passed writer.
   */
  internalBinaryWrite(message, writer, options) {
    this.refBinWriter.write(message, writer, options);
    return writer;
  }
  /**
   * This is an internal method. If you just want to read a message from
   * binary data, use `fromBinary()`.
   *
   * Reads data from binary format and merges the fields into
   * the target according to protobuf rules. If the target is
   * omitted, a new instance is created first.
   */
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create();
    this.refBinReader.read(reader, message, options, length);
    return message;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingcommon-ue5.7/dist/esm/Messages/signalling_messages.js
var base_message$Type = class extends MessageType {
  constructor() {
    super("base_message", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var base_message = new base_message$Type();
var peerConnectionOptions$Type = class extends MessageType {
  constructor() {
    super("peerConnectionOptions", []);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var peerConnectionOptions = new peerConnectionOptions$Type();
var config$Type = class extends MessageType {
  constructor() {
    super("config", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      { no: 2, name: "peerConnectionOptions", kind: "message", T: () => peerConnectionOptions },
      {
        no: 3,
        name: "protocolVersion",
        kind: "scalar",
        opt: true,
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* peerConnectionOptions peerConnectionOptions */
        2:
          message.peerConnectionOptions = peerConnectionOptions.internalBinaryRead(reader, reader.uint32(), options, message.peerConnectionOptions);
          break;
        case /* optional string protocolVersion */
        3:
          message.protocolVersion = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.peerConnectionOptions)
      peerConnectionOptions.internalBinaryWrite(message.peerConnectionOptions, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    if (message.protocolVersion !== void 0)
      writer.tag(3, WireType.LengthDelimited).string(message.protocolVersion);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var config = new config$Type();
var identify$Type = class extends MessageType {
  constructor() {
    super("identify", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var identify = new identify$Type();
var endpointId$Type = class extends MessageType {
  constructor() {
    super("endpointId", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "id",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 3,
        name: "protocolVersion",
        kind: "scalar",
        opt: true,
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.id = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* string id */
        2:
          message.id = reader.string();
          break;
        case /* optional string protocolVersion */
        3:
          message.protocolVersion = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.id !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.id);
    if (message.protocolVersion !== void 0)
      writer.tag(3, WireType.LengthDelimited).string(message.protocolVersion);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var endpointId = new endpointId$Type();
var endpointIdConfirm$Type = class extends MessageType {
  constructor() {
    super("endpointIdConfirm", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "committedId",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.committedId = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* string committedId */
        2:
          message.committedId = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.committedId !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.committedId);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var endpointIdConfirm = new endpointIdConfirm$Type();
var streamerIdChanged$Type = class extends MessageType {
  constructor() {
    super("streamerIdChanged", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "newID",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.newID = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* string newID */
        2:
          message.newID = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.newID !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.newID);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var streamerIdChanged = new streamerIdChanged$Type();
var listStreamers$Type = class extends MessageType {
  constructor() {
    super("listStreamers", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var listStreamers = new listStreamers$Type();
var streamerList$Type = class extends MessageType {
  constructor() {
    super("streamerList", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "ids",
        kind: "scalar",
        repeat: 2,
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.ids = [];
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* repeated string ids */
        2:
          message.ids.push(reader.string());
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    for (let i = 0; i < message.ids.length; i++)
      writer.tag(2, WireType.LengthDelimited).string(message.ids[i]);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var streamerList = new streamerList$Type();
var subscribe$Type = class extends MessageType {
  constructor() {
    super("subscribe", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "streamerId",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.streamerId = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* string streamerId */
        2:
          message.streamerId = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.streamerId !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.streamerId);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var subscribe = new subscribe$Type();
var unsubscribe$Type = class extends MessageType {
  constructor() {
    super("unsubscribe", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var unsubscribe = new unsubscribe$Type();
var subscribeFailed$Type = class extends MessageType {
  constructor() {
    super("subscribeFailed", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "message",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.message = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* string message */
        2:
          message.message = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.message !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.message);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var subscribeFailed = new subscribeFailed$Type();
var playerConnected$Type = class extends MessageType {
  constructor() {
    super("playerConnected", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "dataChannel",
        kind: "scalar",
        T: 8
        /*ScalarType.BOOL*/
      },
      {
        no: 3,
        name: "sfu",
        kind: "scalar",
        T: 8
        /*ScalarType.BOOL*/
      },
      {
        no: 5,
        name: "playerId",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.dataChannel = false;
    message.sfu = false;
    message.playerId = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* bool dataChannel */
        2:
          message.dataChannel = reader.bool();
          break;
        case /* bool sfu */
        3:
          message.sfu = reader.bool();
          break;
        case /* string playerId */
        5:
          message.playerId = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.dataChannel !== false)
      writer.tag(2, WireType.Varint).bool(message.dataChannel);
    if (message.sfu !== false)
      writer.tag(3, WireType.Varint).bool(message.sfu);
    if (message.playerId !== "")
      writer.tag(5, WireType.LengthDelimited).string(message.playerId);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var playerConnected = new playerConnected$Type();
var playerDisconnected$Type = class extends MessageType {
  constructor() {
    super("playerDisconnected", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "playerId",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.playerId = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* string playerId */
        2:
          message.playerId = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.playerId !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.playerId);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var playerDisconnected = new playerDisconnected$Type();
var offer$Type = class extends MessageType {
  constructor() {
    super("offer", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "sdp",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 3,
        name: "playerId",
        kind: "scalar",
        opt: true,
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 4,
        name: "sfu",
        kind: "scalar",
        opt: true,
        T: 8
        /*ScalarType.BOOL*/
      },
      {
        no: 5,
        name: "multiplex",
        kind: "scalar",
        opt: true,
        T: 8
        /*ScalarType.BOOL*/
      },
      {
        no: 6,
        name: "scalabilityMode",
        kind: "scalar",
        opt: true,
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.sdp = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* string sdp */
        2:
          message.sdp = reader.string();
          break;
        case /* optional string playerId */
        3:
          message.playerId = reader.string();
          break;
        case /* optional bool sfu */
        4:
          message.sfu = reader.bool();
          break;
        case /* optional bool multiplex */
        5:
          message.multiplex = reader.bool();
          break;
        case /* optional string scalabilityMode */
        6:
          message.scalabilityMode = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.sdp !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.sdp);
    if (message.playerId !== void 0)
      writer.tag(3, WireType.LengthDelimited).string(message.playerId);
    if (message.sfu !== void 0)
      writer.tag(4, WireType.Varint).bool(message.sfu);
    if (message.multiplex !== void 0)
      writer.tag(5, WireType.Varint).bool(message.multiplex);
    if (message.scalabilityMode !== void 0)
      writer.tag(6, WireType.LengthDelimited).string(message.scalabilityMode);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var offer = new offer$Type();
var answer$Type = class extends MessageType {
  constructor() {
    super("answer", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "sdp",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 3,
        name: "playerId",
        kind: "scalar",
        opt: true,
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 4,
        name: "minBitrateBps",
        kind: "scalar",
        opt: true,
        T: 5
        /*ScalarType.INT32*/
      },
      {
        no: 5,
        name: "maxBitrateBps",
        kind: "scalar",
        opt: true,
        T: 5
        /*ScalarType.INT32*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.sdp = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* string sdp */
        2:
          message.sdp = reader.string();
          break;
        case /* optional string playerId */
        3:
          message.playerId = reader.string();
          break;
        case /* optional int32 minBitrateBps */
        4:
          message.minBitrateBps = reader.int32();
          break;
        case /* optional int32 maxBitrateBps */
        5:
          message.maxBitrateBps = reader.int32();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.sdp !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.sdp);
    if (message.playerId !== void 0)
      writer.tag(3, WireType.LengthDelimited).string(message.playerId);
    if (message.minBitrateBps !== void 0)
      writer.tag(4, WireType.Varint).int32(message.minBitrateBps);
    if (message.maxBitrateBps !== void 0)
      writer.tag(5, WireType.Varint).int32(message.maxBitrateBps);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var answer = new answer$Type();
var iceCandidateData$Type = class extends MessageType {
  constructor() {
    super("iceCandidateData", [
      {
        no: 1,
        name: "candidate",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "sdpMid",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 3,
        name: "sdpMLineIndex",
        kind: "scalar",
        T: 5
        /*ScalarType.INT32*/
      },
      {
        no: 4,
        name: "usernameFragment",
        kind: "scalar",
        opt: true,
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.candidate = "";
    message.sdpMid = "";
    message.sdpMLineIndex = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string candidate */
        1:
          message.candidate = reader.string();
          break;
        case /* string sdpMid */
        2:
          message.sdpMid = reader.string();
          break;
        case /* int32 sdpMLineIndex */
        3:
          message.sdpMLineIndex = reader.int32();
          break;
        case /* optional string usernameFragment */
        4:
          message.usernameFragment = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.candidate !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.candidate);
    if (message.sdpMid !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.sdpMid);
    if (message.sdpMLineIndex !== 0)
      writer.tag(3, WireType.Varint).int32(message.sdpMLineIndex);
    if (message.usernameFragment !== void 0)
      writer.tag(4, WireType.LengthDelimited).string(message.usernameFragment);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var iceCandidateData = new iceCandidateData$Type();
var iceCandidate$Type = class extends MessageType {
  constructor() {
    super("iceCandidate", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      { no: 2, name: "candidate", kind: "message", T: () => iceCandidateData },
      {
        no: 3,
        name: "playerId",
        kind: "scalar",
        opt: true,
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* iceCandidateData candidate */
        2:
          message.candidate = iceCandidateData.internalBinaryRead(reader, reader.uint32(), options, message.candidate);
          break;
        case /* optional string playerId */
        3:
          message.playerId = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.candidate)
      iceCandidateData.internalBinaryWrite(message.candidate, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    if (message.playerId !== void 0)
      writer.tag(3, WireType.LengthDelimited).string(message.playerId);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var iceCandidate = new iceCandidate$Type();
var disconnectPlayer$Type = class extends MessageType {
  constructor() {
    super("disconnectPlayer", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "playerId",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 3,
        name: "reason",
        kind: "scalar",
        opt: true,
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.playerId = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* string playerId */
        2:
          message.playerId = reader.string();
          break;
        case /* optional string reason */
        3:
          message.reason = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.playerId !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.playerId);
    if (message.reason !== void 0)
      writer.tag(3, WireType.LengthDelimited).string(message.reason);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var disconnectPlayer = new disconnectPlayer$Type();
var ping$Type = class extends MessageType {
  constructor() {
    super("ping", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "time",
        kind: "scalar",
        T: 5
        /*ScalarType.INT32*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.time = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* int32 time */
        2:
          message.time = reader.int32();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.time !== 0)
      writer.tag(2, WireType.Varint).int32(message.time);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var ping = new ping$Type();
var pong$Type = class extends MessageType {
  constructor() {
    super("pong", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "time",
        kind: "scalar",
        T: 5
        /*ScalarType.INT32*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.time = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* int32 time */
        2:
          message.time = reader.int32();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.time !== 0)
      writer.tag(2, WireType.Varint).int32(message.time);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var pong = new pong$Type();
var streamerDisconnected$Type = class extends MessageType {
  constructor() {
    super("streamerDisconnected", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var streamerDisconnected = new streamerDisconnected$Type();
var layerPreference$Type = class extends MessageType {
  constructor() {
    super("layerPreference", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "spatialLayer",
        kind: "scalar",
        T: 5
        /*ScalarType.INT32*/
      },
      {
        no: 3,
        name: "temporalLayer",
        kind: "scalar",
        T: 5
        /*ScalarType.INT32*/
      },
      {
        no: 4,
        name: "playerId",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.spatialLayer = 0;
    message.temporalLayer = 0;
    message.playerId = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* int32 spatialLayer */
        2:
          message.spatialLayer = reader.int32();
          break;
        case /* int32 temporalLayer */
        3:
          message.temporalLayer = reader.int32();
          break;
        case /* string playerId */
        4:
          message.playerId = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.spatialLayer !== 0)
      writer.tag(2, WireType.Varint).int32(message.spatialLayer);
    if (message.temporalLayer !== 0)
      writer.tag(3, WireType.Varint).int32(message.temporalLayer);
    if (message.playerId !== "")
      writer.tag(4, WireType.LengthDelimited).string(message.playerId);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var layerPreference = new layerPreference$Type();
var dataChannelRequest$Type = class extends MessageType {
  constructor() {
    super("dataChannelRequest", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var dataChannelRequest = new dataChannelRequest$Type();
var peerDataChannels$Type = class extends MessageType {
  constructor() {
    super("peerDataChannels", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "playerId",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 3,
        name: "sendStreamId",
        kind: "scalar",
        T: 5
        /*ScalarType.INT32*/
      },
      {
        no: 4,
        name: "recvStreamId",
        kind: "scalar",
        T: 5
        /*ScalarType.INT32*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.playerId = "";
    message.sendStreamId = 0;
    message.recvStreamId = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* string playerId */
        2:
          message.playerId = reader.string();
          break;
        case /* int32 sendStreamId */
        3:
          message.sendStreamId = reader.int32();
          break;
        case /* int32 recvStreamId */
        4:
          message.recvStreamId = reader.int32();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.playerId !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.playerId);
    if (message.sendStreamId !== 0)
      writer.tag(3, WireType.Varint).int32(message.sendStreamId);
    if (message.recvStreamId !== 0)
      writer.tag(4, WireType.Varint).int32(message.recvStreamId);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var peerDataChannels = new peerDataChannels$Type();
var peerDataChannelsReady$Type = class extends MessageType {
  constructor() {
    super("peerDataChannelsReady", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var peerDataChannelsReady = new peerDataChannelsReady$Type();
var streamerDataChannels$Type = class extends MessageType {
  constructor() {
    super("streamerDataChannels", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "sfuId",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 3,
        name: "sendStreamId",
        kind: "scalar",
        T: 5
        /*ScalarType.INT32*/
      },
      {
        no: 4,
        name: "recvStreamId",
        kind: "scalar",
        T: 5
        /*ScalarType.INT32*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.sfuId = "";
    message.sendStreamId = 0;
    message.recvStreamId = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* string sfuId */
        2:
          message.sfuId = reader.string();
          break;
        case /* int32 sendStreamId */
        3:
          message.sendStreamId = reader.int32();
          break;
        case /* int32 recvStreamId */
        4:
          message.recvStreamId = reader.int32();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.sfuId !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.sfuId);
    if (message.sendStreamId !== 0)
      writer.tag(3, WireType.Varint).int32(message.sendStreamId);
    if (message.recvStreamId !== 0)
      writer.tag(4, WireType.Varint).int32(message.recvStreamId);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var streamerDataChannels = new streamerDataChannels$Type();
var startStreaming$Type = class extends MessageType {
  constructor() {
    super("startStreaming", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var startStreaming = new startStreaming$Type();
var stopStreaming$Type = class extends MessageType {
  constructor() {
    super("stopStreaming", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var stopStreaming = new stopStreaming$Type();
var playerCount$Type = class extends MessageType {
  constructor() {
    super("playerCount", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "count",
        kind: "scalar",
        T: 5
        /*ScalarType.INT32*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.count = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* int32 count */
        2:
          message.count = reader.int32();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.count !== 0)
      writer.tag(2, WireType.Varint).int32(message.count);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var playerCount = new playerCount$Type();
var stats$Type = class extends MessageType {
  constructor() {
    super("stats", [
      {
        no: 1,
        name: "type",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "data",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.type = "";
    message.data = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type */
        1:
          message.type = reader.string();
          break;
        case /* string data */
        2:
          message.data = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.type !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.type);
    if (message.data !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.data);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var stats = new stats$Type();

// node_modules/@epicgames-ps/lib-pixelstreamingcommon-ue5.7/dist/esm/Messages/message_registry.js
var MessageRegistry = {
  answer,
  config,
  disconnectPlayer,
  endpointId,
  endpointIdConfirm,
  iceCandidate,
  identify,
  listStreamers,
  offer,
  ping,
  playerConnected,
  playerCount,
  playerDisconnected,
  pong,
  stats,
  streamerDisconnected,
  streamerList,
  subscribe,
  unsubscribe,
  layerPreference,
  dataChannelRequest,
  peerDataChannels,
  peerDataChannelsReady,
  streamerDataChannels,
  startStreaming,
  stopStreaming
};

// node_modules/@epicgames-ps/lib-pixelstreamingcommon-ue5.7/dist/esm/Messages/message_helpers.js
var message_helpers_exports = {};
__export(message_helpers_exports, {
  createMessage: () => createMessage,
  validateMessage: () => validateMessage
});
function createMessage(messageType, params) {
  const message = messageType.create();
  message.type = messageType.typeName;
  if (params) {
    messageType.mergePartial(message, params);
  }
  return message;
}
function validateMessage(msg) {
  var _a;
  let valid = true;
  if (!msg.type) {
    Logger.Error(`Parsed message has no type. Rejected. ${JSON.stringify(msg)}`);
    return null;
  }
  const messageType = MessageRegistry[msg.type];
  if (!messageType) {
    Logger.Error(`Message is of an unknown type: "${msg.type}". Rejected.`);
    return null;
  }
  if (messageType.fields) {
    for (const field of messageType.fields) {
      if (!field.opt) {
        if (!Object.prototype.hasOwnProperty.call(msg, field.name)) {
          Logger.Error(`Message "${msg.type}" is missing required field "${field.name}". Rejected.`);
          valid = false;
        }
      }
    }
  }
  for (const fieldName in msg) {
    const found = (_a = messageType.fields) === null || _a === void 0 ? void 0 : _a.find((field) => field.name === fieldName);
    if (!found) {
      Logger.Error(`Message "${msg.type}" contains unknown field "${fieldName}". Rejected.`);
      valid = false;
    }
  }
  return valid ? messageType : null;
}

// node_modules/@epicgames-ps/lib-pixelstreamingcommon-ue5.7/dist/esm/Protocol/KeepaliveMonitor.js
var KeepaliveMonitor = class {
  /**
   * Gets the Round Trip Time of the current connection in milliseconds.
   */
  get RTT() {
    return this.rtt;
  }
  /**
   * Creates a new monitor and starts the ping timer. If a pong does not come back by the time we want
   * to send a second ping then the connection is considered dead and the onTimeout callback is fired.
   * @param protocol - The connection that we want to monitor.
   * @param timeout - The time in milliseconds between ping messages.
   */
  constructor(protocol, timeout) {
    this.alive = false;
    this.rtt = 0;
    this.protocol = protocol;
    this.timeout = timeout;
    this.onResponse = this.onHeartbeatResponse.bind(this);
    this.protocol.transport.on("close", this.stop.bind(this));
    this.start();
  }
  start() {
    this.alive = true;
    this.protocol.on("pong", this.onResponse);
    this.keepalive = setInterval(this.sendHeartbeat.bind(this), this.timeout);
  }
  stop() {
    clearInterval(this.keepalive);
    this.protocol.off("pong", this.onResponse);
  }
  sendHeartbeat() {
    var _a;
    if (this.alive === false) {
      (_a = this.onTimeout) === null || _a === void 0 ? void 0 : _a.call(this);
      return;
    }
    this.alive = false;
    this.protocol.sendMessage(createMessage(ping, { time: (/* @__PURE__ */ new Date()).getTime() }));
  }
  onHeartbeatResponse(pongMsg) {
    this.rtt = (/* @__PURE__ */ new Date()).getTime() - pongMsg.time;
    this.alive = true;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingcommon-ue5.7/dist/esm/Util/SdpUtils.js
var SDPUtils = class {
  static addVideoHeaderExtensionToSdp(sdp, uri) {
    const usedIds = sdp.split("\n").filter((line) => line.startsWith("a=extmap:")).map((line) => parseInt(line.split(" ")[0].substring(9), 10)).sort((a, b) => a - b).filter((item, index, array) => array.indexOf(item) === index);
    const nextId = usedIds[usedIds.length - 1] + 1;
    const extmapLine = "a=extmap:" + nextId + " " + uri + "\r\n";
    const sections = sdp.split("\nm=").map((part, index) => {
      return (index > 0 ? "m=" + part : part).trim() + "\r\n";
    });
    const sessionPart = sections.shift();
    return sessionPart + sections.map((mediaSection) => mediaSection.startsWith("m=video") ? mediaSection + extmapLine : mediaSection).join("");
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/VideoPlayer/StreamController.js
var StreamController = class {
  /**
   * @param videoElementProvider Video Player instance
   */
  constructor(videoElementProvider) {
    this.videoElementProvider = videoElementProvider;
    this.audioElement = document.createElement("Audio");
    this.videoElementProvider.setAudioElement(this.audioElement);
  }
  /**
   * Handles when the Peer connection has a track event
   * @param rtcTrackEvent - RTC Track Event
   */
  handleOnTrack(rtcTrackEvent) {
    Logger.Info("handleOnTrack " + JSON.stringify(rtcTrackEvent.streams));
    if (rtcTrackEvent.streams.length < 1 || rtcTrackEvent.streams[0].id == "probator") {
      return;
    }
    const videoElement = this.videoElementProvider.getVideoElement();
    if (rtcTrackEvent.track) {
      Logger.Info("Got track - " + rtcTrackEvent.track.kind + " id=" + rtcTrackEvent.track.id + " readyState=" + rtcTrackEvent.track.readyState);
    }
    if (rtcTrackEvent.track.kind == "audio") {
      this.CreateAudioTrack(rtcTrackEvent.streams[0]);
      return;
    } else if (rtcTrackEvent.track.kind == "video" && videoElement.srcObject !== rtcTrackEvent.streams[0]) {
      videoElement.srcObject = rtcTrackEvent.streams[0];
      Logger.Info("Set video source from video track ontrack.");
      return;
    }
  }
  /**
   * Creates the audio device when receiving an RTCTrackEvent with the kind of "audio"
   * @param audioMediaStream - Audio Media stream track
   */
  CreateAudioTrack(audioMediaStream) {
    const videoElement = this.videoElementProvider.getVideoElement();
    if (videoElement.srcObject == audioMediaStream) {
      return;
    } else if (videoElement.srcObject && videoElement.srcObject !== audioMediaStream) {
      this.audioElement.srcObject = audioMediaStream;
      Logger.Info("Created new audio element to play separate audio stream.");
    }
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/FreezeFrame/FreezeFrame.js
var FreezeFrame = class {
  /**
   * Construct a freeze frame
   * @param rootDiv the div that a freeze frame element will be injected into
   */
  constructor(rootDiv) {
    this.freezeFrameHeight = 0;
    this.freezeFrameWidth = 0;
    this.rootDiv = rootDiv;
    this.rootElement = document.createElement("div");
    this.rootElement.id = "freezeFrame";
    this.rootElement.style.display = "none";
    this.rootElement.style.pointerEvents = "none";
    this.rootElement.style.position = "absolute";
    this.rootElement.style.zIndex = "20";
    this.imageElement = document.createElement("img");
    this.imageElement.style.position = "absolute";
    this.rootElement.appendChild(this.imageElement);
    this.rootDiv.appendChild(this.rootElement);
  }
  /**
   * Set the freeze frame element for showing
   */
  setElementForShow() {
    this.rootElement.style.display = "block";
  }
  /**
   * Set the freeze frame element for hiding
   */
  setElementForHide() {
    this.rootElement.style.display = "none";
  }
  /**
   * Update the freeze frames image source
   * @param jpeg - the freeze frame image as a byte array data
   */
  updateImageElementSource(jpeg) {
    const base64 = btoa(jpeg.reduce((data, byte) => data + String.fromCharCode(byte), ""));
    this.imageElement.src = "data:image/jpeg;base64," + base64;
  }
  /**
   * Set the dimensions for the freeze frame from the element and resize it
   */
  setDimensionsFromElementAndResize() {
    this.freezeFrameHeight = this.imageElement.naturalHeight;
    this.freezeFrameWidth = this.imageElement.naturalWidth;
    this.resize();
  }
  /**
   * Resize a freeze frame element
   */
  resize() {
    if (this.freezeFrameWidth !== 0 && this.freezeFrameHeight !== 0) {
      let displayWidth = 0;
      let displayHeight = 0;
      let displayTop = 0;
      let displayLeft = 0;
      const parentAspectRatio = this.rootDiv.clientWidth / this.rootDiv.clientHeight;
      const videoAspectRatio = this.freezeFrameWidth / this.freezeFrameHeight;
      if (parentAspectRatio < videoAspectRatio) {
        displayWidth = this.rootDiv.clientWidth;
        displayHeight = Math.floor(this.rootDiv.clientWidth / videoAspectRatio);
        displayTop = Math.floor((this.rootDiv.clientHeight - displayHeight) * 0.5);
        displayLeft = 0;
      } else {
        displayWidth = Math.floor(this.rootDiv.clientHeight * videoAspectRatio);
        displayHeight = this.rootDiv.clientHeight;
        displayTop = 0;
        displayLeft = Math.floor((this.rootDiv.clientWidth - displayWidth) * 0.5);
      }
      this.rootElement.style.width = this.rootDiv.offsetWidth + "px";
      this.rootElement.style.height = this.rootDiv.offsetHeight + "px";
      this.rootElement.style.left = "0px";
      this.rootElement.style.top = "0px";
      this.imageElement.style.width = displayWidth + "px";
      this.imageElement.style.height = displayHeight + "px";
      this.imageElement.style.left = displayLeft + "px";
      this.imageElement.style.top = displayTop + "px";
    }
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/FreezeFrame/FreezeFrameController.js
var FreezeFrameController = class {
  /**
   * Construct a freeze frame controller
   * @param rootDiv - the div that a freeze frame element will be injected into
   */
  constructor(rootDiv) {
    this.receiving = false;
    this.size = 0;
    this.jpeg = void 0;
    this.valid = false;
    this.freezeFrameDelay = 50;
    this.freezeFrame = new FreezeFrame(rootDiv);
  }
  /**
   * Show the freeze frame if it is valid
   */
  showFreezeFrame() {
    if (this.valid) {
      this.freezeFrame.setElementForShow();
    }
  }
  /**
   * Hide the freeze frame and set the validity to false
   */
  hideFreezeFrame() {
    this.valid = false;
    this.freezeFrame.setElementForHide();
  }
  /**
   * Update the freeze frames image source and load it
   * @param jpeg - the freeze frame image as a byte array data
   * @param onLoadCallBack - a call back for managing if the play overlay needs to be shown or not
   */
  updateFreezeFrameAndShow(jpeg, onLoadCallBack) {
    this.freezeFrame.updateImageElementSource(jpeg);
    this.freezeFrame.imageElement.onload = () => {
      this.freezeFrame.setDimensionsFromElementAndResize();
      onLoadCallBack();
    };
  }
  /**
   * Process the new freeze frame image and update it
   * @param view - the freeze frame image as a byte array data
   * @param onLoadCallBack - a call back for managing if the play overlay needs to be shown or not
   */
  processFreezeFrameMessage(view, onLoadCallBack) {
    if (!this.receiving) {
      this.receiving = true;
      this.valid = false;
      this.size = 0;
      this.jpeg = void 0;
    }
    this.size = new DataView(view.slice(1, 5).buffer).getInt32(0, true);
    const jpegBytes = view.slice(1 + 4);
    if (this.jpeg) {
      const jpeg = new Uint8Array(this.jpeg.length + jpegBytes.length);
      jpeg.set(this.jpeg, 0);
      jpeg.set(jpegBytes, this.jpeg.length);
      this.jpeg = jpeg;
    } else {
      this.jpeg = jpegBytes;
      this.receiving = true;
      Logger.Info(`received first chunk of freeze frame: ${this.jpeg.length}/${this.size}`);
    }
    if (this.jpeg.length === this.size) {
      this.receiving = false;
      this.valid = true;
      Logger.Info(`received complete freeze frame ${this.size}`);
      this.updateFreezeFrameAndShow(this.jpeg, onLoadCallBack);
    } else if (this.jpeg.length > this.size) {
      Logger.Error(`received bigger freeze frame than advertised: ${this.jpeg.length}/${this.size}`);
      this.jpeg = void 0;
      this.receiving = false;
    }
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Config/SettingBase.js
var SettingBase = class {
  constructor(id, label, description, defaultSettingValue, defaultOnChangeListener = () => {
  }) {
    this.parseURLParams();
    this.onChange = defaultOnChangeListener;
    this.onChangeEmit = () => {
    };
    this.id = id;
    this.description = description;
    this.label = label;
    this.value = defaultSettingValue;
  }
  /**
   * Set the label text for the setting.
   * @param label setting label.
   */
  set label(inLabel) {
    this._label = inLabel;
    this.onChangeEmit(this._value);
  }
  /**
   * @returns The label text for the setting.
   */
  get label() {
    return this._label;
  }
  /**
   * @return The setting's value.
   */
  get value() {
    return this._value;
  }
  /**
   * Update the setting's stored value.
   * @param inValue The new value for the setting.
   */
  set value(inValue) {
    this._value = inValue;
    this.onChange(this._value, this);
    this.onChangeEmit(this._value);
  }
  /**
   * Persist the setting value in URL.
   */
  updateURLParams() {
    if (this.useUrlParams) {
      const urlParams = new URLSearchParams(window.location.search);
      const valueString = this.getValueAsString();
      let set = false;
      for (const [name, _value] of urlParams) {
        if (name.toLowerCase() == this.id.toLowerCase()) {
          urlParams.set(name, valueString);
          set = true;
          break;
        }
      }
      if (!set) {
        urlParams.set(this.id, valueString);
      }
      window.history.replaceState({}, "", urlParams.toString() !== "" ? `${location.pathname}?${urlParams}` : `${location.pathname}`);
    }
  }
  /**
   * Allows sub types to provide their value for the url search params.
   */
  getValueAsString() {
    return "";
  }
  parseURLParams() {
    this._urlParams = {};
    const params = new URLSearchParams(window.location.search);
    for (const [name, value] of params) {
      this._urlParams[name.toLowerCase()] = value;
    }
  }
  hasURLParam(name) {
    return name.toLowerCase() in this._urlParams;
  }
  getURLParam(name) {
    if (this.hasURLParam(name)) {
      return this._urlParams[name.toLowerCase()];
    }
    return "";
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Config/SettingFlag.js
var SettingFlag = class extends SettingBase {
  constructor(id, label, description, defaultFlagValue, useUrlParams, defaultOnChangeListener = () => {
  }) {
    super(id, label, description, defaultFlagValue, defaultOnChangeListener);
    if (!useUrlParams || !this.hasURLParam(this.id)) {
      this.flag = defaultFlagValue;
    } else {
      const urlParamFlag = this.getURLParam(this.id);
      this.flag = urlParamFlag.toLowerCase() != "false";
    }
    this.useUrlParams = useUrlParams;
  }
  getValueAsString() {
    return this.flag ? "true" : "false";
  }
  /**
   * Enables this flag.
   */
  enable() {
    this.flag = true;
  }
  /**
   * @return The setting's value.
   */
  get flag() {
    return !!this.value;
  }
  /**
   * Update the setting's stored value.
   * @param inValue The new value for the setting.
   */
  set flag(inValue) {
    this.value = inValue;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Config/SettingNumber.js
var SettingNumber = class extends SettingBase {
  constructor(id, label, description, min, max, defaultNumber, useUrlParams, defaultOnChangeListener = () => {
  }) {
    super(id, label, description, defaultNumber, defaultOnChangeListener);
    this._min = min;
    this._max = max;
    if (!useUrlParams || !this.hasURLParam(this.id)) {
      this.number = defaultNumber;
    } else {
      const parsedValue = Number.parseFloat(this.getURLParam(this.id));
      this.number = Number.isNaN(parsedValue) ? defaultNumber : parsedValue;
    }
    this.useUrlParams = useUrlParams;
  }
  getValueAsString() {
    return this.number.toString();
  }
  /**
   * Set the number value (will be clamped within range).
   */
  set number(newNumber) {
    this.value = this.clamp(newNumber);
  }
  /**
   * @returns The number stored.
   */
  get number() {
    return this.value;
  }
  /**
   * Clamps a number between the min and max values (inclusive).
   * @param inNumber The number to clamp.
   * @returns The clamped number.
   */
  clamp(inNumber) {
    if (this._min == null && this._max == null) {
      return inNumber;
    } else if (this._min == null) {
      return Math.min(this._max, inNumber);
    } else if (this._max == null) {
      return Math.max(this._min, inNumber);
    } else {
      return Math.max(Math.min(this._max, inNumber), this._min);
    }
  }
  /**
   * Returns the minimum value
   * @returns The minimum value
   */
  get min() {
    return this._min;
  }
  /**
   * Returns the maximum value
   * @returns The maximum value
   */
  get max() {
    return this._max;
  }
  /**
   * Add a change listener to the number object.
   */
  addOnChangedListener(onChangedFunc) {
    this.onChange = onChangedFunc;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Config/SettingText.js
var SettingText = class extends SettingBase {
  constructor(id, label, description, defaultTextValue, useUrlParams, defaultOnChangeListener = () => {
  }) {
    super(id, label, description, defaultTextValue, defaultOnChangeListener);
    if (!useUrlParams || !this.hasURLParam(this.id)) {
      this.text = defaultTextValue;
    } else {
      this.text = this.getURLParam(this.id);
    }
    this.useUrlParams = useUrlParams;
  }
  getValueAsString() {
    return this.text;
  }
  /**
   * @return The setting's value.
   */
  get text() {
    return this.value;
  }
  /**
   * Update the setting's stored value.
   * @param inValue The new value for the setting.
   */
  set text(inValue) {
    this.value = inValue;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Config/SettingOption.js
var SettingOption = class extends SettingBase {
  constructor(id, label, description, defaultTextValue, options, useUrlParams, defaultUrlParamResolver = function(value) {
    return value;
  }, defaultOnChangeListener = () => {
  }) {
    super(id, label, description, defaultTextValue, defaultOnChangeListener);
    this._urlParamResolver = defaultUrlParamResolver;
    const stringToMatch = this.hasURLParam(this.id) ? this._urlParamResolver(this.getURLParam(this.id)) : defaultTextValue;
    this.options = options !== null && options !== void 0 ? options : [stringToMatch];
    this.selected = stringToMatch;
    this.useUrlParams = useUrlParams;
  }
  getValueAsString() {
    return this.selected;
  }
  /**
   * Add a change listener to the select element.
   */
  addOnChangedListener(onChangedFunc) {
    this.onChange = onChangedFunc;
  }
  /**
   * @returns All available options as an array
   */
  get options() {
    return this._options;
  }
  /**
   * Set options
   * @param values Array of options
   */
  set options(values) {
    this._options = values;
    this.onChangeEmit(this.selected);
  }
  /**
   * @returns Selected option as a string
   */
  get selected() {
    return this.value;
  }
  /**
   * Set selected option if it matches one of the available options
   * @param value Selected option
   */
  set selected(value) {
    if (value === void 0) {
      return;
    }
    if (this.options.includes(value)) {
      this.value = value;
    } else {
      Logger.Error(`Could not set "${value}" as the selected option for ${this.id} because it wasn't one of the options.`);
    }
  }
  /**
   * Set the url parameter resolver to do some transformation to the string value
   * that is extracted from the url parameters.
   * @param urlParam A function that transforms the extracted url parameter string for this setting to something else.
   */
  set urlParamResolver(value) {
    this._urlParamResolver = value;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Util/EventEmitter.js
var AfkWarningActivateEvent = class extends Event {
  constructor(data) {
    super("afkWarningActivate");
    this.data = data;
  }
};
var AfkWarningUpdateEvent = class extends Event {
  constructor(data) {
    super("afkWarningUpdate");
    this.data = data;
  }
};
var AfkWarningDeactivateEvent = class extends Event {
  constructor() {
    super("afkWarningDeactivate");
  }
};
var AfkTimedOutEvent = class extends Event {
  constructor() {
    super("afkTimedOut");
  }
};
var VideoEncoderAvgQPEvent = class extends Event {
  constructor(data) {
    super("videoEncoderAvgQP");
    this.data = data;
  }
};
var WebRtcSdpEvent = class extends Event {
  constructor() {
    super("webRtcSdp");
  }
};
var WebRtcSdpAnswerEvent = class extends Event {
  constructor(data) {
    super("webRtcSdpAnswer");
    this.data = data;
  }
};
var WebRtcSdpOfferEvent = class extends Event {
  constructor(data) {
    super("webRtcSdpOffer");
    this.data = data;
  }
};
var WebRtcAutoConnectEvent = class extends Event {
  constructor() {
    super("webRtcAutoConnect");
  }
};
var WebRtcConnectingEvent = class extends Event {
  constructor() {
    super("webRtcConnecting");
  }
};
var WebRtcConnectedEvent = class extends Event {
  constructor() {
    super("webRtcConnected");
  }
};
var WebRtcFailedEvent = class extends Event {
  constructor() {
    super("webRtcFailed");
  }
};
var WebRtcDisconnectedEvent = class extends Event {
  constructor(data) {
    super("webRtcDisconnected");
    this.data = data;
  }
};
var DataChannelOpenEvent = class extends Event {
  constructor(data) {
    super("dataChannelOpen");
    this.data = data;
  }
};
var DataChannelCloseEvent = class extends Event {
  constructor(data) {
    super("dataChannelClose");
    this.data = data;
  }
};
var DataChannelErrorEvent = class extends Event {
  constructor(data) {
    super("dataChannelError");
    this.data = data;
  }
};
var VideoInitializedEvent = class extends Event {
  constructor() {
    super("videoInitialized");
  }
};
var StreamLoadingEvent = class extends Event {
  constructor() {
    super("streamLoading");
  }
};
var StreamPreConnectEvent = class extends Event {
  constructor() {
    super("streamConnect");
  }
};
var StreamPreDisconnectEvent = class extends Event {
  constructor() {
    super("streamDisconnect");
  }
};
var StreamReconnectEvent = class extends Event {
  constructor() {
    super("streamReconnect");
  }
};
var PlayStreamErrorEvent = class extends Event {
  constructor(data) {
    super("playStreamError");
    this.data = data;
  }
};
var PlayStreamEvent = class extends Event {
  constructor() {
    super("playStream");
  }
};
var PlayStreamRejectedEvent = class extends Event {
  constructor(data) {
    super("playStreamRejected");
    this.data = data;
  }
};
var LoadFreezeFrameEvent = class extends Event {
  constructor(data) {
    super("loadFreezeFrame");
    this.data = data;
  }
};
var HideFreezeFrameEvent = class extends Event {
  constructor() {
    super("hideFreezeFrame");
  }
};
var StatsReceivedEvent = class extends Event {
  constructor(data) {
    super("statsReceived");
    this.data = data;
  }
};
var StreamerListMessageEvent = class extends Event {
  constructor(data) {
    super("streamerListMessage");
    this.data = data;
  }
};
var StreamerIDChangedMessageEvent = class extends Event {
  constructor(data) {
    super("StreamerIDChangedMessage");
    this.data = data;
  }
};
var LatencyTestResultEvent = class extends Event {
  constructor(data) {
    super("latencyTestResult");
    this.data = data;
  }
};
var LatencyCalculatedEvent = class extends Event {
  constructor(data) {
    super("latencyCalculated");
    this.data = data;
  }
};
var ShowOnScreenKeyboardEvent = class extends Event {
  constructor(data) {
    super("showOnScreenKeyboard");
    this.data = data;
  }
};
var DataChannelLatencyTestResponseEvent = class extends Event {
  constructor(data) {
    super("dataChannelLatencyTestResponse");
    this.data = data;
  }
};
var DataChannelLatencyTestResultEvent = class extends Event {
  constructor(data) {
    super("dataChannelLatencyTestResult");
    this.data = data;
  }
};
var SubscribeFailedEvent = class extends Event {
  constructor(data) {
    super("subscribeFailed");
    this.data = data;
  }
};
var InitialSettingsEvent = class extends Event {
  constructor(data) {
    super("initialSettings");
    this.data = data;
  }
};
var SettingsChangedEvent = class extends Event {
  constructor(data) {
    super("settingsChanged");
    this.data = data;
  }
};
var XrFrameEvent = class extends Event {
  constructor(data) {
    super("xrFrame");
    this.data = data;
  }
};
var PlayerCountEvent = class extends Event {
  constructor(data) {
    super("playerCount");
    this.data = data;
  }
};
var WebRtcTCPRelayDetectedEvent = class extends Event {
  constructor() {
    super("webRtcTCPRelayDetected");
  }
};
var PixelStreamingEventEmitter = class extends EventTarget {
  /**
   * Dispatch a new event.
   * @param e event
   * @returns
   */
  dispatchEvent(e) {
    return super.dispatchEvent(e);
  }
  /**
   * Register an event handler.
   * @param type event name
   * @param listener event handler function
   */
  addEventListener(type, listener) {
    super.addEventListener(type, listener);
  }
  /**
   * Remove an event handler.
   * @param type event name
   * @param listener event handler function
   */
  removeEventListener(type, listener) {
    super.removeEventListener(type, listener);
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Util/BrowserUtils.js
var BrowserUtils = class {
  static getSupportedVideoCodecs() {
    const browserSupportedCodecs = [];
    if (!RTCRtpReceiver.getCapabilities) {
      Logger.Warning("RTCRtpReceiver.getCapabilities API is not available in your browser, defaulting to guess that we support H.264.");
      browserSupportedCodecs.push("H264 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f");
      return browserSupportedCodecs;
    }
    const matcher = /(VP\d|H26\d|AV1).*/;
    const capabilities = RTCRtpReceiver.getCapabilities("video");
    if (!capabilities) {
      browserSupportedCodecs.push("H264 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f");
      return browserSupportedCodecs;
    }
    capabilities.codecs.forEach((codec) => {
      const str = codec.mimeType.split("/")[1] + " " + (codec.sdpFmtpLine || "");
      const match = matcher.exec(str);
      if (match !== null) {
        browserSupportedCodecs.push(str);
      }
    });
    return browserSupportedCodecs;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Config/Config.js
var Flags = class {
};
Flags.AutoConnect = "AutoConnect";
Flags.AutoPlayVideo = "AutoPlayVideo";
Flags.AFKDetection = "TimeoutIfIdle";
Flags.HoveringMouseMode = "HoveringMouse";
Flags.ForceMonoAudio = "ForceMonoAudio";
Flags.ForceTURN = "ForceTURN";
Flags.FakeMouseWithTouches = "FakeMouseWithTouches";
Flags.IsQualityController = "ControlsQuality";
Flags.MatchViewportResolution = "MatchViewportRes";
Flags.StartVideoMuted = "StartVideoMuted";
Flags.SuppressBrowserKeys = "SuppressBrowserKeys";
Flags.UseMic = "UseMic";
Flags.UseModalForTextInput = "UseModalForTextInput";
Flags.UseCamera = "UseCamera";
Flags.KeyboardInput = "KeyboardInput";
Flags.MouseInput = "MouseInput";
Flags.TouchInput = "TouchInput";
Flags.GamepadInput = "GamepadInput";
Flags.XRControllerInput = "XRControllerInput";
Flags.WaitForStreamer = "WaitForStreamer";
Flags.HideUI = "HideUI";
Flags.EnableCaptureTimeExt = "EnableCaptureTimeExt";
Flags.BrowserSendOffer = "BrowserSendOffer";
Flags.LatencyCSV = "LatencyCSV";
var isFlagId = (id) => Object.getOwnPropertyNames(Flags).some((name) => Flags[name] === id);
var NumericParameters = class {
};
NumericParameters.AFKTimeoutSecs = "AFKTimeout";
NumericParameters.AFKCountdownSecs = "AFKCountdown";
NumericParameters.MinQP = "MinQP";
NumericParameters.MaxQP = "MaxQP";
NumericParameters.MinQuality = "MinQuality";
NumericParameters.MaxQuality = "MaxQuality";
NumericParameters.CompatQualityMin = "CompatQualityMin";
NumericParameters.CompatQualityMax = "CompatQualityMax";
NumericParameters.WebRTCFPS = "WebRTCFPS";
NumericParameters.WebRTCMinBitrate = "WebRTCMinBitrate";
NumericParameters.WebRTCMaxBitrate = "WebRTCMaxBitrate";
NumericParameters.MaxReconnectAttempts = "MaxReconnectAttempts";
NumericParameters.StreamerAutoJoinInterval = "StreamerAutoJoinInterval";
NumericParameters.KeepaliveDelay = "KeepaliveDelay";
var isNumericId = (id) => Object.getOwnPropertyNames(NumericParameters).some((name) => NumericParameters[name] === id);
var TextParameters = class {
};
TextParameters.SignallingServerUrl = "ss";
var isTextId = (id) => Object.getOwnPropertyNames(TextParameters).some((name) => TextParameters[name] === id);
var OptionParameters = class {
};
OptionParameters.PreferredCodec = "PreferredCodec";
OptionParameters.StreamerId = "StreamerId";
OptionParameters.PreferredQuality = "PreferredQuality";
var isOptionId = (id) => Object.getOwnPropertyNames(OptionParameters).some((name) => OptionParameters[name] === id);
var Config = class {
  // ------------ Settings -----------------
  constructor(config2 = {}) {
    this.flags = /* @__PURE__ */ new Map();
    this.numericParameters = /* @__PURE__ */ new Map();
    this.textParameters = /* @__PURE__ */ new Map();
    this.optionParameters = /* @__PURE__ */ new Map();
    const { initialSettings, useUrlParams, webSocketProtocols } = config2;
    this._useUrlParams = !!useUrlParams;
    this._webSocketProtocols = webSocketProtocols;
    this.populateDefaultSettings(this._useUrlParams, initialSettings);
  }
  /**
   * True if reading configuration initial values from URL parameters, and
   * persisting changes in URL when changed.
   */
  get useUrlParams() {
    return this._useUrlParams;
  }
  /**
   * Gets a protocol or list of protocols to pass to the websocket if set.
   */
  get webSocketProtocols() {
    return this._webSocketProtocols;
  }
  /**
   * Populate the default settings for a Pixel Streaming application
   */
  populateDefaultSettings(useUrlParams, settings) {
    this.textParameters.set(TextParameters.SignallingServerUrl, new SettingText(TextParameters.SignallingServerUrl, "Signalling url", "Url of the signalling server", settings && Object.prototype.hasOwnProperty.call(settings, TextParameters.SignallingServerUrl) ? settings[TextParameters.SignallingServerUrl] : (location.protocol === "https:" ? "wss://" : "ws://") + window.location.hostname + // for readability, we omit the port if it's 80
    (window.location.port === "80" || window.location.port === "" ? "" : `:${window.location.port}`), useUrlParams));
    this.optionParameters.set(OptionParameters.StreamerId, new SettingOption(OptionParameters.StreamerId, "Streamer ID", "The ID of the streamer to stream.", settings && Object.prototype.hasOwnProperty.call(settings, OptionParameters.StreamerId) ? settings[OptionParameters.StreamerId] : "", settings && Object.prototype.hasOwnProperty.call(settings, OptionParameters.StreamerId) ? [settings[OptionParameters.StreamerId]] : void 0, useUrlParams));
    const getDefaultVideoCodec = function() {
      const videoCodecs = BrowserUtils.getSupportedVideoCodecs();
      if (videoCodecs.length == 1) {
        return videoCodecs[0];
      } else if (videoCodecs.length > 0) {
        const defaultCodec = videoCodecs[0];
        for (const codec of videoCodecs) {
          if (codec.startsWith("H264")) {
            return codec;
          }
        }
        return defaultCodec;
      }
      Logger.Error("Could not find any reasonable video codec to assign as a default.");
      return "";
    };
    const matchSpecifiedCodecToClosestSupported = function(specifiedCodec) {
      const browserSupportedCodecs = BrowserUtils.getSupportedVideoCodecs();
      if (browserSupportedCodecs.includes(specifiedCodec)) {
        return specifiedCodec;
      }
      for (const browserCodec of browserSupportedCodecs) {
        if (browserCodec.startsWith(specifiedCodec)) {
          return browserCodec;
        }
      }
      return specifiedCodec;
    };
    this.optionParameters.set(OptionParameters.PreferredCodec, new SettingOption(OptionParameters.PreferredCodec, "Preferred Codec", "The preferred codec to be used during codec negotiation", settings && Object.prototype.hasOwnProperty.call(settings, OptionParameters.PreferredCodec) ? matchSpecifiedCodecToClosestSupported(settings[OptionParameters.PreferredCodec]) : getDefaultVideoCodec(), BrowserUtils.getSupportedVideoCodecs(), useUrlParams, matchSpecifiedCodecToClosestSupported));
    this.optionParameters.set(OptionParameters.PreferredQuality, new SettingOption(OptionParameters.PreferredQuality, "Preferred Quality", "The preferred quality of the stream (only applicable when using the SFU)", settings && Object.prototype.hasOwnProperty.call(settings, OptionParameters.PreferredQuality) ? settings[OptionParameters.PreferredQuality] : "Default", ["Default"], useUrlParams));
    this.flags.set(Flags.AutoConnect, new SettingFlag(Flags.AutoConnect, "Auto connect to stream", "Whether we should attempt to auto connect to the signalling server or show a click to start prompt.", settings && Object.prototype.hasOwnProperty.call(settings, Flags.AutoConnect) ? settings[Flags.AutoConnect] : false, useUrlParams));
    this.flags.set(Flags.AutoPlayVideo, new SettingFlag(Flags.AutoPlayVideo, "Auto play video", "When video is ready automatically start playing it as opposed to showing a play button.", settings && Object.prototype.hasOwnProperty.call(settings, Flags.AutoPlayVideo) ? settings[Flags.AutoPlayVideo] : true, useUrlParams));
    this.flags.set(Flags.UseMic, new SettingFlag(Flags.UseMic, "Use microphone", "Make browser request microphone access and open an input audio track.", settings && Object.prototype.hasOwnProperty.call(settings, Flags.UseMic) ? settings[Flags.UseMic] : false, useUrlParams));
    this.flags.set(Flags.UseModalForTextInput, new SettingFlag(Flags.UseModalForTextInput, "Use modal for text input", "When entering input into a streamed UE text widget, use an input modal.", settings && Object.prototype.hasOwnProperty.call(settings, Flags.UseModalForTextInput) ? settings[Flags.UseModalForTextInput] : true, useUrlParams));
    this.flags.set(Flags.UseCamera, new SettingFlag(Flags.UseCamera, "Use webcam", "Make browser request webcam access and open a input video track.", settings && Object.prototype.hasOwnProperty.call(settings, Flags.UseCamera) ? settings[Flags.UseCamera] : false, useUrlParams));
    this.flags.set(Flags.StartVideoMuted, new SettingFlag(Flags.StartVideoMuted, "Start video muted", "Video will start muted if true.", settings && Object.prototype.hasOwnProperty.call(settings, Flags.StartVideoMuted) ? settings[Flags.StartVideoMuted] : false, useUrlParams));
    this.flags.set(Flags.SuppressBrowserKeys, new SettingFlag(Flags.SuppressBrowserKeys, "Suppress browser keys", "Suppress certain browser keys that we use in UE, for example F5 to show shader complexity instead of refresh the page.", settings && Object.prototype.hasOwnProperty.call(settings, Flags.SuppressBrowserKeys) ? settings[Flags.SuppressBrowserKeys] : true, useUrlParams));
    this.flags.set(Flags.IsQualityController, new SettingFlag(Flags.IsQualityController, "Is quality controller?", "True if this peer controls stream quality", settings && Object.prototype.hasOwnProperty.call(settings, Flags.IsQualityController) ? settings[Flags.IsQualityController] : true, useUrlParams));
    this.flags.set(Flags.ForceMonoAudio, new SettingFlag(Flags.ForceMonoAudio, "Force mono audio", "Force browser to request mono audio in the SDP", settings && Object.prototype.hasOwnProperty.call(settings, Flags.ForceMonoAudio) ? settings[Flags.ForceMonoAudio] : false, useUrlParams));
    this.flags.set(Flags.ForceTURN, new SettingFlag(Flags.ForceTURN, "Force TURN", "Only generate TURN/Relayed ICE candidates.", settings && Object.prototype.hasOwnProperty.call(settings, Flags.ForceTURN) ? settings[Flags.ForceTURN] : false, useUrlParams));
    this.flags.set(Flags.AFKDetection, new SettingFlag(Flags.AFKDetection, "AFK if idle", "Timeout the experience if user is AFK for a period.", settings && Object.prototype.hasOwnProperty.call(settings, Flags.AFKDetection) ? settings[Flags.AFKDetection] : false, useUrlParams));
    this.flags.set(Flags.MatchViewportResolution, new SettingFlag(Flags.MatchViewportResolution, "Match viewport resolution", "Pixel Streaming will be instructed to dynamically resize the video stream to match the size of the video element.", settings && Object.prototype.hasOwnProperty.call(settings, Flags.MatchViewportResolution) ? settings[Flags.MatchViewportResolution] : false, useUrlParams));
    this.flags.set(Flags.HoveringMouseMode, new SettingFlag(Flags.HoveringMouseMode, "Control Scheme: Locked Mouse", "Either locked mouse, where the pointer is consumed by the video and locked to it, or hovering mouse, where the mouse is not consumed.", settings && Object.prototype.hasOwnProperty.call(settings, Flags.HoveringMouseMode) ? settings[Flags.HoveringMouseMode] : false, useUrlParams, (isHoveringMouse, setting) => {
      setting.label = `Control Scheme: ${isHoveringMouse ? "Hovering" : "Locked"} Mouse`;
    }));
    this.flags.set(Flags.FakeMouseWithTouches, new SettingFlag(Flags.FakeMouseWithTouches, "Fake mouse with touches", "A single finger touch is converted into a mouse event. This allows a non-touch application to be controlled partially via a touch device.", settings && Object.prototype.hasOwnProperty.call(settings, Flags.FakeMouseWithTouches) ? settings[Flags.FakeMouseWithTouches] : false, useUrlParams));
    this.flags.set(Flags.KeyboardInput, new SettingFlag(Flags.KeyboardInput, "Keyboard input", "If enabled, send keyboard events to streamer", settings && Object.prototype.hasOwnProperty.call(settings, Flags.KeyboardInput) ? settings[Flags.KeyboardInput] : true, useUrlParams));
    this.flags.set(Flags.MouseInput, new SettingFlag(Flags.MouseInput, "Mouse input", "If enabled, send mouse events to streamer", settings && Object.prototype.hasOwnProperty.call(settings, Flags.MouseInput) ? settings[Flags.MouseInput] : true, useUrlParams));
    this.flags.set(Flags.TouchInput, new SettingFlag(Flags.TouchInput, "Touch input", "If enabled, send touch events to streamer", settings && Object.prototype.hasOwnProperty.call(settings, Flags.TouchInput) ? settings[Flags.TouchInput] : true, useUrlParams));
    this.flags.set(Flags.GamepadInput, new SettingFlag(Flags.GamepadInput, "Gamepad input", "If enabled, send gamepad events to streamer", settings && Object.prototype.hasOwnProperty.call(settings, Flags.GamepadInput) ? settings[Flags.GamepadInput] : true, useUrlParams));
    this.flags.set(Flags.XRControllerInput, new SettingFlag(Flags.XRControllerInput, "XR controller input", "If enabled, send XR controller events to streamer", settings && Object.prototype.hasOwnProperty.call(settings, Flags.XRControllerInput) ? settings[Flags.XRControllerInput] : true, useUrlParams));
    this.flags.set(Flags.WaitForStreamer, new SettingFlag(Flags.WaitForStreamer, "Wait for streamer", "Will continue trying to connect to the first streamer available.", settings && Object.prototype.hasOwnProperty.call(settings, Flags.WaitForStreamer) ? settings[Flags.WaitForStreamer] : true, useUrlParams));
    this.flags.set(Flags.HideUI, new SettingFlag(Flags.HideUI, "Hide the UI overlay", "Will hide all UI overlay details", settings && Object.prototype.hasOwnProperty.call(settings, Flags.HideUI) ? settings[Flags.HideUI] : false, useUrlParams));
    this.flags.set(Flags.EnableCaptureTimeExt, new SettingFlag(Flags.EnableCaptureTimeExt, "Enable abs-capture-time", "Enables the abs-capture-time RTP header extension", settings && Object.prototype.hasOwnProperty.call(settings, Flags.EnableCaptureTimeExt) ? settings[Flags.EnableCaptureTimeExt] : false, useUrlParams));
    this.flags.set(Flags.BrowserSendOffer, new SettingFlag(Flags.BrowserSendOffer, "Browser send offer (4.27 ONLY)", "Browser will initiate the WebRTC handshake by sending the offer to the streamer (4.27 ONLY)", settings && Object.prototype.hasOwnProperty.call(settings, Flags.BrowserSendOffer) ? settings[Flags.BrowserSendOffer] : false, useUrlParams));
    this.flags.set(Flags.LatencyCSV, new SettingFlag(Flags.LatencyCSV, "Export Latency CSV", "Shows a button in the stats panel that allows to run a latency test and export the results to a CSV file.", settings && Object.prototype.hasOwnProperty.call(settings, Flags.LatencyCSV) ? settings[Flags.LatencyCSV] : false, useUrlParams));
    this.numericParameters.set(NumericParameters.AFKTimeoutSecs, new SettingNumber(NumericParameters.AFKTimeoutSecs, "AFK timeout", "The time (in seconds) it takes for the application to time out if AFK timeout is enabled.", 0, null, settings && Object.prototype.hasOwnProperty.call(settings, NumericParameters.AFKTimeoutSecs) ? settings[NumericParameters.AFKTimeoutSecs] : 120, useUrlParams));
    this.numericParameters.set(NumericParameters.AFKCountdownSecs, new SettingNumber(NumericParameters.AFKCountdownSecs, "AFK countdown", "The time (in seconds) for a user to respond before the stream is ended after an AFK timeout.", 10, null, 10, useUrlParams));
    this.numericParameters.set(NumericParameters.MaxReconnectAttempts, new SettingNumber(NumericParameters.MaxReconnectAttempts, "Max Reconnects", "Maximum number of reconnects the application will attempt when a streamer disconnects.", 0, 999, settings && Object.prototype.hasOwnProperty.call(settings, NumericParameters.MaxReconnectAttempts) ? settings[NumericParameters.MaxReconnectAttempts] : 3, useUrlParams));
    this.numericParameters.set(NumericParameters.MinQP, new SettingNumber(NumericParameters.MinQP, "Min QP", "The lower bound for the quantization parameter (QP) of the encoder. 0 = Best quality, 51 = worst quality.", 0, 51, settings && Object.prototype.hasOwnProperty.call(settings, NumericParameters.MinQP) ? settings[NumericParameters.MinQP] : 0, useUrlParams));
    this.numericParameters.set(NumericParameters.MaxQP, new SettingNumber(NumericParameters.MaxQP, "Max QP", "The upper bound for the quantization parameter (QP) of the encoder. 0 = Best quality, 51 = worst quality.", 0, 51, settings && Object.prototype.hasOwnProperty.call(settings, NumericParameters.MaxQP) ? settings[NumericParameters.MaxQP] : 51, useUrlParams));
    this.numericParameters.set(NumericParameters.MinQuality, new SettingNumber(NumericParameters.MinQuality, "Min Quality", "The lower bound for the quality factor of the encoder. 0 = Worst quality, 100 = Best quality.", 0, 100, settings && Object.prototype.hasOwnProperty.call(settings, NumericParameters.MinQuality) ? settings[NumericParameters.MinQuality] : 0, useUrlParams));
    this.numericParameters.set(NumericParameters.MaxQuality, new SettingNumber(NumericParameters.MaxQuality, "Max Quality", "The upper bound for the quality factor of the encoder. 0 = Worst quality, 100 = Best quality.", 0, 100, settings && Object.prototype.hasOwnProperty.call(settings, NumericParameters.MaxQuality) ? settings[NumericParameters.MaxQuality] : 100, useUrlParams));
    this.numericParameters.set(NumericParameters.CompatQualityMin, new SettingNumber(NumericParameters.CompatQualityMin, "Min Quality", "The lower bound for encoding quality. 0 = Worst, 100 = Best.", 0, 100, settings && Object.prototype.hasOwnProperty.call(settings, NumericParameters.CompatQualityMin) ? settings[NumericParameters.CompatQualityMin] : 0, useUrlParams));
    this.numericParameters.set(NumericParameters.CompatQualityMax, new SettingNumber(NumericParameters.CompatQualityMax, "Max Quality", "The upper bound for encoding quality. 0 = Worst, 100 = Best.", 0, 100, settings && Object.prototype.hasOwnProperty.call(settings, NumericParameters.CompatQualityMax) ? settings[NumericParameters.CompatQualityMax] : 100, useUrlParams));
    this.numericParameters.set(NumericParameters.WebRTCFPS, new SettingNumber(NumericParameters.WebRTCFPS, "Max FPS", "The maximum FPS that WebRTC will try to transmit frames at.", 1, 999, settings && Object.prototype.hasOwnProperty.call(settings, NumericParameters.WebRTCFPS) ? settings[NumericParameters.WebRTCFPS] : 60, useUrlParams));
    this.numericParameters.set(NumericParameters.WebRTCMinBitrate, new SettingNumber(NumericParameters.WebRTCMinBitrate, "Min Bitrate (kbps)", "The minimum bitrate that WebRTC should use.", 0, 5e5, settings && Object.prototype.hasOwnProperty.call(settings, NumericParameters.WebRTCMinBitrate) ? settings[NumericParameters.WebRTCMinBitrate] : 0, useUrlParams));
    this.numericParameters.set(NumericParameters.WebRTCMaxBitrate, new SettingNumber(NumericParameters.WebRTCMaxBitrate, "Max Bitrate (kbps)", "The maximum bitrate that WebRTC should use.", 0, 5e5, settings && Object.prototype.hasOwnProperty.call(settings, NumericParameters.WebRTCMaxBitrate) ? settings[NumericParameters.WebRTCMaxBitrate] : 0, useUrlParams));
    this.numericParameters.set(NumericParameters.StreamerAutoJoinInterval, new SettingNumber(NumericParameters.StreamerAutoJoinInterval, "Streamer Auto Join Interval (ms)", "Delay between retries when waiting for an available streamer.", 500, 9e5, settings && Object.prototype.hasOwnProperty.call(settings, NumericParameters.StreamerAutoJoinInterval) ? settings[NumericParameters.StreamerAutoJoinInterval] : 3e3, useUrlParams));
    this.numericParameters.set(NumericParameters.KeepaliveDelay, new SettingNumber(NumericParameters.KeepaliveDelay, "Connection Keepalive delay", "Delay between keepalive pings to the signalling server.", 0, 9e5, settings && Object.prototype.hasOwnProperty.call(settings, NumericParameters.KeepaliveDelay) ? settings[NumericParameters.KeepaliveDelay] : 3e4, useUrlParams));
  }
  /**
   * Add a callback to fire when the numeric setting is toggled.
   * @param id The id of the flag.
   * @param onChangedListener The callback to fire when the numeric value changes.
   */
  _addOnNumericSettingChangedListener(id, onChangedListener) {
    if (this.numericParameters.has(id)) {
      this.numericParameters.get(id).addOnChangedListener(onChangedListener);
    }
  }
  _addOnOptionSettingChangedListener(id, onChangedListener) {
    if (this.optionParameters.has(id)) {
      this.optionParameters.get(id).addOnChangedListener(onChangedListener);
    }
  }
  /**
   * @param id The id of the numeric setting we are interested in getting a value for.
   * @returns The numeric value stored in the parameter with the passed id.
   */
  getNumericSettingValue(id) {
    if (this.numericParameters.has(id)) {
      return this.numericParameters.get(id).number;
    } else {
      throw new Error(`There is no numeric setting with the id of ${id}`);
    }
  }
  /**
   * @param id The id of the text setting we are interested in getting a value for.
   * @returns The text value stored in the parameter with the passed id.
   */
  getTextSettingValue(id) {
    if (this.textParameters.has(id)) {
      return this.textParameters.get(id).value;
    } else {
      throw new Error(`There is no numeric setting with the id of ${id}`);
    }
  }
  /**
   * Set number in the setting.
   * @param id The id of the numeric setting we are interested in.
   * @param value The numeric value to set.
   */
  setNumericSetting(id, value) {
    if (this.numericParameters.has(id)) {
      this.numericParameters.get(id).number = value;
    } else {
      throw new Error(`There is no numeric setting with the id of ${id}`);
    }
  }
  /**
   * Add a callback to fire when the flag is toggled.
   * @param id The id of the flag.
   * @param onChangeListener The callback to fire when the value changes.
   */
  _addOnSettingChangedListener(id, onChangeListener) {
    if (this.flags.has(id)) {
      this.flags.get(id).onChange = onChangeListener;
    }
  }
  /**
   * Add a callback to fire when the text is changed.
   * @param id The id of the flag.
   * @param onChangeListener The callback to fire when the value changes.
   */
  _addOnTextSettingChangedListener(id, onChangeListener) {
    if (this.textParameters.has(id)) {
      this.textParameters.get(id).onChange = onChangeListener;
    }
  }
  /**
   * Get the option which has the given id.
   * @param id The id of the option.
   * @returns The SettingOption object matching id
   */
  getSettingOption(id) {
    return this.optionParameters.get(id);
  }
  /**
   * Get the value of the configuration flag which has the given id.
   * @param id The unique id for the flag.
   * @returns True if the flag is enabled.
   */
  isFlagEnabled(id) {
    return this.flags.get(id).flag;
  }
  /**
   * Set flag to be enabled/disabled.
   * @param id The id of the flag to toggle.
   * @param flagEnabled True if the flag should be enabled.
   */
  setFlagEnabled(id, flagEnabled) {
    if (!this.flags.has(id)) {
      Logger.Warning(`Cannot toggle flag called ${id} - it does not exist in the Config.flags map.`);
    } else {
      this.flags.get(id).flag = flagEnabled;
    }
  }
  /**
   * Set the text setting.
   * @param id The id of the setting
   * @param settingValue The value to set in the setting.
   */
  setTextSetting(id, settingValue) {
    if (!this.textParameters.has(id)) {
      Logger.Warning(`Cannot set text setting called ${id} - it does not exist in the Config.textParameters map.`);
    } else {
      this.textParameters.get(id).text = settingValue;
    }
  }
  /**
   * Set the option setting list of options.
   * @param id The id of the setting
   * @param settingOptions The values the setting could take
   */
  setOptionSettingOptions(id, settingOptions) {
    if (!this.optionParameters.has(id)) {
      Logger.Warning(`Cannot set text setting called ${id} - it does not exist in the Config.optionParameters map.`);
    } else {
      this.optionParameters.get(id).options = settingOptions;
    }
  }
  /**
   * Set option enum settings selected option.
   * @param id The id of the setting
   * @param settingOptions The value to select out of all the options
   */
  setOptionSettingValue(id, settingValue) {
    if (!this.optionParameters.has(id)) {
      Logger.Warning(`Cannot set text setting called ${id} - it does not exist in the Config.enumParameters map.`);
    } else {
      const optionSetting = this.optionParameters.get(id);
      const existingOptions = optionSetting.options;
      if (!existingOptions.includes(settingValue)) {
        existingOptions.push(settingValue);
        optionSetting.options = existingOptions;
      }
      optionSetting.selected = settingValue;
    }
  }
  /**
   * Set the label for the flag.
   * @param id The id of the flag.
   * @param label The new label to use for the flag.
   */
  setFlagLabel(id, label) {
    if (!this.flags.has(id)) {
      Logger.Warning(`Cannot set label for flag called ${id} - it does not exist in the Config.flags map.`);
    } else {
      this.flags.get(id).label = label;
    }
  }
  /**
   * Set a subset of all settings in one function call.
   *
   * @param settings A (partial) list of settings to set
   */
  setSettings(settings) {
    for (const key of Object.keys(settings)) {
      if (isFlagId(key)) {
        this.setFlagEnabled(key, settings[key]);
      } else if (isNumericId(key)) {
        this.setNumericSetting(key, settings[key]);
      } else if (isTextId(key)) {
        this.setTextSetting(key, settings[key]);
      } else if (isOptionId(key)) {
        this.setOptionSettingValue(key, settings[key]);
      }
    }
  }
  /**
   * Get all settings
   * @returns All setting values as an object with setting ids as keys
   */
  getSettings() {
    const settings = {};
    for (const [key, value] of this.flags.entries()) {
      settings[key] = value.flag;
    }
    for (const [key, value] of this.numericParameters.entries()) {
      settings[key] = value.number;
    }
    for (const [key, value] of this.textParameters.entries()) {
      settings[key] = value.text;
    }
    for (const [key, value] of this.optionParameters.entries()) {
      settings[key] = value.selected;
    }
    return settings;
  }
  /**
   * Get all Flag settings as an array.
   * @returns All SettingFlag objects
   */
  getFlags() {
    return Array.from(this.flags.values());
  }
  /**
   * Get all Text settings as an array.
   * @returns All SettingText objects
   */
  getTextSettings() {
    return Array.from(this.textParameters.values());
  }
  /**
   * Get all Number settings as an array.
   * @returns All SettingNumber objects
   */
  getNumericSettings() {
    return Array.from(this.numericParameters.values());
  }
  /**
   * Get all Option settings as an array.
   * @returns All SettingOption objects
   */
  getOptionSettings() {
    return Array.from(this.optionParameters.values());
  }
  /**
   * Emit events when settings change.
   * @param eventEmitter
   */
  _registerOnChangeEvents(eventEmitter) {
    for (const key of this.flags.keys()) {
      const flag = this.flags.get(key);
      if (flag) {
        flag.onChangeEmit = (newValue) => eventEmitter.dispatchEvent(new SettingsChangedEvent({
          id: flag.id,
          type: "flag",
          value: newValue,
          target: flag
        }));
      }
    }
    for (const key of this.numericParameters.keys()) {
      const number = this.numericParameters.get(key);
      if (number) {
        number.onChangeEmit = (newValue) => eventEmitter.dispatchEvent(new SettingsChangedEvent({
          id: number.id,
          type: "number",
          value: newValue,
          target: number
        }));
      }
    }
    for (const key of this.textParameters.keys()) {
      const text = this.textParameters.get(key);
      if (text) {
        text.onChangeEmit = (newValue) => eventEmitter.dispatchEvent(new SettingsChangedEvent({
          id: text.id,
          type: "text",
          value: newValue,
          target: text
        }));
      }
    }
    for (const key of this.optionParameters.keys()) {
      const option = this.optionParameters.get(key);
      if (option) {
        option.onChangeEmit = (newValue) => eventEmitter.dispatchEvent(new SettingsChangedEvent({
          id: option.id,
          type: "option",
          value: newValue,
          target: option
        }));
      }
    }
  }
};
var ControlSchemeType;
(function(ControlSchemeType2) {
  ControlSchemeType2[ControlSchemeType2["LockedMouse"] = 0] = "LockedMouse";
  ControlSchemeType2[ControlSchemeType2["HoveringMouse"] = 1] = "HoveringMouse";
})(ControlSchemeType || (ControlSchemeType = {}));

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/AFK/AFKController.js
var AFKController = class {
  constructor(config2, pixelStreaming, onDismissAfk) {
    this.active = false;
    this.countdownActive = false;
    this.warnTimer = void 0;
    this.countDown = 0;
    this.countDownTimer = void 0;
    this.config = config2;
    this.pixelStreaming = pixelStreaming;
    this.onDismissAfk = onDismissAfk;
    this.onAFKTimedOutCallback = () => {
      console.log("AFK timed out, did you want to override this callback?");
    };
  }
  /**
   * The methods that occur when an afk event listener is clicked
   */
  onAfkClick() {
    clearInterval(this.countDownTimer);
    if (this.active || this.countdownActive) {
      this.startAfkWarningTimer();
      this.pixelStreaming.dispatchEvent(new AfkWarningDeactivateEvent());
    }
  }
  /**
   * Start the warning timer if a timeout is set greater that 0 seconds
   */
  startAfkWarningTimer() {
    if (this.config.getNumericSettingValue(NumericParameters.AFKTimeoutSecs) > 0 && this.config.isFlagEnabled(Flags.AFKDetection)) {
      this.active = true;
    } else {
      this.active = false;
    }
    this.resetAfkWarningTimer();
  }
  /**
   * Stop the afk warning timer
   */
  stopAfkWarningTimer() {
    this.active = false;
    this.countdownActive = false;
    clearTimeout(this.warnTimer);
    clearInterval(this.countDownTimer);
  }
  /**
   * Pause the timer which when elapsed will warn the user they are inactive.
   */
  pauseAfkWarningTimer() {
    this.active = false;
  }
  /**
   * If the user interacts then reset the warning timer.
   */
  resetAfkWarningTimer() {
    if (this.active && this.config.isFlagEnabled(Flags.AFKDetection)) {
      clearTimeout(this.warnTimer);
      this.warnTimer = setTimeout(() => this.activateAfkEvent(), this.config.getNumericSettingValue(NumericParameters.AFKTimeoutSecs) * 1e3);
    }
  }
  /**
   * Show the AFK overlay and begin the countDown
   */
  activateAfkEvent() {
    this.pauseAfkWarningTimer();
    this.pixelStreaming.dispatchEvent(new AfkWarningActivateEvent({
      countDown: this.countDown,
      dismissAfk: this.onDismissAfk
    }));
    this.countDown = this.config.getNumericSettingValue(NumericParameters.AFKCountdownSecs);
    this.countdownActive = true;
    this.pixelStreaming.dispatchEvent(new AfkWarningUpdateEvent({ countDown: this.countDown }));
    if (!this.config.isFlagEnabled(Flags.HoveringMouseMode)) {
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    }
    this.countDownTimer = setInterval(() => {
      this.countDown--;
      if (this.countDown == 0) {
        this.pixelStreaming.dispatchEvent(new AfkTimedOutEvent());
        this.onAFKTimedOutCallback();
        Logger.Info("You have been disconnected due to inactivity");
        this.stopAfkWarningTimer();
      } else {
        this.pixelStreaming.dispatchEvent(new AfkWarningUpdateEvent({ countDown: this.countDown }));
      }
    }, 1e3);
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/DataChannel/DataChannelController.js
var DataChannelController = class {
  constructor() {
    this.isReceivingFreezeFrame = false;
  }
  /**
   * return the current state of a datachannel controller instance
   * @returns the current DataChannelController instance
   */
  getDataChannelInstance() {
    return this;
  }
  /**
   * To Create and Set up a Data Channel
   * @param peerConnection - The RTC Peer Connection
   * @param label - Label of the Data Channel
   * @param datachannelOptions - Optional RTC DataChannel options
   */
  createDataChannel(peerConnection, label, datachannelOptions) {
    this.peerConnection = peerConnection;
    this.label = label;
    this.datachannelOptions = datachannelOptions;
    if (datachannelOptions == null) {
      this.datachannelOptions = {};
      this.datachannelOptions.ordered = true;
    }
    this.dataChannel = this.peerConnection.createDataChannel(this.label, this.datachannelOptions);
    this.setupDataChannel();
  }
  setupDataChannel() {
    this.dataChannel.binaryType = "arraybuffer";
    this.dataChannel.onopen = (ev) => this.handleOnOpen(ev);
    this.dataChannel.onclose = (ev) => this.handleOnClose(ev);
    this.dataChannel.onmessage = (ev) => this.handleOnMessage(ev);
    this.dataChannel.onerror = (ev) => this.handleOnError(ev);
  }
  /**
   * Handles when the Data Channel is opened
   */
  handleOnOpen(ev) {
    var _a;
    Logger.Info(`Data Channel (${this.label}) opened.`);
    this.onOpen((_a = this.dataChannel) === null || _a === void 0 ? void 0 : _a.label, ev);
  }
  /**
   * Handles when the Data Channel is closed
   */
  handleOnClose(ev) {
    var _a;
    Logger.Info(`Data Channel (${this.label}) closed.`);
    this.onClose((_a = this.dataChannel) === null || _a === void 0 ? void 0 : _a.label, ev);
  }
  /**
   * Handles when a message is received
   * @param event - Message Event
   */
  handleOnMessage(event) {
    Logger.Info(`Data Channel (${this.label}) message: ${event}`);
  }
  /**
   * Handles when an error is thrown
   * @param event - Error Event
   */
  handleOnError(event) {
    var _a;
    Logger.Info(`Data Channel (${this.label}) error: ${event}`);
    this.onError((_a = this.dataChannel) === null || _a === void 0 ? void 0 : _a.label, event);
  }
  /**
   * Override to register onOpen handler
   * @param label Data channel label ("datachannel", "send-datachannel", "recv-datachannel")
   * @param ev event
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOpen(label, ev) {
  }
  /**
   * Override to register onClose handler
   * @param label Data channel label ("datachannel", "send-datachannel", "recv-datachannel")
   * @param ev event
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClose(label, ev) {
  }
  /**
   * Override to register onError handler
   * @param label Data channel label ("datachannel", "send-datachannel", "recv-datachannel")
   * @param ev event
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onError(label, ev) {
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/PeerConnectionController/InboundRTPStats.js
var InboundAudioStats = class {
};
var InboundVideoStats = class {
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/PeerConnectionController/DataChannelStats.js
var DataChannelStats = class {
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/PeerConnectionController/CandidateStat.js
var CandidateStat = class {
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/PeerConnectionController/OutBoundRTPStats.js
var OutboundRTPStats = class {
};
var RemoteOutboundRTPStats = class {
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/PeerConnectionController/SessionStats.js
var SessionStats = class {
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/PeerConnectionController/StreamStats.js
var StreamStats = class {
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/PeerConnectionController/AggregatedStats.js
var AggregatedStats = class {
  constructor() {
    this.inboundVideoStats = new InboundVideoStats();
    this.inboundAudioStats = new InboundAudioStats();
    this.candidatePairs = new Array();
    this.datachannelStats = new DataChannelStats();
    this.localCandidates = new Array();
    this.remoteCandidates = new Array();
    this.outboundVideoStats = new OutboundRTPStats();
    this.outboundAudioStats = new OutboundRTPStats();
    this.remoteOutboundAudioStats = new RemoteOutboundRTPStats();
    this.remoteOutboundVideoStats = new RemoteOutboundRTPStats();
    this.sessionStats = new SessionStats();
    this.streamStats = new StreamStats();
    this.codecs = /* @__PURE__ */ new Map();
  }
  /**
   * Gather all the information from the RTC Peer Connection Report
   * @param rtcStatsReport - RTC Stats Report
   */
  processStats(rtcStatsReport) {
    this.localCandidates = new Array();
    this.remoteCandidates = new Array();
    this.candidatePairs = new Array();
    rtcStatsReport.forEach((stat) => {
      const type = stat.type;
      switch (type) {
        case "candidate-pair":
          this.handleCandidatePair(stat);
          break;
        case "certificate":
          break;
        case "codec":
          this.handleCodec(stat);
          break;
        case "data-channel":
          this.handleDataChannel(stat);
          break;
        case "inbound-rtp":
          this.handleInboundRTP(stat);
          break;
        case "local-candidate":
          this.handleLocalCandidate(stat);
          break;
        case "media-source":
          break;
        case "media-playout":
          break;
        case "outbound-rtp":
          this.handleLocalOutbound(stat);
          break;
        case "peer-connection":
          break;
        case "remote-candidate":
          this.handleRemoteCandidate(stat);
          break;
        case "remote-inbound-rtp":
          break;
        case "remote-outbound-rtp":
          this.handleRemoteOutbound(stat);
          break;
        case "track":
          this.handleTrack(stat);
          break;
        case "transport":
          this.handleTransport(stat);
          break;
        case "stream":
          this.handleStream(stat);
          break;
        default:
          Logger.Error("unhandled Stat Type");
          Logger.Info(stat);
          break;
      }
    });
  }
  /**
   * Process stream stats data from webrtc
   *
   * @param stat - the stats coming in from webrtc
   */
  handleStream(stat) {
    this.streamStats = stat;
  }
  /**
   * Process the Ice Candidate Pair Data
   * @param stat - the stats coming in from ice candidates
   */
  handleCandidatePair(stat) {
    this.candidatePairs.push(stat);
  }
  /**
   * Process the Data Channel Data
   * @param stat - the stats coming in from the data channel
   */
  handleDataChannel(stat) {
    this.datachannelStats.bytesReceived = stat.bytesReceived;
    this.datachannelStats.bytesSent = stat.bytesSent;
    this.datachannelStats.dataChannelIdentifier = stat.dataChannelIdentifier;
    this.datachannelStats.id = stat.id;
    this.datachannelStats.label = stat.label;
    this.datachannelStats.messagesReceived = stat.messagesReceived;
    this.datachannelStats.messagesSent = stat.messagesSent;
    this.datachannelStats.protocol = stat.protocol;
    this.datachannelStats.state = stat.state;
    this.datachannelStats.timestamp = stat.timestamp;
  }
  /**
   * Process the Local Ice Candidate Data
   * @param stat - local stats
   */
  handleLocalCandidate(stat) {
    const localCandidate = new CandidateStat();
    localCandidate.label = "local-candidate";
    localCandidate.address = stat.address;
    localCandidate.port = stat.port;
    localCandidate.protocol = stat.protocol;
    localCandidate.candidateType = stat.candidateType;
    localCandidate.id = stat.id;
    localCandidate.relayProtocol = stat.relayProtocol;
    localCandidate.transportId = stat.transportId;
    this.localCandidates.push(localCandidate);
  }
  /**
   * Process the Remote Ice Candidate Data
   * @param stat - ice candidate stats
   */
  handleRemoteCandidate(stat) {
    const remoteCandidate = new CandidateStat();
    remoteCandidate.label = "remote-candidate";
    remoteCandidate.address = stat.address;
    remoteCandidate.port = stat.port;
    remoteCandidate.protocol = stat.protocol;
    remoteCandidate.id = stat.id;
    remoteCandidate.candidateType = stat.candidateType;
    remoteCandidate.relayProtocol = stat.relayProtocol;
    remoteCandidate.transportId = stat.transportId;
    this.remoteCandidates.push(remoteCandidate);
  }
  /**
   * Process the Inbound RTP Audio and Video Data
   * @param stat - inbound rtp stats
   */
  handleInboundRTP(stat) {
    switch (stat.kind) {
      case "video":
        if (stat.bytesReceived > this.inboundVideoStats.bytesReceived && stat.timestamp > this.inboundVideoStats.timestamp) {
          this.inboundVideoStats.bitrate = 8 * (stat.bytesReceived - this.inboundVideoStats.bytesReceived) / (stat.timestamp - this.inboundVideoStats.timestamp);
          this.inboundVideoStats.bitrate = Math.floor(this.inboundVideoStats.bitrate);
        }
        for (const key in stat) {
          this.inboundVideoStats[key] = stat[key];
        }
        break;
      case "audio":
        if (stat.bytesReceived > this.inboundAudioStats.bytesReceived && stat.timestamp > this.inboundAudioStats.timestamp) {
          this.inboundAudioStats.bitrate = 8 * (stat.bytesReceived - this.inboundAudioStats.bytesReceived) / (stat.timestamp - this.inboundAudioStats.timestamp);
          this.inboundAudioStats.bitrate = Math.floor(this.inboundAudioStats.bitrate);
        }
        for (const key in stat) {
          this.inboundAudioStats[key] = stat[key];
        }
        break;
      default:
        Logger.Error(`Kind should be audio or video, we got ${stat.kind} - that's unsupported.`);
        break;
    }
  }
  /**
   * Process the "local" outbound RTP Audio and Video stats.
   * @param stat - local outbound rtp stats
   */
  handleLocalOutbound(stat) {
    const localOutboundStats = stat.kind === "audio" ? this.outboundAudioStats : this.outboundVideoStats;
    localOutboundStats.active = stat.active;
    localOutboundStats.codecId = stat.codecId;
    localOutboundStats.bytesSent = stat.bytesSent;
    localOutboundStats.frameHeight = stat.frameHeight;
    localOutboundStats.frameWidth = stat.frameWidth;
    localOutboundStats.framesEncoded = stat.framesEncoded;
    localOutboundStats.framesPerSecond = stat.framesPerSecond;
    localOutboundStats.headerBytesSent = stat.headerBytesSent;
    localOutboundStats.id = stat.id;
    localOutboundStats.keyFramesEncoded = stat.keyFramesEncoded;
    localOutboundStats.kind = stat.kind;
    localOutboundStats.mediaSourceId = stat.mediaSourceId;
    localOutboundStats.mid = stat.mid;
    localOutboundStats.nackCount = stat.nackCount;
    localOutboundStats.packetsSent = stat.packetsSent;
    localOutboundStats.qpSum = stat.qpSum;
    localOutboundStats.qualityLimitationDurations = stat.qualityLimitationDurations;
    localOutboundStats.qualityLimitationReason = stat.qualityLimitationReason;
    localOutboundStats.remoteId = stat.remoteId;
    localOutboundStats.retransmittedBytesSent = stat.retransmittedBytesSent;
    localOutboundStats.rid = stat.rid;
    localOutboundStats.scalabilityMode = stat.scalabilityMode;
    localOutboundStats.ssrc = stat.ssrc;
    localOutboundStats.targetBitrate = stat.targetBitrate;
    localOutboundStats.timestamp = stat.timestamp;
    localOutboundStats.totalEncodeTime = stat.totalEncodeTime;
    localOutboundStats.totalEncodeBytesTarget = stat.totalEncodeBytesTarget;
    localOutboundStats.totalPacketSendDelay = stat.totalPacketSendDelay;
    localOutboundStats.transportId = stat.transportId;
  }
  /**
   * Process the "remote" outbound RTP Audio and Video stats.
   * @param stat - remote outbound rtp stats
   */
  handleRemoteOutbound(stat) {
    const remoteOutboundStats = stat.kind === "audio" ? this.remoteOutboundAudioStats : this.remoteOutboundVideoStats;
    remoteOutboundStats.bytesSent = stat.bytesSent;
    remoteOutboundStats.codecId = stat.codecId;
    remoteOutboundStats.id = stat.id;
    remoteOutboundStats.kind = stat.kind;
    remoteOutboundStats.localId = stat.localId;
    remoteOutboundStats.packetsSent = stat.packetsSent;
    remoteOutboundStats.remoteTimestamp = stat.remoteTimestamp;
    remoteOutboundStats.reportsSent = stat.reportsSent;
    remoteOutboundStats.roundTripTimeMeasurements = stat.roundTripTimeMeasurements;
    remoteOutboundStats.ssrc = stat.ssrc;
    remoteOutboundStats.timestamp = stat.timestamp;
    remoteOutboundStats.totalRoundTripTime = stat.totalRoundTripTime;
    remoteOutboundStats.transportId = stat.transportId;
  }
  /**
   * Process the Inbound Video Track Data
   * @param stat - video track stats
   */
  handleTrack(stat) {
    if (stat.type === "track" && (stat.trackIdentifier === "video_label" || stat.kind === "video")) {
      this.inboundVideoStats.framesDropped = stat.framesDropped;
      this.inboundVideoStats.framesReceived = stat.framesReceived;
      this.inboundVideoStats.frameHeight = stat.frameHeight;
      this.inboundVideoStats.frameWidth = stat.frameWidth;
    }
  }
  handleTransport(stat) {
    this.transportStats = stat;
  }
  handleCodec(stat) {
    const codecId = stat.id;
    this.codecs.set(codecId, stat);
  }
  handleSessionStatistics(videoStartTime, inputController, videoEncoderAvgQP) {
    const deltaTime = Date.now() - videoStartTime;
    this.sessionStats.runTime = new Date(deltaTime).toISOString().substr(11, 8).toString();
    const controlsStreamInput = inputController === null ? "Not sent yet" : inputController ? "true" : "false";
    this.sessionStats.controlsStreamInput = controlsStreamInput;
    this.sessionStats.videoEncoderAvgQP = videoEncoderAvgQP;
  }
  /**
   * Check if a value coming in from our stats is actually a number
   * @param value - the number to be checked
   */
  isNumber(value) {
    return typeof value === "number" && isFinite(value);
  }
  /**
   * Helper function to return the active candidate pair
   * @returns The candidate pair that is currently receiving data
   */
  getActiveCandidatePair() {
    if (this.candidatePairs === void 0) {
      return null;
    }
    if (this.transportStats) {
      const selectedPair2 = this.candidatePairs.find((candidatePair) => candidatePair.id === this.transportStats.selectedCandidatePairId);
      if (selectedPair2 === void 0) {
        return null;
      } else {
        return selectedPair2;
      }
    }
    const selectedPair = this.candidatePairs.find((candidatePair) => candidatePair.selected);
    if (selectedPair === void 0) {
      return null;
    } else {
      return selectedPair;
    }
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/PeerConnectionController/PeerConnectionController.js
var import_sdp = __toESM(require_sdp());

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Util/RTCUtils.js
var RTCUtils = class {
  static isVideoTransceiver(transceiver) {
    return this.canTransceiverReceiveVideo(transceiver) || this.canTransceiverSendVideo(transceiver);
  }
  static canTransceiverReceiveVideo(transceiver) {
    return !!transceiver && (transceiver.direction === "sendrecv" || transceiver.direction === "recvonly") && transceiver.receiver && transceiver.receiver.track && transceiver.receiver.track.kind === "video";
  }
  static canTransceiverSendVideo(transceiver) {
    return !!transceiver && (transceiver.direction === "sendrecv" || transceiver.direction === "sendonly") && transceiver.sender && transceiver.sender.track && transceiver.sender.track.kind === "video";
  }
  static isAudioTransceiver(transceiver) {
    return this.canTransceiverReceiveAudio(transceiver) || this.canTransceiverSendAudio(transceiver);
  }
  static canTransceiverReceiveAudio(transceiver) {
    return !!transceiver && (transceiver.direction === "sendrecv" || transceiver.direction === "recvonly") && transceiver.receiver && transceiver.receiver.track && transceiver.receiver.track.kind === "audio";
  }
  static canTransceiverSendAudio(transceiver) {
    return !!transceiver && (transceiver.direction === "sendrecv" || transceiver.direction === "sendonly") && transceiver.sender && transceiver.sender.track && transceiver.sender.track.kind === "audio";
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/PeerConnectionController/LatencyCalculator.js
var RTCRtpCaptureSource = class {
};
var FrameTimingInfo = class {
};
var LatencyCalculator = class {
  constructor() {
    this.latestSenderRecvClockOffset = null;
  }
  calculate(stats2, receivers) {
    const latencyInfo = new LatencyInfo();
    const rttMS = this.getRTTMs(stats2);
    if (rttMS != null) {
      latencyInfo.rttMs = rttMS;
      const captureSource = this.getCaptureSource(receivers);
      if (captureSource != null) {
        const senderLatencyMs = this.calculateSenderLatency(stats2, captureSource);
        if (senderLatencyMs !== null) {
          latencyInfo.senderLatencyMs = senderLatencyMs;
        }
      }
    }
    if (stats2.inboundVideoStats.totalProcessingDelay !== void 0 && stats2.inboundVideoStats.framesDecoded !== void 0) {
      latencyInfo.averageProcessingDelayMs = stats2.inboundVideoStats.totalProcessingDelay / stats2.inboundVideoStats.framesDecoded * 1e3;
    }
    if (stats2.inboundVideoStats.jitterBufferDelay !== void 0 && stats2.inboundVideoStats.jitterBufferEmittedCount !== void 0) {
      latencyInfo.averageJitterBufferDelayMs = stats2.inboundVideoStats.jitterBufferDelay / stats2.inboundVideoStats.jitterBufferEmittedCount * 1e3;
    }
    if (stats2.inboundVideoStats.framesDecoded !== void 0 && stats2.inboundVideoStats.totalDecodeTime !== void 0) {
      latencyInfo.averageDecodeLatencyMs = stats2.inboundVideoStats.totalDecodeTime / stats2.inboundVideoStats.framesDecoded * 1e3;
    }
    if (stats2.inboundVideoStats.totalAssemblyTime !== void 0 && stats2.inboundVideoStats.framesAssembledFromMultiplePackets !== void 0) {
      latencyInfo.averageAssemblyDelayMs = stats2.inboundVideoStats.totalAssemblyTime / stats2.inboundVideoStats.framesAssembledFromMultiplePackets * 1e3;
    }
    if (stats2.inboundVideoStats.googTimingFrameInfo !== void 0 && stats2.inboundVideoStats.googTimingFrameInfo.length > 0) {
      latencyInfo.frameTiming = this.extractFrameTimingInfo(stats2.inboundVideoStats.googTimingFrameInfo);
    }
    if (latencyInfo.frameTiming !== void 0 && latencyInfo.frameTiming.captureToSendLatencyMs !== void 0 && latencyInfo.averageProcessingDelayMs !== void 0 && latencyInfo.rttMs !== void 0) {
      latencyInfo.averageE2ELatency = latencyInfo.frameTiming.captureToSendLatencyMs + latencyInfo.rttMs * 0.5 + latencyInfo.averageProcessingDelayMs;
    }
    if (latencyInfo.senderLatencyMs != void 0 && latencyInfo.averageProcessingDelayMs !== void 0 && latencyInfo.rttMs !== void 0) {
      latencyInfo.averageE2ELatency = latencyInfo.senderLatencyMs + latencyInfo.rttMs * 0.5 + latencyInfo.averageProcessingDelayMs;
    }
    return latencyInfo;
  }
  extractFrameTimingInfo(googTimingFrameInfo) {
    const timingInfo = new FrameTimingInfo();
    const timingInfoArr = googTimingFrameInfo.split(",");
    if (timingInfoArr.length === 15) {
      timingInfo.rtpTimestamp = Number.parseInt(timingInfoArr[0]);
      timingInfo.captureTimestamp = Number.parseInt(timingInfoArr[1]);
      timingInfo.encodeStartTimestamp = Number.parseInt(timingInfoArr[2]);
      timingInfo.encodeFinishTimestamp = Number.parseInt(timingInfoArr[3]);
      timingInfo.packetizerFinishTimestamp = Number.parseInt(timingInfoArr[4]);
      timingInfo.pacerExitTimestamp = Number.parseInt(timingInfoArr[5]);
      timingInfo.networkTimestamp1 = Number.parseInt(timingInfoArr[6]);
      timingInfo.networkTimestamp2 = Number.parseInt(timingInfoArr[7]);
      timingInfo.receiveStart = Number.parseInt(timingInfoArr[8]);
      timingInfo.receiveFinish = Number.parseInt(timingInfoArr[9]);
      timingInfo.decodeStart = Number.parseInt(timingInfoArr[10]);
      timingInfo.decodeFinish = Number.parseInt(timingInfoArr[11]);
      timingInfo.renderTime = Number.parseInt(timingInfoArr[12]);
      timingInfo.isOutlier = Number.parseInt(timingInfoArr[13]) > 0;
      timingInfo.isTriggeredByTimer = Number.parseInt(timingInfoArr[14]) > 0;
      timingInfo.encoderLatencyMs = timingInfo.encodeFinishTimestamp - timingInfo.encodeStartTimestamp;
      timingInfo.packetizeLatencyMs = timingInfo.packetizerFinishTimestamp - timingInfo.encodeFinishTimestamp;
      timingInfo.pacerLatencyMs = timingInfo.pacerExitTimestamp - timingInfo.packetizerFinishTimestamp;
      timingInfo.captureToSendLatencyMs = timingInfo.pacerExitTimestamp - timingInfo.captureTimestamp;
    }
    return timingInfo;
  }
  calculateSenderLatency(stats2, captureSource) {
    const senderCaptureTimestamp = captureSource.captureTimestamp + captureSource.senderCaptureTimeOffset;
    let sendRecvClockOffset = this.calculateSenderReceiverClockOffset(stats2);
    if (sendRecvClockOffset == null) {
      if (this.latestSenderRecvClockOffset != null) {
        sendRecvClockOffset = this.latestSenderRecvClockOffset;
      } else {
        return null;
      }
    } else {
      this.latestSenderRecvClockOffset = sendRecvClockOffset;
    }
    const recvCaptureTimestampNTP = senderCaptureTimestamp + sendRecvClockOffset;
    const ntp1970 = 22089888e5;
    const recvCaptureTimestamp = recvCaptureTimestampNTP - ntp1970;
    const senderLatency = captureSource.timestamp - recvCaptureTimestamp;
    return senderLatency;
  }
  /**
   * Find the first valid ssrc or csrc that has capture time fields present from abs-capture-time header extension.
   * @param receivers The RTP receviers this peer connection has.
   * @returns A single valid ssrc or csrc that has capture time fields or null if there is none (e.g. in non-chromium browsers it will be null).
   */
  getCaptureSource(receivers) {
    receivers = receivers.filter((receiver) => receiver.track.kind === "video");
    for (const receiver of receivers) {
      const sources = receiver.getSynchronizationSources().concat(receiver.getContributingSources());
      for (const src of sources) {
        if (src.captureTimestamp !== void 0 && src.senderCaptureTimeOffset !== void 0 && src.timestamp !== void 0) {
          const captureSrc = new RTCRtpCaptureSource();
          captureSrc.timestamp = src.timestamp;
          captureSrc.captureTimestamp = src.captureTimestamp;
          captureSrc.senderCaptureTimeOffset = src.senderCaptureTimeOffset;
          return captureSrc;
        }
      }
    }
    return null;
  }
  calculateSenderReceiverClockOffset(stats2) {
    const hasRemoteOutboundVideoStats = stats2.remoteOutboundVideoStats !== void 0 && stats2.remoteOutboundVideoStats.timestamp !== void 0 && stats2.remoteOutboundVideoStats.remoteTimestamp !== void 0;
    if (!hasRemoteOutboundVideoStats) {
      return null;
    }
    const remoteStatsArrivedTimestamp = stats2.remoteOutboundVideoStats.timestamp;
    const remoteStatsSentTimestamp = stats2.remoteOutboundVideoStats.remoteTimestamp;
    const rttMs = this.getRTTMs(stats2);
    if (remoteStatsArrivedTimestamp !== void 0 && remoteStatsSentTimestamp !== void 0 && rttMs !== null) {
      const onewayDelay = rttMs * 0.5;
      return remoteStatsArrivedTimestamp - (remoteStatsSentTimestamp + onewayDelay);
    } else {
      return null;
    }
  }
  getRTTMs(stats2) {
    const activeCandidatePair = stats2.getActiveCandidatePair();
    if (!!activeCandidatePair && activeCandidatePair.currentRoundTripTime !== void 0) {
      const curRTTSeconds = activeCandidatePair.currentRoundTripTime;
      return curRTTSeconds * 1e3;
    }
    if (!!stats2.remoteOutboundVideoStats && stats2.remoteOutboundVideoStats.totalRoundTripTime !== void 0 && stats2.remoteOutboundVideoStats.roundTripTimeMeasurements !== void 0 && stats2.remoteOutboundVideoStats.roundTripTimeMeasurements > 0) {
      const avgRttSeconds = stats2.remoteOutboundVideoStats.totalRoundTripTime / stats2.remoteOutboundVideoStats.roundTripTimeMeasurements;
      return avgRttSeconds * 1e3;
    }
    if (!!stats2.remoteOutboundAudioStats && stats2.remoteOutboundAudioStats.totalRoundTripTime !== void 0 && stats2.remoteOutboundAudioStats.roundTripTimeMeasurements !== void 0 && stats2.remoteOutboundAudioStats.roundTripTimeMeasurements > 0) {
      const avgRttSeconds = stats2.remoteOutboundAudioStats.totalRoundTripTime / stats2.remoteOutboundAudioStats.roundTripTimeMeasurements;
      return avgRttSeconds * 1e3;
    }
    return null;
  }
};
var LatencyInfo = class {
  constructor() {
    this.senderLatencyMs = void 0;
    this.senderLatencyAbsCaptureTimeMs = void 0;
    this.rttMs = void 0;
    this.averageProcessingDelayMs = void 0;
    this.averageJitterBufferDelayMs = void 0;
    this.averageDecodeLatencyMs = void 0;
    this.averageAssemblyDelayMs = void 0;
    this.averageE2ELatency = void 0;
    this.frameTiming = void 0;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/PeerConnectionController/PeerConnectionController.js
var __awaiter = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var kAbsCaptureTime = "http://www.webrtc.org/experiments/rtp-hdrext/abs-capture-time";
var PeerConnectionController = class {
  /**
   * Create a new RTC Peer Connection client
   * @param options - Peer connection Options
   * @param config - The config for our PS experience.
   */
  constructor(options, config2, preferredCodec) {
    this.config = config2;
    this.createPeerConnection(options, preferredCodec);
    this.latencyCalculator = new LatencyCalculator();
  }
  createPeerConnection(options, preferredCodec) {
    if (this.config.isFlagEnabled(Flags.ForceTURN)) {
      options.iceTransportPolicy = "relay";
      Logger.Info("Forcing TURN usage by setting ICE Transport Policy in peer connection config.");
    }
    this.peerConnection = new RTCPeerConnection(options);
    this.peerConnection.onsignalingstatechange = (ev) => this.handleSignalStateChange(ev);
    this.peerConnection.oniceconnectionstatechange = (ev) => this.handleIceConnectionStateChange(ev);
    this.peerConnection.onicegatheringstatechange = (ev) => this.handleIceGatheringStateChange(ev);
    this.peerConnection.ontrack = (ev) => this.handleOnTrack(ev);
    this.peerConnection.onicecandidate = (ev) => this.handleIceCandidate(ev);
    this.peerConnection.ondatachannel = (ev) => this.handleDataChannel(ev);
    this.aggregatedStats = new AggregatedStats();
    this.preferredCodec = preferredCodec;
    this.updateCodecSelection = true;
  }
  /**
   * Create an offer for the Web RTC handshake and send the offer to the signaling server via websocket
   * @param offerOptions - RTC Offer Options
   */
  createOffer(offerOptions, config2) {
    return __awaiter(this, void 0, void 0, function* () {
      Logger.Info("Create Offer");
      const isLocalhostConnection = location.hostname === "localhost" || location.hostname === "127.0.0.1";
      const isHttpsConnection = location.protocol === "https:";
      let useMic = config2.isFlagEnabled(Flags.UseMic);
      let useCamera = config2.isFlagEnabled(Flags.UseCamera);
      if ((useMic || useCamera) && !(isLocalhostConnection || isHttpsConnection)) {
        useMic = false;
        useCamera = false;
        Logger.Error("Microphone and Webcam access in the browser will not work if you are not on HTTPS or localhost. Disabling mic and webcam access.");
        Logger.Error("For testing you can enable HTTP microphone access Chrome by visiting chrome://flags/ and enabling 'unsafely-treat-insecure-origin-as-secure'");
      }
      this.setupTransceiversAsync(useMic, useCamera).finally(() => {
        var _a;
        (_a = this.peerConnection) === null || _a === void 0 ? void 0 : _a.createOffer(offerOptions).then((offer2) => {
          var _a2;
          this.showTextOverlayConnecting();
          offer2.sdp = this.mungeSDP(offer2.sdp, useMic);
          (_a2 = this.peerConnection) === null || _a2 === void 0 ? void 0 : _a2.setLocalDescription(offer2);
          this.onSendWebRTCOffer(offer2);
        }).catch(() => {
          this.showTextOverlaySetupFailure();
        });
      });
    });
  }
  /**
   * Receive offer from UE side and process it as the remote description of this peer connection
   */
  receiveOffer(offer2, config2) {
    return __awaiter(this, void 0, void 0, function* () {
      var _a;
      Logger.Info("Receive Offer");
      if (this.isFirefox()) {
        offer2.sdp = offer2.sdp.replace(/^a=extmap:\d+ http:\/\/www\.webrtc\.org\/experiments\/rtp-hdrext\/abs-capture-time\r\n/gm, "");
      }
      (_a = this.peerConnection) === null || _a === void 0 ? void 0 : _a.setRemoteDescription(offer2).then(() => {
        this.onSetRemoteDescription(offer2);
        const isLocalhostConnection = location.hostname === "localhost" || location.hostname === "127.0.0.1";
        const isHttpsConnection = location.protocol === "https:";
        let useMic = config2.isFlagEnabled(Flags.UseMic);
        let useCamera = config2.isFlagEnabled(Flags.UseCamera);
        if ((useMic || useCamera) && !(isLocalhostConnection || isHttpsConnection)) {
          useMic = false;
          useCamera = false;
          Logger.Error("Microphone and Webcam access in the browser will not work if you are not on HTTPS or localhost. Disabling mic and webcam access.");
          Logger.Error("For testing you can enable HTTP microphone access Chrome by visiting chrome://flags/ and enabling 'unsafely-treat-insecure-origin-as-secure'");
        }
        this.config.setOptionSettingOptions(OptionParameters.PreferredCodec, this.fuzzyIntersectUEAndBrowserCodecs(offer2));
        this.setupTransceiversAsync(useMic, useCamera).finally(() => {
          var _a2;
          (_a2 = this.peerConnection) === null || _a2 === void 0 ? void 0 : _a2.createAnswer().then((Answer) => {
            var _a3;
            Answer.sdp = this.mungeSDP(Answer.sdp, useMic);
            return (_a3 = this.peerConnection) === null || _a3 === void 0 ? void 0 : _a3.setLocalDescription(Answer);
          }).then(() => {
            var _a3;
            this.onSetLocalDescription((_a3 = this.peerConnection) === null || _a3 === void 0 ? void 0 : _a3.localDescription);
          }).catch((err) => {
            Logger.Error(`createAnswer() failed - ${err}`);
          });
        });
      });
    });
  }
  /**
   * Set the Remote Descriptor from the signaling server to the RTC Peer Connection
   * @param answer - RTC Session Descriptor from the Signaling Server
   */
  receiveAnswer(answer2) {
    var _a;
    (_a = this.peerConnection) === null || _a === void 0 ? void 0 : _a.setRemoteDescription(answer2);
    this.config.setOptionSettingOptions(OptionParameters.PreferredCodec, this.fuzzyIntersectUEAndBrowserCodecs(answer2));
  }
  /**
   * Generate Aggregated Stats and then fire a onVideo Stats event
   */
  generateStats() {
    this.peerConnection.getStats().then((statsData) => {
      this.aggregatedStats.processStats(statsData);
      this.onVideoStats(this.aggregatedStats);
      const latencyInfo = this.latencyCalculator.calculate(this.aggregatedStats, this.peerConnection.getReceivers());
      this.onLatencyCalculated(latencyInfo);
      if (this.updateCodecSelection && !!this.aggregatedStats.inboundVideoStats.codecId) {
        const codecStats = this.aggregatedStats.codecs.get(this.aggregatedStats.inboundVideoStats.codecId);
        if (codecStats === void 0) {
          return;
        }
        const codecShortname = codecStats.mimeType.replace("video/", "");
        let fullCodecName = codecShortname;
        if (codecStats.sdpFmtpLine && codecStats.sdpFmtpLine.trim() !== "") {
          fullCodecName = `${codecShortname} ${codecStats.sdpFmtpLine.trim()}`;
        }
        const allBrowserCodecs = this.config.getSettingOption(OptionParameters.PreferredCodec).options;
        if (allBrowserCodecs.includes(fullCodecName)) {
          this.config.setOptionSettingValue(OptionParameters.PreferredCodec, fullCodecName);
          return;
        }
        const filteredList = allBrowserCodecs.filter((option) => option.indexOf(codecShortname) !== -1);
        if (filteredList.length > 0) {
          this.config.setOptionSettingValue(OptionParameters.PreferredCodec, filteredList[0]);
          return;
        }
      }
    });
  }
  /**
   * Close The Peer Connection
   */
  close() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
  /**
   * Modify the Session Descriptor
   * @param sdp - Session Descriptor as a string
   * @param useMic - Is the microphone in use
   * @returns A modified Session Descriptor
   */
  mungeSDP(sdp, useMic) {
    let mungedSDP = sdp.replace(/(a=fmtp:\d+ .*level-asymmetry-allowed=.*)\r\n/gm, "$1;x-google-start-bitrate=10000;x-google-max-bitrate=100000\r\n");
    let audioSDP = "maxaveragebitrate=510000;";
    if (useMic) {
      audioSDP += "sprop-maxcapturerate=48000;";
    }
    audioSDP += this.config.isFlagEnabled(Flags.ForceMonoAudio) ? "stereo=0;" : "stereo=1;";
    audioSDP += "useinbandfec=1";
    mungedSDP = mungedSDP.replace("useinbandfec=1", audioSDP);
    if (this.config.isFlagEnabled(Flags.EnableCaptureTimeExt) && !this.isFirefox()) {
      mungedSDP = SDPUtils.addVideoHeaderExtensionToSdp(mungedSDP, kAbsCaptureTime);
    }
    return mungedSDP;
  }
  isFirefox() {
    return navigator.userAgent.indexOf("Firefox") > 0;
  }
  /**
   * When a Ice Candidate is received add to the RTC Peer Connection
   * @param iceCandidate - RTC Ice Candidate from the Signaling Server
   */
  handleOnIce(iceCandidate2) {
    var _a;
    Logger.Info("peerconnection handleOnIce");
    if (this.config.isFlagEnabled(Flags.ForceTURN)) {
      if (iceCandidate2.candidate.indexOf("relay") < 0) {
        Logger.Info(`Dropping candidate because it was not TURN relay. | Type= ${iceCandidate2.type} | Protocol= ${iceCandidate2.protocol} | Address=${iceCandidate2.address} | Port=${iceCandidate2.port} |`);
        return;
      }
    }
    (_a = this.peerConnection) === null || _a === void 0 ? void 0 : _a.addIceCandidate(iceCandidate2);
  }
  /**
   * When the RTC Peer Connection Signaling server state Changes
   * @param state - Signaling Server State Change Event
   */
  handleSignalStateChange(state) {
    Logger.Info("signaling state change: " + state);
  }
  /**
   * Handle when the Ice Connection State Changes
   * @param state - Ice Connection State
   */
  handleIceConnectionStateChange(state) {
    Logger.Info("ice connection state change: " + state);
    this.onIceConnectionStateChange(state);
  }
  /**
   * Handle when the Ice Gathering State Changes
   * @param state - Ice Gathering State Change
   */
  handleIceGatheringStateChange(state) {
    Logger.Info("ice gathering state change: " + JSON.stringify(state));
  }
  /**
   * Activates the onTrack method
   * @param event - The webRtc track event
   */
  handleOnTrack(event) {
    if (event.streams.length < 1 || event.streams[0].id == "probator") {
      return;
    }
    if (event.track.kind == "video") {
      this.videoTrack = event.track;
    }
    if (event.track.kind == "audio") {
      this.audioTrack = event.track;
    }
    this.onTrack(event);
  }
  /**
   * Activates the onPeerIceCandidate
   * @param event - The peer ice candidate
   */
  handleIceCandidate(event) {
    this.onPeerIceCandidate(event);
  }
  /**
   * Activates the onDataChannel
   * @param event - The peer's data channel
   */
  handleDataChannel(event) {
    this.onDataChannel(event);
  }
  /**
   * An override method for onTrack for use outside of the PeerConnectionController
   * @param trackEvent - The webRtc track event
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTrack(trackEvent) {
  }
  /**
   * An override method for onIceConnectionStateChange for use outside of the PeerConnectionController
   * @param event - The webRtc iceconnectionstatechange event
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onIceConnectionStateChange(event) {
  }
  /**
   * An override method for onPeerIceCandidate for use outside of the PeerConnectionController
   * @param peerConnectionIceEvent - The peer ice candidate
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPeerIceCandidate(peerConnectionIceEvent) {
  }
  /**
   * An override method for onDataChannel for use outside of the PeerConnectionController
   * @param datachannelEvent - The peer's data channel
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDataChannel(datachannelEvent) {
  }
  /**
   * Find the intersection between UE and browser codecs, with fuzzy matching if some parameters are mismatched.
   * @param sdp The remote sdp
   * @returns The intersection between browser supported codecs and ue supported codecs.
   */
  fuzzyIntersectUEAndBrowserCodecs(sdp) {
    const allSupportedCodecs = new Array();
    const allUECodecs = this.parseAvailableCodecs(sdp);
    const allBrowserCodecs = this.config.getSettingOption(OptionParameters.PreferredCodec).options;
    for (const ueCodec of allUECodecs) {
      if (allBrowserCodecs.includes(ueCodec)) {
        allSupportedCodecs.push(ueCodec);
        continue;
      } else {
        const ueCodecNameAndParams = ueCodec.split(" ");
        const ueCodecName = ueCodecNameAndParams[0];
        for (const browserCodec of allBrowserCodecs) {
          if (browserCodec.includes(ueCodecName)) {
            allSupportedCodecs.push(browserCodec);
            break;
          }
        }
      }
    }
    return allSupportedCodecs;
  }
  /**
   * Setup tracks on the RTC Peer Connection
   * @param useMic - is mic in use
   * @param useCamera - is webcam in use
   */
  setupTransceiversAsync(useMic, useCamera) {
    return __awaiter(this, void 0, void 0, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      let hasVideoReceiver = false;
      for (const transceiver of (_b = (_a = this.peerConnection) === null || _a === void 0 ? void 0 : _a.getTransceivers()) !== null && _b !== void 0 ? _b : []) {
        if (transceiver && transceiver.receiver && transceiver.receiver.track && transceiver.receiver.track.kind === "video") {
          hasVideoReceiver = true;
          break;
        }
      }
      if (!useCamera) {
        if (!hasVideoReceiver) {
          (_c = this.peerConnection) === null || _c === void 0 ? void 0 : _c.addTransceiver("video", { direction: "recvonly" });
        }
      } else {
        yield this.setupVideoSender(hasVideoReceiver);
      }
      if (RTCRtpReceiver.getCapabilities && this.preferredCodec != "") {
        for (const transceiver of (_e = (_d = this.peerConnection) === null || _d === void 0 ? void 0 : _d.getTransceivers()) !== null && _e !== void 0 ? _e : []) {
          if (transceiver && transceiver.receiver && transceiver.receiver.track && transceiver.receiver.track.kind === "video" && transceiver.setCodecPreferences) {
            const preferredRTPCodec = this.preferredCodec.split(" ");
            const preferredRTCRtpCodecCapability = {
              mimeType: "video/" + preferredRTPCodec[0],
              clockRate: 9e4,
              sdpFmtpLine: preferredRTPCodec[1] ? preferredRTPCodec[1] : ""
            };
            const ourSupportedCodecs = [preferredRTCRtpCodecCapability];
            RTCRtpReceiver.getCapabilities("video").codecs.forEach((browserSupportedCodec) => {
              if (browserSupportedCodec.mimeType != preferredRTCRtpCodecCapability.mimeType) {
                ourSupportedCodecs.push(browserSupportedCodec);
              } else if ((browserSupportedCodec === null || browserSupportedCodec === void 0 ? void 0 : browserSupportedCodec.sdpFmtpLine) != (preferredRTCRtpCodecCapability === null || preferredRTCRtpCodecCapability === void 0 ? void 0 : preferredRTCRtpCodecCapability.sdpFmtpLine)) {
                ourSupportedCodecs.push(browserSupportedCodec);
              }
            });
            for (const codec of ourSupportedCodecs) {
              if ((codec === null || codec === void 0 ? void 0 : codec.sdpFmtpLine) === void 0 || codec.sdpFmtpLine === "") {
                delete codec.sdpFmtpLine;
              }
            }
            transceiver.setCodecPreferences(ourSupportedCodecs);
          }
        }
      }
      let hasAudioReceiver = false;
      for (const transceiver of (_g = (_f = this.peerConnection) === null || _f === void 0 ? void 0 : _f.getTransceivers()) !== null && _g !== void 0 ? _g : []) {
        if (transceiver && transceiver.receiver && transceiver.receiver.track && transceiver.receiver.track.kind === "audio") {
          hasAudioReceiver = true;
          break;
        }
      }
      if (!useMic) {
        if (!hasAudioReceiver) {
          (_h = this.peerConnection) === null || _h === void 0 ? void 0 : _h.addTransceiver("audio", {
            direction: "recvonly"
          });
        }
      } else {
        yield this.setupAudioSender(hasAudioReceiver);
      }
    });
  }
  setupVideoSender(hasVideoReceiver) {
    return __awaiter(this, void 0, void 0, function* () {
      var _a, _b, _c, _d;
      const mediaSendOptions = {
        video: true
      };
      const stream = yield navigator.mediaDevices.getUserMedia(mediaSendOptions);
      if (stream) {
        if (hasVideoReceiver) {
          for (const transceiver of (_b = (_a = this.peerConnection) === null || _a === void 0 ? void 0 : _a.getTransceivers()) !== null && _b !== void 0 ? _b : []) {
            if (RTCUtils.canTransceiverReceiveVideo(transceiver)) {
              for (const track of stream.getTracks()) {
                if (track.kind && track.kind == "video") {
                  transceiver.sender.replaceTrack(track);
                  transceiver.direction = "sendrecv";
                }
              }
            }
          }
        } else {
          for (const track of stream.getTracks()) {
            if (track.kind && track.kind == "video") {
              (_c = this.peerConnection) === null || _c === void 0 ? void 0 : _c.addTransceiver(track, {
                direction: "sendrecv"
              });
            }
          }
        }
      } else {
        if (!hasVideoReceiver) {
          (_d = this.peerConnection) === null || _d === void 0 ? void 0 : _d.addTransceiver("video", { direction: "recvonly" });
        }
      }
    });
  }
  setupAudioSender(hasAudioReceiver) {
    return __awaiter(this, void 0, void 0, function* () {
      var _a, _b, _c, _d;
      const audioOptions = {
        autoGainControl: false,
        channelCount: 1,
        echoCancellation: false,
        latency: 0,
        noiseSuppression: false,
        sampleRate: 48e3,
        sampleSize: 16,
        volume: 1
      };
      const mediaSendOptions = {
        video: false,
        audio: audioOptions
      };
      const stream = yield navigator.mediaDevices.getUserMedia(mediaSendOptions);
      if (stream) {
        if (hasAudioReceiver) {
          for (const transceiver of (_b = (_a = this.peerConnection) === null || _a === void 0 ? void 0 : _a.getTransceivers()) !== null && _b !== void 0 ? _b : []) {
            if (RTCUtils.canTransceiverReceiveAudio(transceiver)) {
              for (const track of stream.getTracks()) {
                if (track.kind && track.kind == "audio") {
                  transceiver.sender.replaceTrack(track);
                  transceiver.direction = "sendrecv";
                }
              }
            }
          }
        } else {
          for (const track of stream.getTracks()) {
            if (track.kind && track.kind == "audio") {
              (_c = this.peerConnection) === null || _c === void 0 ? void 0 : _c.addTransceiver(track, {
                direction: "sendrecv"
              });
            }
          }
        }
      } else {
        if (!hasAudioReceiver) {
          (_d = this.peerConnection) === null || _d === void 0 ? void 0 : _d.addTransceiver("audio", {
            direction: "recvonly"
          });
        }
      }
    });
  }
  /**
   * And override event for when the video stats are fired
   * @param event - Aggregated Stats
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onVideoStats(event) {
  }
  /**
   * And override event for when latency info is calculated
   * @param latencyInfo - Calculated latency information.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onLatencyCalculated(latencyInfo) {
  }
  /**
   * Event to send the RTC offer to the Signaling server
   * @param offer - RTC Offer
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSendWebRTCOffer(offer2) {
  }
  /**
   * Event fired when remote offer description is set.
   * @param offer - RTC Offer
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSetRemoteDescription(offer2) {
  }
  /**
   * Event fire when local description answer is set.
   * @param answer - RTC Answer
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSetLocalDescription(answer2) {
  }
  /**
   * An override for showing the Peer connection connecting Overlay
   */
  showTextOverlayConnecting() {
  }
  /**
   * An override for showing the Peer connection Failed overlay
   */
  showTextOverlaySetupFailure() {
  }
  parseAvailableCodecs(rtcSessionDescription) {
    if (!RTCRtpReceiver.getCapabilities)
      return ["Only available on Chrome"];
    const ueSupportedCodecs = [];
    const sections = (0, import_sdp.splitSections)(rtcSessionDescription.sdp);
    sections.shift();
    sections.forEach((mediaSection) => {
      const { codecs } = (0, import_sdp.parseRtpParameters)(mediaSection);
      const matcher = /(VP\d|H26\d|AV1).*/;
      codecs.forEach((c) => {
        const str = c.name + " " + Object.keys(c.parameters || {}).map((p) => p + "=" + c.parameters[p]).join(";");
        const match = matcher.exec(str);
        if (match !== null) {
          if (c.name == "VP9") {
            c.parameters = {
              "profile-id": "0"
            };
          }
          const codecStr = c.name + " " + Object.keys(c.parameters || {}).map((p) => p + "=" + c.parameters[p]).join(";");
          ueSupportedCodecs.push(codecStr);
        }
      });
    });
    return ueSupportedCodecs;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/DataChannel/InitialSettings.js
var InitialSettings = class {
  constructor() {
    this.PixelStreamingSettings = new PixelStreamingSettings();
    this.EncoderSettings = new EncoderSettings();
    this.WebRTCSettings = new WebRTCSettings();
  }
  /**
   * Checks for compatibility with the FPS and MaxFPS stats between 4.27 and 5
   */
  ueCompatible() {
    if (this.WebRTCSettings.MaxFPS != null) {
      this.WebRTCSettings.FPS = this.WebRTCSettings.MaxFPS;
    }
  }
};
var PixelStreamingSettings = class {
};
var EncoderSettings = class {
};
var WebRTCSettings = class {
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/DataChannel/LatencyTestResults.js
var LatencyTestResults = class {
  constructor() {
    this.ReceiptTimeMs = null;
    this.TransmissionTimeMs = null;
    this.PreCaptureTimeMs = null;
    this.PostCaptureTimeMs = null;
    this.PreEncodeTimeMs = null;
    this.PostEncodeTimeMs = null;
    this.EncodeMs = null;
    this.CaptureToSendMs = null;
    this.testStartTimeMs = 0;
    this.browserReceiptTimeMs = 0;
    this.latencyExcludingDecode = 0;
    this.testDuration = 0;
    this.networkLatency = 0;
    this.browserSendLatency = 0;
    this.frameDisplayDeltaTimeMs = 0;
    this.endToEndLatency = 0;
    this.encodeLatency = 0;
  }
  /**
   * Sets the Delta Time Milliseconds
   * @param DeltaTimeMs - Delta Time Milliseconds
   */
  setFrameDisplayDeltaTime(DeltaTimeMs) {
    if (this.frameDisplayDeltaTimeMs == 0) {
      this.frameDisplayDeltaTimeMs = Math.round(DeltaTimeMs);
    }
  }
  /**
   * Process the encoder times and set them
   */
  processFields() {
    if (this.EncodeMs == null && (this.PreEncodeTimeMs != null || this.PostEncodeTimeMs != null)) {
      Logger.Info(`Setting Encode Ms 
 ${this.PostEncodeTimeMs} 
 ${this.PreEncodeTimeMs}`);
      this.EncodeMs = this.PostEncodeTimeMs - this.PreEncodeTimeMs;
    }
    if (this.CaptureToSendMs == null && (this.PreCaptureTimeMs != null || this.PostCaptureTimeMs != null)) {
      Logger.Info(`Setting CaptureToSendMs Ms 
 ${this.PostCaptureTimeMs} 
 ${this.PreCaptureTimeMs}`);
      this.CaptureToSendMs = this.PostCaptureTimeMs - this.PreCaptureTimeMs;
    }
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Util/FileUtil.js
var FileUtil = class {
  /**
   * Processes a files extension when received over data channel
   * @param view - the file extension data
   */
  static setExtensionFromBytes(view, file) {
    if (!file.receiving) {
      file.mimetype = "";
      file.extension = "";
      file.receiving = true;
      file.valid = false;
      file.chunks = 0;
      file.data = [];
      file.timestampStart = (/* @__PURE__ */ new Date()).getTime();
      Logger.Info("Received first chunk of file");
    }
    const extensionAsString = new TextDecoder("utf-16").decode(view.slice(1));
    Logger.Info(extensionAsString);
    file.extension = extensionAsString;
  }
  /**
   * Processes a files mime type when received over data channel
   * @param view - the file mime type data
   */
  static setMimeTypeFromBytes(view, file) {
    if (!file.receiving) {
      file.mimetype = "";
      file.extension = "";
      file.receiving = true;
      file.valid = false;
      file.chunks = 0;
      file.data = [];
      file.timestampStart = (/* @__PURE__ */ new Date()).getTime();
      Logger.Info("Received first chunk of file");
    }
    const mimeAsString = new TextDecoder("utf-16").decode(view.slice(1));
    Logger.Info(mimeAsString);
    file.mimetype = mimeAsString;
  }
  /**
   * Processes a files contents when received over data channel
   * @param view - the file contents data
   */
  static setContentsFromBytes(view, file) {
    if (!file.receiving)
      return;
    const typeSize = 1;
    const intSize = 4;
    const maxMessageSize = 16 * 1024;
    const headerSize = typeSize + intSize;
    const maxPayloadSize = maxMessageSize - headerSize;
    file.chunks = Math.ceil(new DataView(view.slice(typeSize, headerSize).buffer).getInt32(0, true) / maxPayloadSize);
    const fileBytes = view.slice(headerSize);
    file.data.push(fileBytes);
    Logger.Info(`Received file chunk: ${file.data.length}/${file.chunks}`);
    if (file.data.length === file.chunks) {
      file.receiving = false;
      file.valid = true;
      Logger.Info("Received complete file");
      const transferDuration = (/* @__PURE__ */ new Date()).getTime() - file.timestampStart;
      const transferBitrate = Math.round(file.chunks * maxMessageSize / transferDuration);
      Logger.Info(`Average transfer bitrate: ${transferBitrate}kb/s over ${transferDuration / 1e3} seconds`);
    } else if (file.data.length > file.chunks) {
      file.receiving = false;
      Logger.Error(`Received bigger file than advertised: ${file.data.length}/${file.chunks}`);
    }
  }
};
var FileTemplate = class {
  constructor() {
    this.mimetype = "";
    this.extension = "";
    this.receiving = false;
    this.chunks = 0;
    this.data = [];
    this.valid = false;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Inputs/SpecialKeyCodes.js
var SpecialKeyCodes = class {
};
SpecialKeyCodes.backSpace = 8;
SpecialKeyCodes.shift = 16;
SpecialKeyCodes.control = 17;
SpecialKeyCodes.alt = 18;
SpecialKeyCodes.rightShift = 253;
SpecialKeyCodes.rightControl = 254;
SpecialKeyCodes.rightAlt = 255;

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Inputs/KeyCodes.js
var CodeToKeyCode = Object.freeze({
  Escape: 27,
  Digit0: 48,
  Digit1: 49,
  Digit2: 50,
  Digit3: 51,
  Digit4: 52,
  Digit5: 53,
  Digit6: 54,
  Digit7: 55,
  Digit8: 56,
  Digit9: 57,
  Minus: 173,
  Equal: 187,
  Backspace: 8,
  Tab: 9,
  KeyQ: 81,
  KeyW: 87,
  KeyE: 69,
  KeyR: 82,
  KeyT: 84,
  KeyY: 89,
  KeyU: 85,
  KeyI: 73,
  KeyO: 79,
  KeyP: 80,
  BracketLeft: 219,
  BracketRight: 221,
  Enter: 13,
  ControlLeft: 17,
  KeyA: 65,
  KeyS: 83,
  KeyD: 68,
  KeyF: 70,
  KeyG: 71,
  KeyH: 72,
  KeyJ: 74,
  KeyK: 75,
  KeyL: 76,
  Semicolon: 186,
  Quote: 222,
  Backquote: 192,
  ShiftLeft: 16,
  Backslash: 220,
  KeyZ: 90,
  KeyX: 88,
  KeyC: 67,
  KeyV: 86,
  KeyB: 66,
  KeyN: 78,
  KeyM: 77,
  Comma: 188,
  Period: 190,
  Slash: 191,
  ShiftRight: 253,
  AltLeft: 18,
  Space: 32,
  CapsLock: 20,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  Pause: 19,
  ScrollLock: 145,
  NumpadDivide: 111,
  NumpadMultiply: 106,
  NumpadSubtract: 109,
  NumpadAdd: 107,
  NumpadDecimal: 110,
  Numpad9: 105,
  Numpad8: 104,
  Numpad7: 103,
  Numpad6: 102,
  Numpad5: 101,
  Numpad4: 100,
  Numpad3: 99,
  Numpad2: 98,
  Numpad1: 97,
  Numpad0: 96,
  NumLock: 144,
  ControlRight: 254,
  AltRight: 255,
  Home: 36,
  End: 35,
  ArrowUp: 38,
  ArrowLeft: 37,
  ArrowRight: 39,
  ArrowDown: 40,
  PageUp: 33,
  PageDown: 34,
  Insert: 45,
  Delete: 46,
  ContextMenu: 93
});

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Inputs/KeyboardController.js
var KeyboardController = class {
  constructor(streamMessageController, config2, activeKeys) {
    this.streamMessageController = streamMessageController;
    this.config = config2;
    this.activeKeys = activeKeys;
    this.onKeyDownListener = this.handleOnKeyDown.bind(this);
    this.onKeyUpListener = this.handleOnKeyUp.bind(this);
    this.onKeyPressListener = this.handleOnKeyPress.bind(this);
  }
  register() {
    document.addEventListener("keydown", this.onKeyDownListener);
    document.addEventListener("keyup", this.onKeyUpListener);
    document.addEventListener("keypress", this.onKeyPressListener);
  }
  unregister() {
    document.removeEventListener("keydown", this.onKeyDownListener);
    document.removeEventListener("keyup", this.onKeyUpListener);
    document.removeEventListener("keypress", this.onKeyPressListener);
  }
  handleOnKeyDown(keyboardEvent) {
    var _a;
    const keyCode = this.getKeycode(keyboardEvent);
    if (!keyCode || keyCode === 229) {
      return;
    }
    const toStreamerHandlers = this.streamMessageController.toStreamerHandlers;
    (_a = toStreamerHandlers.get("KeyDown")) === null || _a === void 0 ? void 0 : _a([this.getKeycode(keyboardEvent), keyboardEvent.repeat ? 1 : 0]);
    const activeKeys = this.activeKeys.getActiveKeys();
    activeKeys.push(keyCode);
    if (keyCode === SpecialKeyCodes.backSpace) {
      this.handleOnKeyPress(new KeyboardEvent("keypress", {
        charCode: SpecialKeyCodes.backSpace,
        keyCode: SpecialKeyCodes.backSpace
      }));
    }
    if (this.config.isFlagEnabled(Flags.SuppressBrowserKeys) && this.isKeyCodeBrowserKey(keyCode)) {
      keyboardEvent.preventDefault();
    }
  }
  handleOnKeyUp(keyboardEvent) {
    var _a;
    const keyCode = this.getKeycode(keyboardEvent);
    if (!keyCode) {
      return;
    }
    const toStreamerHandlers = this.streamMessageController.toStreamerHandlers;
    (_a = toStreamerHandlers.get("KeyUp")) === null || _a === void 0 ? void 0 : _a([keyCode]);
    if (this.config.isFlagEnabled(Flags.SuppressBrowserKeys) && this.isKeyCodeBrowserKey(keyCode)) {
      keyboardEvent.preventDefault();
    }
  }
  handleOnKeyPress(keyboardEvent) {
    var _a;
    const keyCode = this.getKeycode(keyboardEvent);
    if (!keyCode) {
      return;
    }
    const toStreamerHandlers = this.streamMessageController.toStreamerHandlers;
    (_a = toStreamerHandlers.get("KeyPress")) === null || _a === void 0 ? void 0 : _a([keyCode]);
  }
  /**
   * Gets the Keycode of the Key pressed
   * @param keyboardEvent - Key board Event
   * @returns - the key code of the Key
   */
  getKeycode(keyboardEvent) {
    if (!("keyCode" in keyboardEvent)) {
      const event = keyboardEvent;
      if (event.code in CodeToKeyCode) {
        return CodeToKeyCode[event.code];
      } else {
        Logger.Warning(`Keyboard code of ${event.code} is not supported in our mapping, ignoring this key.`);
        return null;
      }
    }
    if (keyboardEvent.keyCode === SpecialKeyCodes.shift && keyboardEvent.code === "ShiftRight") {
      return SpecialKeyCodes.rightShift;
    } else if (keyboardEvent.keyCode === SpecialKeyCodes.control && keyboardEvent.code === "ControlRight") {
      return SpecialKeyCodes.rightControl;
    } else if (keyboardEvent.keyCode === SpecialKeyCodes.alt && keyboardEvent.code === "AltRight") {
      return SpecialKeyCodes.rightAlt;
    } else {
      return keyboardEvent.keyCode;
    }
  }
  /**
   * Browser keys do not have a charCode so we only need to test keyCode.
   * @param keyCode - the browser keycode number
   */
  isKeyCodeBrowserKey(keyCode) {
    return keyCode >= 112 && keyCode <= 123 || keyCode === 9;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Inputs/MouseButtons.js
var MouseButton = class {
};
MouseButton.mainButton = 0;
MouseButton.auxiliaryButton = 1;
MouseButton.secondaryButton = 2;
MouseButton.fourthButton = 3;
MouseButton.fifthButton = 4;
var MouseButtonsMask = class {
};
MouseButtonsMask.primaryButton = 1;
MouseButtonsMask.secondaryButton = 2;
MouseButtonsMask.auxiliaryButton = 4;
MouseButtonsMask.fourthButton = 8;
MouseButtonsMask.fifthButton = 16;

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Inputs/MouseController.js
var MouseController = class {
  constructor(streamMessageController, videoPlayer, coordinateConverter, activeKeys) {
    this.streamMessageController = streamMessageController;
    this.coordinateConverter = coordinateConverter;
    this.videoPlayer = videoPlayer;
    this.activeKeys = activeKeys;
    this.onEnterListener = this.onMouseEnter.bind(this);
    this.onLeaveListener = this.onMouseLeave.bind(this);
  }
  register() {
    this.registerMouseEnterAndLeaveEvents();
  }
  unregister() {
    this.unregisterMouseEnterAndLeaveEvents();
  }
  registerMouseEnterAndLeaveEvents() {
    const videoElementParent = this.videoPlayer.getVideoParentElement();
    videoElementParent === null || videoElementParent === void 0 ? void 0 : videoElementParent.addEventListener("mouseenter", this.onEnterListener);
    videoElementParent === null || videoElementParent === void 0 ? void 0 : videoElementParent.addEventListener("mouseleave", this.onLeaveListener);
  }
  unregisterMouseEnterAndLeaveEvents() {
    const videoElementParent = this.videoPlayer.getVideoParentElement();
    videoElementParent === null || videoElementParent === void 0 ? void 0 : videoElementParent.removeEventListener("mouseenter", this.onEnterListener);
    videoElementParent === null || videoElementParent === void 0 ? void 0 : videoElementParent.removeEventListener("mouseleave", this.onLeaveListener);
  }
  onMouseEnter(event) {
    var _a;
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    (_a = this.streamMessageController.toStreamerHandlers.get("MouseEnter")) === null || _a === void 0 ? void 0 : _a();
    this.pressMouseButtons(event.buttons, event.x, event.y);
  }
  onMouseLeave(event) {
    var _a;
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    (_a = this.streamMessageController.toStreamerHandlers.get("MouseLeave")) === null || _a === void 0 ? void 0 : _a();
    this.releaseMouseButtons(event.buttons, event.x, event.y);
  }
  releaseMouseButtons(buttons, X, Y) {
    const coord = this.coordinateConverter.translateUnsigned(X, Y);
    if (buttons & MouseButtonsMask.primaryButton) {
      this.sendMouseUp(MouseButton.mainButton, coord.x, coord.y);
    }
    if (buttons & MouseButtonsMask.secondaryButton) {
      this.sendMouseUp(MouseButton.secondaryButton, coord.x, coord.y);
    }
    if (buttons & MouseButtonsMask.auxiliaryButton) {
      this.sendMouseUp(MouseButton.auxiliaryButton, coord.x, coord.y);
    }
    if (buttons & MouseButtonsMask.fourthButton) {
      this.sendMouseUp(MouseButton.fourthButton, coord.x, coord.y);
    }
    if (buttons & MouseButtonsMask.fifthButton) {
      this.sendMouseUp(MouseButton.fifthButton, coord.x, coord.y);
    }
  }
  pressMouseButtons(buttons, X, Y) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    const coord = this.coordinateConverter.translateUnsigned(X, Y);
    if (buttons & MouseButtonsMask.primaryButton) {
      this.sendMouseDown(MouseButton.mainButton, coord.x, coord.y);
    }
    if (buttons & MouseButtonsMask.secondaryButton) {
      this.sendMouseDown(MouseButton.secondaryButton, coord.x, coord.y);
    }
    if (buttons & MouseButtonsMask.auxiliaryButton) {
      this.sendMouseDown(MouseButton.auxiliaryButton, coord.x, coord.y);
    }
    if (buttons & MouseButtonsMask.fourthButton) {
      this.sendMouseDown(MouseButton.fourthButton, coord.x, coord.y);
    }
    if (buttons & MouseButtonsMask.fifthButton) {
      this.sendMouseDown(MouseButton.fifthButton, coord.x, coord.y);
    }
  }
  sendMouseDown(button, X, Y) {
    var _a;
    (_a = this.streamMessageController.toStreamerHandlers.get("MouseDown")) === null || _a === void 0 ? void 0 : _a([button, X, Y]);
  }
  sendMouseUp(button, X, Y) {
    var _a;
    const coord = this.coordinateConverter.translateUnsigned(X, Y);
    (_a = this.streamMessageController.toStreamerHandlers.get("MouseUp")) === null || _a === void 0 ? void 0 : _a([button, coord.x, coord.y]);
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Inputs/MouseControllerLocked.js
var MouseControllerLocked = class extends MouseController {
  constructor(streamMessageController, videoPlayer, coordinateConverter, activeKeys) {
    super(streamMessageController, videoPlayer, coordinateConverter, activeKeys);
    this.videoElementParent = videoPlayer.getVideoParentElement();
    this.x = this.videoElementParent.getBoundingClientRect().width / 2;
    this.y = this.videoElementParent.getBoundingClientRect().height / 2;
    this.normalizedCoord = this.coordinateConverter.translateUnsigned(this.x, this.y);
    this.onRequestLockListener = this.onRequestLock.bind(this);
    this.onLockStateChangeListener = this.onLockStateChange.bind(this);
    this.onMouseUpListener = this.onMouseUp.bind(this);
    this.onMouseDownListener = this.onMouseDown.bind(this);
    this.onMouseDblClickListener = this.onMouseDblClick.bind(this);
    this.onMouseWheelListener = this.onMouseWheel.bind(this);
    this.onMouseMoveListener = this.onMouseMove.bind(this);
  }
  register() {
    super.register();
    this.videoElementParent.requestPointerLock = this.videoElementParent.requestPointerLock || this.videoElementParent.mozRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
    if (this.videoElementParent.requestPointerLock) {
      this.videoElementParent.addEventListener("click", this.onRequestLockListener);
    }
    document.addEventListener("pointerlockchange", this.onLockStateChangeListener);
    document.addEventListener("mozpointerlockchange", this.onLockStateChangeListener);
    this.videoElementParent.addEventListener("mousedown", this.onMouseDownListener);
    this.videoElementParent.addEventListener("mouseup", this.onMouseUpListener);
    this.videoElementParent.addEventListener("wheel", this.onMouseWheelListener);
    this.videoElementParent.addEventListener("dblclick", this.onMouseDblClickListener);
  }
  unregister() {
    const pointerLockElement = document.pointerLockElement || document.mozPointerLockElement;
    if (document.exitPointerLock && pointerLockElement === this.videoElementParent) {
      document.exitPointerLock();
    }
    this.videoElementParent.removeEventListener("click", this.onRequestLockListener);
    document.removeEventListener("pointerlockchange", this.onLockStateChangeListener);
    document.removeEventListener("mozpointerlockchange", this.onLockStateChangeListener);
    document.removeEventListener("mousemove", this.onMouseMoveListener);
    this.videoElementParent.removeEventListener("mousedown", this.onMouseDownListener);
    this.videoElementParent.removeEventListener("mouseup", this.onMouseUpListener);
    this.videoElementParent.removeEventListener("wheel", this.onMouseWheelListener);
    this.videoElementParent.removeEventListener("dblclick", this.onMouseDblClickListener);
    super.unregister();
  }
  onRequestLock() {
    this.videoElementParent.requestPointerLock();
  }
  onLockStateChange() {
    const pointerLockElement = document.pointerLockElement || document.mozPointerLockElement;
    if (pointerLockElement === this.videoElementParent) {
      Logger.Info("Pointer locked");
      document.addEventListener("mousemove", this.onMouseMoveListener);
    } else {
      Logger.Info("The pointer lock status is now unlocked");
      document.removeEventListener("mousemove", this.onMouseMoveListener);
      const activeKeys = this.activeKeys.getActiveKeys();
      activeKeys.forEach((key) => {
        this.streamMessageController.toStreamerHandlers.get("KeyUp")([key]);
      });
    }
  }
  onMouseDown(event) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    this.streamMessageController.toStreamerHandlers.get("MouseDown")([
      event.button,
      // We use the store value of this.coord as opposed to the mouseEvent.x/y as the mouseEvent location
      // uses the system cursor location which hasn't moved
      this.normalizedCoord.x,
      this.normalizedCoord.y
    ]);
  }
  onMouseUp(event) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    this.streamMessageController.toStreamerHandlers.get("MouseUp")([
      event.button,
      // We use the store value of this.coord as opposed to the mouseEvent.x/y as the mouseEvent location
      // uses the system cursor location which hasn't moved
      this.normalizedCoord.x,
      this.normalizedCoord.y
    ]);
  }
  onMouseMove(event) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    const styleWidth = this.videoPlayer.getVideoParentElement().clientWidth;
    const styleHeight = this.videoPlayer.getVideoParentElement().clientHeight;
    this.x += event.movementX;
    this.y += event.movementY;
    while (this.x > styleWidth) {
      this.x -= styleWidth;
    }
    while (this.y > styleHeight) {
      this.y -= styleHeight;
    }
    while (this.x < 0) {
      this.x += styleWidth;
    }
    while (this.y < 0) {
      this.y += styleHeight;
    }
    this.normalizedCoord = this.coordinateConverter.translateUnsigned(this.x, this.y);
    const delta = this.coordinateConverter.translateSigned(event.movementX, event.movementY);
    this.streamMessageController.toStreamerHandlers.get("MouseMove")([
      this.normalizedCoord.x,
      this.normalizedCoord.y,
      delta.x,
      delta.y
    ]);
  }
  onMouseWheel(event) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    this.streamMessageController.toStreamerHandlers.get("MouseWheel")([
      event.wheelDelta,
      // We use the store value of this.coord as opposed to the mouseEvent.x/y as the mouseEvent location
      // uses the system cursor location which hasn't moved
      this.normalizedCoord.x,
      this.normalizedCoord.y
    ]);
  }
  onMouseDblClick(event) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    this.streamMessageController.toStreamerHandlers.get("MouseDouble")([
      event.button,
      // We use the store value of this.coord as opposed to the mouseEvent.x/y as the mouseEvent location
      // uses the system cursor location which hasn't moved
      this.normalizedCoord.x,
      this.normalizedCoord.y
    ]);
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Inputs/MouseControllerHovering.js
var MouseControllerHovering = class extends MouseController {
  constructor(streamMessageController, videoPlayer, coordinateConverter, activeKeys) {
    super(streamMessageController, videoPlayer, coordinateConverter, activeKeys);
    this.videoElementParent = videoPlayer.getVideoParentElement();
    this.onMouseUpListener = this.onMouseUp.bind(this);
    this.onMouseDownListener = this.onMouseDown.bind(this);
    this.onMouseDblClickListener = this.onMouseDblClick.bind(this);
    this.onMouseWheelListener = this.onMouseWheel.bind(this);
    this.onMouseMoveListener = this.onMouseMove.bind(this);
    this.onContextMenuListener = this.onContextMenu.bind(this);
  }
  register() {
    super.register();
    this.videoElementParent.addEventListener("mousemove", this.onMouseMoveListener);
    this.videoElementParent.addEventListener("mousedown", this.onMouseDownListener);
    this.videoElementParent.addEventListener("mouseup", this.onMouseUpListener);
    this.videoElementParent.addEventListener("contextmenu", this.onContextMenuListener);
    this.videoElementParent.addEventListener("wheel", this.onMouseWheelListener);
    this.videoElementParent.addEventListener("dblclick", this.onMouseDblClickListener);
  }
  unregister() {
    this.videoElementParent.removeEventListener("mousemove", this.onMouseMoveListener);
    this.videoElementParent.removeEventListener("mousedown", this.onMouseDownListener);
    this.videoElementParent.removeEventListener("mouseup", this.onMouseUpListener);
    this.videoElementParent.removeEventListener("contextmenu", this.onContextMenuListener);
    this.videoElementParent.removeEventListener("wheel", this.onMouseWheelListener);
    this.videoElementParent.removeEventListener("dblclick", this.onMouseDblClickListener);
    super.unregister();
  }
  onMouseDown(event) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    const coord = this.coordinateConverter.translateUnsigned(event.offsetX, event.offsetY);
    this.streamMessageController.toStreamerHandlers.get("MouseDown")([event.button, coord.x, coord.y]);
    event.preventDefault();
  }
  onMouseUp(event) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    const coord = this.coordinateConverter.translateUnsigned(event.offsetX, event.offsetY);
    this.streamMessageController.toStreamerHandlers.get("MouseUp")([event.button, coord.x, coord.y]);
    event.preventDefault();
  }
  onContextMenu(event) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    event.preventDefault();
  }
  onMouseMove(event) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    const coord = this.coordinateConverter.translateUnsigned(event.offsetX, event.offsetY);
    const delta = this.coordinateConverter.translateSigned(event.movementX, event.movementY);
    this.streamMessageController.toStreamerHandlers.get("MouseMove")([
      coord.x,
      coord.y,
      delta.x,
      delta.y
    ]);
    event.preventDefault();
  }
  onMouseWheel(event) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    const coord = this.coordinateConverter.translateUnsigned(event.offsetX, event.offsetY);
    this.streamMessageController.toStreamerHandlers.get("MouseWheel")([
      event.wheelDelta,
      coord.x,
      coord.y
    ]);
    event.preventDefault();
  }
  onMouseDblClick(event) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    const coord = this.coordinateConverter.translateUnsigned(event.offsetX, event.offsetY);
    this.streamMessageController.toStreamerHandlers.get("MouseDouble")([event.button, coord.x, coord.y]);
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Inputs/TouchController.js
var TouchController = class {
  constructor(streamMessageController, videoPlayer, coordinateConverter) {
    this.fingers = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    this.fingerIds = /* @__PURE__ */ new Map();
    this.maxByteValue = 255;
    this.streamMessageController = streamMessageController;
    this.videoPlayer = videoPlayer;
    this.coordinateConverter = coordinateConverter;
    this.videoElementParent = videoPlayer.getVideoElement();
    this.onTouchStartListener = this.onTouchStart.bind(this);
    this.onTouchEndListener = this.onTouchEnd.bind(this);
    this.onTouchMoveListener = this.onTouchMove.bind(this);
  }
  register() {
    this.videoElementParent.addEventListener("touchstart", this.onTouchStartListener);
    this.videoElementParent.addEventListener("touchend", this.onTouchEndListener);
    this.videoElementParent.addEventListener("touchmove", this.onTouchMoveListener);
  }
  unregister() {
    this.videoElementParent.removeEventListener("touchstart", this.onTouchStartListener);
    this.videoElementParent.removeEventListener("touchend", this.onTouchEndListener);
    this.videoElementParent.removeEventListener("touchmove", this.onTouchMoveListener);
  }
  rememberTouch(touch) {
    const finger = this.fingers.pop();
    if (finger === void 0) {
      Logger.Info("exhausted touch identifiers");
    }
    this.fingerIds.set(touch.identifier, finger);
  }
  forgetTouch(touch) {
    this.fingers.push(this.fingerIds.get(touch.identifier));
    this.fingers.sort(function(a, b) {
      return b - a;
    });
    this.fingerIds.delete(touch.identifier);
  }
  onTouchStart(touchEvent) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    for (let t = 0; t < touchEvent.changedTouches.length; t++) {
      this.rememberTouch(touchEvent.changedTouches[t]);
    }
    this.emitTouchData("TouchStart", touchEvent.changedTouches);
    touchEvent.preventDefault();
  }
  onTouchEnd(touchEvent) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    this.emitTouchData("TouchEnd", touchEvent.changedTouches);
    for (let t = 0; t < touchEvent.changedTouches.length; t++) {
      this.forgetTouch(touchEvent.changedTouches[t]);
    }
    touchEvent.preventDefault();
  }
  onTouchMove(touchEvent) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    this.emitTouchData("TouchMove", touchEvent.touches);
    touchEvent.preventDefault();
  }
  emitTouchData(type, touches) {
    if (!this.videoPlayer.isVideoReady()) {
      return;
    }
    const offset = this.videoPlayer.getVideoParentElement().getBoundingClientRect();
    const toStreamerHandlers = this.streamMessageController.toStreamerHandlers;
    for (let t = 0; t < touches.length; t++) {
      const numTouches = 1;
      const touch = touches[t];
      const x = touch.clientX - offset.left;
      const y = touch.clientY - offset.top;
      Logger.Info(`F${this.fingerIds.get(touch.identifier)}=(${x}, ${y})`);
      const coord = this.coordinateConverter.translateUnsigned(x, y);
      switch (type) {
        case "TouchStart":
          toStreamerHandlers.get("TouchStart")([
            numTouches,
            coord.x,
            coord.y,
            this.fingerIds.get(touch.identifier),
            this.maxByteValue * (touch.force > 0 ? touch.force : 1),
            coord.inRange ? 1 : 0
          ]);
          break;
        case "TouchEnd":
          toStreamerHandlers.get("TouchEnd")([
            numTouches,
            coord.x,
            coord.y,
            this.fingerIds.get(touch.identifier),
            this.maxByteValue * touch.force,
            coord.inRange ? 1 : 0
          ]);
          break;
        case "TouchMove":
          toStreamerHandlers.get("TouchMove")([
            numTouches,
            coord.x,
            coord.y,
            this.fingerIds.get(touch.identifier),
            this.maxByteValue * (touch.force > 0 ? touch.force : 1),
            coord.inRange ? 1 : 0
          ]);
          break;
      }
    }
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Inputs/TouchControllerFake.js
var TouchControllerFake = class {
  constructor(streamMessageController, videoPlayer, coordinateConverter) {
    this.streamMessageController = streamMessageController;
    this.videoPlayer = videoPlayer;
    this.coordinateConverter = coordinateConverter;
    this.onTouchStartListener = this.onTouchStart.bind(this);
    this.onTouchEndListener = this.onTouchEnd.bind(this);
    this.onTouchMoveListener = this.onTouchMove.bind(this);
    this.videoElementParentClientRect = this.videoPlayer.getVideoParentElement().getBoundingClientRect();
  }
  register() {
    document.addEventListener("touchstart", this.onTouchStartListener);
    document.addEventListener("touchend", this.onTouchEndListener);
    document.addEventListener("touchmove", this.onTouchMoveListener);
  }
  unregister() {
    document.removeEventListener("touchstart", this.onTouchStartListener);
    document.removeEventListener("touchend", this.onTouchEndListener);
    document.removeEventListener("touchmove", this.onTouchMoveListener);
  }
  onTouchStart(touch) {
    if (!this.videoPlayer.isVideoReady() || touch.target !== this.videoPlayer.getVideoElement()) {
      return;
    }
    if (this.fakeTouchFinger == null) {
      const first_touch = touch.changedTouches[0];
      this.fakeTouchFinger = {
        id: first_touch.identifier,
        x: first_touch.clientX - this.videoElementParentClientRect.left,
        y: first_touch.clientY - this.videoElementParentClientRect.top
      };
      const videoElementParent = this.videoPlayer.getVideoParentElement();
      const mouseEvent = new MouseEvent("mouseenter", first_touch);
      videoElementParent.dispatchEvent(mouseEvent);
      const coord = this.coordinateConverter.translateUnsigned(this.fakeTouchFinger.x, this.fakeTouchFinger.y);
      const toStreamerHandlers = this.streamMessageController.toStreamerHandlers;
      toStreamerHandlers.get("MouseDown")([MouseButton.mainButton, coord.x, coord.y]);
    }
    touch.preventDefault();
  }
  onTouchEnd(touchEvent) {
    if (!this.videoPlayer.isVideoReady() || this.fakeTouchFinger == null) {
      return;
    }
    const videoElementParent = this.videoPlayer.getVideoParentElement();
    const toStreamerHandlers = this.streamMessageController.toStreamerHandlers;
    for (let t = 0; t < touchEvent.changedTouches.length; t++) {
      const touch = touchEvent.changedTouches[t];
      if (touch.identifier === this.fakeTouchFinger.id) {
        const x = touch.clientX - this.videoElementParentClientRect.left;
        const y = touch.clientY - this.videoElementParentClientRect.top;
        const coord = this.coordinateConverter.translateUnsigned(x, y);
        toStreamerHandlers.get("MouseUp")([MouseButton.mainButton, coord.x, coord.y]);
        const mouseEvent = new MouseEvent("mouseleave", touch);
        videoElementParent.dispatchEvent(mouseEvent);
        this.fakeTouchFinger = null;
        break;
      }
    }
    touchEvent.preventDefault();
  }
  onTouchMove(touchEvent) {
    if (!this.videoPlayer.isVideoReady() || this.fakeTouchFinger == null) {
      return;
    }
    const toStreamerHandlers = this.streamMessageController.toStreamerHandlers;
    for (let t = 0; t < touchEvent.touches.length; t++) {
      const touch = touchEvent.touches[t];
      if (touch.identifier === this.fakeTouchFinger.id) {
        const x = touch.clientX - this.videoElementParentClientRect.left;
        const y = touch.clientY - this.videoElementParentClientRect.top;
        const coord = this.coordinateConverter.translateUnsigned(x, y);
        const delta = this.coordinateConverter.translateSigned(x - this.fakeTouchFinger.x, y - this.fakeTouchFinger.y);
        toStreamerHandlers.get("MouseMove")([coord.x, coord.y, delta.x, delta.y]);
        this.fakeTouchFinger.x = x;
        this.fakeTouchFinger.y = y;
        break;
      }
    }
    touchEvent.preventDefault();
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Inputs/GamepadTypes.js
function deepCopyGamepad(gamepad) {
  return JSON.parse(JSON.stringify({
    buttons: gamepad.buttons.map((b) => JSON.parse(JSON.stringify({
      pressed: b.pressed,
      touched: b.touched,
      value: b.value
    }))),
    axes: gamepad.axes
  }));
}

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Inputs/GamepadController.js
var GamepadLayout;
(function(GamepadLayout2) {
  GamepadLayout2[GamepadLayout2["RightClusterBottomButton"] = 0] = "RightClusterBottomButton";
  GamepadLayout2[GamepadLayout2["RightClusterRightButton"] = 1] = "RightClusterRightButton";
  GamepadLayout2[GamepadLayout2["RightClusterLeftButton"] = 2] = "RightClusterLeftButton";
  GamepadLayout2[GamepadLayout2["RightClusterTopButton"] = 3] = "RightClusterTopButton";
  GamepadLayout2[GamepadLayout2["LeftShoulder"] = 4] = "LeftShoulder";
  GamepadLayout2[GamepadLayout2["RightShoulder"] = 5] = "RightShoulder";
  GamepadLayout2[GamepadLayout2["LeftTrigger"] = 6] = "LeftTrigger";
  GamepadLayout2[GamepadLayout2["RightTrigger"] = 7] = "RightTrigger";
  GamepadLayout2[GamepadLayout2["SelectOrBack"] = 8] = "SelectOrBack";
  GamepadLayout2[GamepadLayout2["StartOrForward"] = 9] = "StartOrForward";
  GamepadLayout2[GamepadLayout2["LeftAnalogPress"] = 10] = "LeftAnalogPress";
  GamepadLayout2[GamepadLayout2["RightAnalogPress"] = 11] = "RightAnalogPress";
  GamepadLayout2[GamepadLayout2["LeftClusterTopButton"] = 12] = "LeftClusterTopButton";
  GamepadLayout2[GamepadLayout2["LeftClusterBottomButton"] = 13] = "LeftClusterBottomButton";
  GamepadLayout2[GamepadLayout2["LeftClusterLeftButton"] = 14] = "LeftClusterLeftButton";
  GamepadLayout2[GamepadLayout2["LeftClusterRightButton"] = 15] = "LeftClusterRightButton";
  GamepadLayout2[GamepadLayout2["CentreButton"] = 16] = "CentreButton";
  GamepadLayout2[GamepadLayout2["LeftStickHorizontal"] = 0] = "LeftStickHorizontal";
  GamepadLayout2[GamepadLayout2["LeftStickVertical"] = 1] = "LeftStickVertical";
  GamepadLayout2[GamepadLayout2["RightStickHorizontal"] = 2] = "RightStickHorizontal";
  GamepadLayout2[GamepadLayout2["RightStickVertical"] = 3] = "RightStickVertical";
})(GamepadLayout || (GamepadLayout = {}));
var GamepadController = class {
  constructor(streamMessageController) {
    this.streamMessageController = streamMessageController;
    this.onGamepadConnectedListener = this.onGamepadConnected.bind(this);
    this.onGamepadDisconnectedListener = this.onGamepadDisconnected.bind(this);
    this.beforeUnloadListener = this.onBeforeUnload.bind(this);
    this.requestAnimationFrame = (window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.requestAnimationFrame).bind(window);
  }
  register() {
    window.addEventListener("beforeunload", this.beforeUnloadListener);
    const browserWindow = window;
    if ("GamepadEvent" in browserWindow) {
      window.addEventListener("gamepadconnected", this.onGamepadConnectedListener);
      window.addEventListener("gamepaddisconnected", this.onGamepadDisconnectedListener);
    } else if ("WebKitGamepadEvent" in browserWindow) {
      window.addEventListener("webkitgamepadconnected", this.onGamepadConnectedListener);
      window.addEventListener("webkitgamepaddisconnected", this.onGamepadDisconnectedListener);
    }
    this.controllers = [];
    if (navigator.getGamepads) {
      for (const gamepad of navigator.getGamepads()) {
        if (gamepad) {
          this.onGamepadConnected(new GamepadEvent("gamepadconnected", { gamepad }));
        }
      }
    }
  }
  unregister() {
    window.removeEventListener("gamepadconnected", this.onGamepadConnectedListener);
    window.removeEventListener("gamepaddisconnected", this.onGamepadDisconnectedListener);
    window.removeEventListener("webkitgamepadconnected", this.onGamepadConnectedListener);
    window.removeEventListener("webkitgamepaddisconnected", this.onGamepadDisconnectedListener);
    for (const controller of this.controllers) {
      if (controller && controller.id !== void 0) {
        this.streamMessageController.toStreamerHandlers.get("GamepadDisconnected")([controller.id]);
      }
    }
    this.controllers = [];
  }
  onGamepadResponseReceived(gamepadId) {
    for (const controller of this.controllers) {
      if (controller && controller.id === void 0) {
        controller.id = gamepadId;
        break;
      }
    }
  }
  onGamepadConnected(event) {
    const gamepad = event.gamepad;
    const newController = {
      currentState: deepCopyGamepad(gamepad),
      prevState: deepCopyGamepad(gamepad),
      id: void 0
    };
    this.controllers[gamepad.index] = newController;
    window.requestAnimationFrame(() => this.updateStatus());
    this.streamMessageController.toStreamerHandlers.get("GamepadConnected")();
  }
  onGamepadDisconnected(event) {
    const gamepad = event.gamepad;
    const deletedController = this.controllers[gamepad.index];
    delete this.controllers[gamepad.index];
    this.controllers = this.controllers.filter((controller) => controller !== void 0);
    if (deletedController.id !== void 0) {
      this.streamMessageController.toStreamerHandlers.get("GamepadDisconnected")([
        deletedController.id
      ]);
    }
  }
  scanGamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && this.controllers[gamepads[i].index] !== void 0) {
        this.controllers[gamepads[i].index].currentState = gamepads[i];
      }
    }
  }
  updateStatus() {
    this.scanGamepads();
    const toStreamerHandlers = this.streamMessageController.toStreamerHandlers;
    for (const controller of this.controllers) {
      if (!controller) {
        continue;
      }
      const controllerId = controller.id === void 0 ? this.controllers.indexOf(controller) : controller.id;
      const currentState = controller.currentState;
      for (let i = 0; i < controller.currentState.buttons.length; i++) {
        const currentButton = controller.currentState.buttons[i];
        const previousButton = controller.prevState.buttons[i];
        if (currentButton.pressed) {
          if (i == GamepadLayout.LeftTrigger) {
            toStreamerHandlers.get("GamepadAnalog")([controllerId, 5, currentButton.value]);
          } else if (i == GamepadLayout.RightTrigger) {
            toStreamerHandlers.get("GamepadAnalog")([controllerId, 6, currentButton.value]);
          } else {
            toStreamerHandlers.get("GamepadButtonPressed")([
              controllerId,
              i,
              previousButton.pressed ? 1 : 0
            ]);
          }
        } else if (!currentButton.pressed && previousButton.pressed) {
          if (i == GamepadLayout.LeftTrigger) {
            toStreamerHandlers.get("GamepadAnalog")([controllerId, 5, 0]);
          } else if (i == GamepadLayout.RightTrigger) {
            toStreamerHandlers.get("GamepadAnalog")([controllerId, 6, 0]);
          } else {
            toStreamerHandlers.get("GamepadButtonReleased")([controllerId, i, 0]);
          }
        }
      }
      for (let i = 0; i < currentState.axes.length; i += 2) {
        const x = parseFloat(currentState.axes[i].toFixed(4));
        const y = -parseFloat(currentState.axes[i + 1].toFixed(4));
        toStreamerHandlers.get("GamepadAnalog")([controllerId, i + 1, x]);
        toStreamerHandlers.get("GamepadAnalog")([controllerId, i + 2, y]);
      }
      const controllerIndex = this.controllers.indexOf(controller);
      this.controllers[controllerIndex].prevState = deepCopyGamepad(currentState);
    }
    if (this.controllers.length > 0) {
      this.requestAnimationFrame(() => this.updateStatus());
    }
  }
  onBeforeUnload(_) {
    for (const controller of this.controllers) {
      if (!controller || controller.id === void 0) {
        continue;
      }
      this.streamMessageController.toStreamerHandlers.get("GamepadDisconnected")([controller.id]);
    }
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Inputs/InputClassesFactory.js
var InputClassesFactory = class {
  /**
   * @param toStreamerMessagesProvider - Stream message instance
   * @param videoElementProvider - Video Player instance
   * @param coordinateConverter - A coordinateConverter instance
   */
  constructor(toStreamerMessagesProvider, videoElementProvider, coordinateConverter) {
    this.activeKeys = new ActiveKeys();
    this.toStreamerMessagesProvider = toStreamerMessagesProvider;
    this.videoElementProvider = videoElementProvider;
    this.coordinateConverter = coordinateConverter;
  }
  /**
   * Registers browser key events.
   */
  registerKeyBoard(config2) {
    Logger.Info("Register Keyboard Events");
    const keyboardController = new KeyboardController(this.toStreamerMessagesProvider, config2, this.activeKeys);
    keyboardController.register();
    return keyboardController;
  }
  /**
   * register mouse events based on a control type
   * @param controlScheme - if the mouse is either hovering or locked
   */
  registerMouse(controlScheme) {
    Logger.Info("Register Mouse Events");
    let mouseController;
    if (controlScheme == ControlSchemeType.HoveringMouse) {
      mouseController = new MouseControllerHovering(this.toStreamerMessagesProvider, this.videoElementProvider, this.coordinateConverter, this.activeKeys);
    } else {
      mouseController = new MouseControllerLocked(this.toStreamerMessagesProvider, this.videoElementProvider, this.coordinateConverter, this.activeKeys);
    }
    mouseController.register();
    return mouseController;
  }
  /**
   * register touch events
   * @param fakeMouseTouch - the faked mouse touch event
   */
  registerTouch(fakeMouseTouch) {
    Logger.Info("Registering Touch");
    let touchController;
    if (fakeMouseTouch) {
      touchController = new TouchControllerFake(this.toStreamerMessagesProvider, this.videoElementProvider, this.coordinateConverter);
    } else {
      touchController = new TouchController(this.toStreamerMessagesProvider, this.videoElementProvider, this.coordinateConverter);
    }
    touchController.register();
    return touchController;
  }
  /**
   * registers a gamepad
   */
  registerGamePad() {
    Logger.Info("Register Game Pad");
    const gamepadController = new GamepadController(this.toStreamerMessagesProvider);
    gamepadController.register();
    return gamepadController;
  }
};
var ActiveKeys = class {
  constructor() {
    this.activeKeys = [];
    this.activeKeys = [];
  }
  /**
   * Get the current array of active keys
   * @returns - an array of active keys
   */
  getActiveKeys() {
    return this.activeKeys;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/VideoPlayer/VideoPlayer.js
var VideoPlayer = class {
  /**
   * @param videoElementParent the html div the the video player will be injected into
   * @param config the applications configuration. We're interested in the startVideoMuted flag
   */
  constructor(videoElementParent, config2) {
    this.lastTimeResized = (/* @__PURE__ */ new Date()).getTime();
    this.videoElement = document.createElement("video");
    this.config = config2;
    this.videoElement.id = "streamingVideo";
    this.videoElement.disablePictureInPicture = true;
    this.videoElement.playsInline = true;
    this.videoElement.style.width = "100%";
    this.videoElement.style.height = "100%";
    this.videoElement.style.position = "absolute";
    this.videoElement.style.pointerEvents = "all";
    videoElementParent.appendChild(this.videoElement);
    this.onResizePlayerCallback = () => {
      console.log("Resolution changed, restyling player, did you forget to override this function?");
    };
    this.onMatchViewportResolutionCallback = () => {
      console.log("Resolution changed and match viewport resolution is turned on, did you forget to override this function?");
    };
    this.videoElement.onclick = () => {
      if (this.audioElement != void 0 && this.audioElement.paused) {
        this.audioElement.play();
      }
      if (this.videoElement.paused) {
        this.videoElement.play();
      }
    };
    this.videoElement.onloadedmetadata = () => {
      this.onVideoInitialized();
    };
    window.addEventListener("resize", () => this.resizePlayerStyle(), true);
    window.addEventListener("orientationchange", () => this.onOrientationChange());
  }
  destroy() {
    this.videoElement.src = "";
    this.videoElement.srcObject = null;
    this.videoElement.remove();
    if (this.audioElement) {
      this.audioElement.src = "";
      this.audioElement.srcObject = null;
      this.audioElement.remove();
    }
  }
  setAudioElement(audioElement) {
    this.audioElement = audioElement;
  }
  /**
   * Sets up the video element with any application config and plays the video element.
   * @returns A promise for if playing the video was successful or not.
   */
  play() {
    this.videoElement.muted = this.config.isFlagEnabled(Flags.StartVideoMuted);
    this.videoElement.autoplay = this.config.isFlagEnabled(Flags.AutoPlayVideo);
    return this.videoElement.play();
  }
  /**
   * @returns True if the video element is paused.
   */
  isPaused() {
    return this.videoElement.paused;
  }
  /**
   * @returns - whether the video element is playing.
   */
  isVideoReady() {
    return this.videoElement.readyState !== void 0 && this.videoElement.readyState > 0;
  }
  /**
   * @returns True if the video element has a valid video source (srcObject).
   */
  hasVideoSource() {
    return this.videoElement.srcObject !== void 0 && this.videoElement.srcObject !== null;
  }
  /**
   * Get the current context of the html video element
   * @returns - the current context of the video element
   */
  getVideoElement() {
    return this.videoElement;
  }
  /**
   * Get the current context of the html video elements parent
   * @returns - the current context of the video elements parent
   */
  getVideoParentElement() {
    var _a;
    return (_a = this.videoElement.parentElement) !== null && _a !== void 0 ? _a : void 0;
  }
  /**
   * Set the Video Elements src object tracks to enable
   * @param enabled - Enable Tracks on the Src Object
   */
  setVideoEnabled(enabled) {
    const videoElement = this.videoElement;
    videoElement.srcObject.getTracks().forEach((track) => track.enabled = enabled);
  }
  /**
   * An override for when the video has been initialized with a srcObject
   */
  onVideoInitialized() {
  }
  /**
   * On the orientation change of a window clear the timeout
   */
  onOrientationChange() {
    clearTimeout(this.orientationChangeTimeout);
    this.orientationChangeTimeout = window.setTimeout(() => {
      this.resizePlayerStyle();
    }, 500);
  }
  /**
   * Resizes the player style based on the window height and width
   * @returns - nil if requirements are satisfied
   */
  resizePlayerStyle() {
    const videoElementParent = this.getVideoParentElement();
    if (!videoElementParent) {
      return;
    }
    this.updateVideoStreamSize();
    if (videoElementParent.classList.contains("fixed-size")) {
      this.onResizePlayerCallback();
      return;
    }
    this.resizePlayerStyleToFillParentElement();
    this.onResizePlayerCallback();
  }
  /**
   * Resizes the player element to fill the parent element
   */
  resizePlayerStyleToFillParentElement() {
    const videoElementParent = this.getVideoParentElement();
    const styleWidth = "100%";
    const styleHeight = "100%";
    const styleTop = 0;
    const styleLeft = 0;
    videoElementParent.setAttribute("style", "top: " + styleTop + "px; left: " + styleLeft + "px; width: " + styleWidth + "; height: " + styleHeight + "; cursor: default;");
  }
  updateVideoStreamSize() {
    if (!this.config.isFlagEnabled(Flags.MatchViewportResolution)) {
      return;
    }
    const now = (/* @__PURE__ */ new Date()).getTime();
    if (now - this.lastTimeResized > 300) {
      const videoElementParent = this.getVideoParentElement();
      if (!videoElementParent) {
        return;
      }
      this.onMatchViewportResolutionCallback(videoElementParent.clientWidth, videoElementParent.clientHeight);
      this.lastTimeResized = (/* @__PURE__ */ new Date()).getTime();
    } else {
      Logger.Info("Resizing too often - skipping");
      clearTimeout(this.resizeTimeoutHandle);
      this.resizeTimeoutHandle = window.setTimeout(() => this.updateVideoStreamSize(), 100);
    }
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/UeInstanceMessage/StreamMessageController.js
var StreamMessageController = class {
  constructor() {
    this.toStreamerHandlers = /* @__PURE__ */ new Map();
    this.fromStreamerHandlers = /* @__PURE__ */ new Map();
    this.toStreamerMessages = /* @__PURE__ */ new Map();
    this.fromStreamerMessages = /* @__PURE__ */ new Map();
  }
  /**
   * Populate the Default message protocol
   */
  populateDefaultProtocol() {
    this.toStreamerMessages.set("IFrameRequest", {
      id: 0,
      structure: []
    });
    this.toStreamerMessages.set("RequestQualityControl", {
      id: 1,
      structure: []
    });
    this.toStreamerMessages.set("FpsRequest", {
      id: 2,
      structure: []
    });
    this.toStreamerMessages.set("AverageBitrateRequest", {
      id: 3,
      structure: []
    });
    this.toStreamerMessages.set("StartStreaming", {
      id: 4,
      structure: []
    });
    this.toStreamerMessages.set("StopStreaming", {
      id: 5,
      structure: []
    });
    this.toStreamerMessages.set("LatencyTest", {
      id: 6,
      structure: ["string"]
    });
    this.toStreamerMessages.set("RequestInitialSettings", {
      id: 7,
      structure: []
    });
    this.toStreamerMessages.set("TestEcho", {
      id: 8,
      structure: []
    });
    this.toStreamerMessages.set("DataChannelLatencyTest", {
      id: 9,
      structure: []
    });
    this.toStreamerMessages.set("UIInteraction", {
      id: 50,
      structure: ["string"]
    });
    this.toStreamerMessages.set("Command", {
      id: 51,
      structure: ["string"]
    });
    this.toStreamerMessages.set("TextboxEntry", {
      id: 52,
      structure: ["string"]
    });
    this.toStreamerMessages.set("KeyDown", {
      id: 60,
      //            keyCode  isRepeat
      structure: ["uint8", "uint8"]
    });
    this.toStreamerMessages.set("KeyUp", {
      id: 61,
      //            keyCode
      structure: ["uint8"]
    });
    this.toStreamerMessages.set("KeyPress", {
      id: 62,
      //            charcode
      structure: ["uint16"]
    });
    this.toStreamerMessages.set("MouseEnter", {
      id: 70,
      structure: []
    });
    this.toStreamerMessages.set("MouseLeave", {
      id: 71,
      structure: []
    });
    this.toStreamerMessages.set("MouseDown", {
      id: 72,
      //              button     x         y
      structure: ["uint8", "uint16", "uint16"]
    });
    this.toStreamerMessages.set("MouseUp", {
      id: 73,
      //              button     x         y
      structure: ["uint8", "uint16", "uint16"]
    });
    this.toStreamerMessages.set("MouseMove", {
      id: 74,
      //              x           y      deltaX    deltaY
      structure: ["uint16", "uint16", "int16", "int16"]
    });
    this.toStreamerMessages.set("MouseWheel", {
      id: 75,
      //              delta       x        y
      structure: ["int16", "uint16", "uint16"]
    });
    this.toStreamerMessages.set("MouseDouble", {
      id: 76,
      //              button     x         y
      structure: ["uint8", "uint16", "uint16"]
    });
    this.toStreamerMessages.set("TouchStart", {
      id: 80,
      //          numtouches(1)   x       y        idx     force     valid
      structure: ["uint8", "uint16", "uint16", "uint8", "uint8", "uint8"]
    });
    this.toStreamerMessages.set("TouchEnd", {
      id: 81,
      //          numtouches(1)   x       y        idx     force     valid
      structure: ["uint8", "uint16", "uint16", "uint8", "uint8", "uint8"]
    });
    this.toStreamerMessages.set("TouchMove", {
      id: 82,
      //          numtouches(1)   x       y       idx      force     valid
      structure: ["uint8", "uint16", "uint16", "uint8", "uint8", "uint8"]
    });
    this.toStreamerMessages.set("GamepadConnected", {
      id: 93,
      structure: []
    });
    this.toStreamerMessages.set("GamepadButtonPressed", {
      id: 90,
      //         ctrlerId   button  isRepeat
      structure: ["uint8", "uint8", "uint8"]
    });
    this.toStreamerMessages.set("GamepadButtonReleased", {
      id: 91,
      //         ctrlerId   button  isRepeat(0)
      structure: ["uint8", "uint8", "uint8"]
    });
    this.toStreamerMessages.set("GamepadAnalog", {
      id: 92,
      //         ctrlerId   button  analogValue
      structure: ["uint8", "uint8", "double"]
    });
    this.toStreamerMessages.set("GamepadDisconnected", {
      id: 94,
      //          ctrlerId
      structure: ["uint8"]
    });
    this.fromStreamerMessages.set(0, "QualityControlOwnership");
    this.fromStreamerMessages.set(1, "Response");
    this.fromStreamerMessages.set(2, "Command");
    this.fromStreamerMessages.set(3, "FreezeFrame");
    this.fromStreamerMessages.set(4, "UnfreezeFrame");
    this.fromStreamerMessages.set(5, "VideoEncoderAvgQP");
    this.fromStreamerMessages.set(6, "LatencyTest");
    this.fromStreamerMessages.set(7, "InitialSettings");
    this.fromStreamerMessages.set(8, "FileExtension");
    this.fromStreamerMessages.set(9, "FileMimeType");
    this.fromStreamerMessages.set(10, "FileContents");
    this.fromStreamerMessages.set(11, "TestEcho");
    this.fromStreamerMessages.set(12, "InputControlOwnership");
    this.fromStreamerMessages.set(13, "GamepadResponse");
    this.fromStreamerMessages.set(14, "DataChannelLatencyTest");
    this.fromStreamerMessages.set(255, "Protocol");
  }
  /**
   * Register a message handler
   * @param messageDirection - the direction of the message; toStreamer or fromStreamer
   * @param messageType - the type of the message
   * @param messageHandler - the function or method to be executed when this handler is called
   */
  registerMessageHandler(messageDirection, messageType, messageHandler) {
    switch (messageDirection) {
      case MessageDirection.ToStreamer:
        this.toStreamerHandlers.set(messageType, messageHandler);
        break;
      case MessageDirection.FromStreamer:
        this.fromStreamerHandlers.set(messageType, messageHandler);
        break;
      default:
        Logger.Info(`Unknown message direction ${messageDirection}`);
    }
  }
};
var MessageDirection;
(function(MessageDirection2) {
  MessageDirection2[MessageDirection2["ToStreamer"] = 0] = "ToStreamer";
  MessageDirection2[MessageDirection2["FromStreamer"] = 1] = "FromStreamer";
})(MessageDirection || (MessageDirection = {}));

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/UeInstanceMessage/ResponseController.js
var ResponseController = class {
  constructor() {
    this.responseEventListeners = /* @__PURE__ */ new Map();
  }
  /**
   * Add a response event listener to the response map
   * @param name - The name of the response
   * @param listener - The method to be activated when the response is selected
   */
  addResponseEventListener(name, listener) {
    this.responseEventListeners.set(name, listener);
  }
  /**
   * Remove a response event listener to the response map
   * @param name - The name of the response
   */
  removeResponseEventListener(name) {
    this.responseEventListeners.delete(name);
  }
  /**
   * Handle a response when receiving one form the streamer
   * @param message - Data received from the data channel with the command in question
   */
  onResponse(message) {
    Logger.Info("DataChannelReceiveMessageType.Response");
    const responses = new TextDecoder("utf-16").decode(message.slice(1));
    Logger.Info(responses);
    this.responseEventListeners.forEach((listener) => {
      listener(responses);
    });
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/UeInstanceMessage/SendMessageController.js
var SendMessageController = class {
  /**
   * @param dataChannelSender - Data channel instance
   * @param toStreamerMessagesMapProvider - Stream Messages instance
   */
  constructor(dataChannelSender, toStreamerMessagesMapProvider) {
    this.dataChannelSender = dataChannelSender;
    this.toStreamerMessagesMapProvider = toStreamerMessagesMapProvider;
  }
  /**
   * Send a message to the streamer through the data channel
   * @param messageType - the type of message we are sending
   * @param messageData - the message data we are sending over the data channel
   * @returns - nil
   */
  sendMessageToStreamer(messageType, messageData) {
    if (messageData === void 0) {
      messageData = [];
    }
    const toStreamerMessages = this.toStreamerMessagesMapProvider.toStreamerMessages;
    const messageFormat = toStreamerMessages.get(messageType);
    if (messageFormat === void 0) {
      Logger.Error(`Attempted to send a message to the streamer with message type: ${messageType}, but the frontend hasn't been configured to send such a message. Check you've added the message type in your cpp`);
      return;
    }
    if (messageFormat.structure && messageData && messageFormat.structure.length !== messageData.length) {
      Logger.Error(`Provided message data doesn't match expected layout. Expected [ ${messageFormat.structure.map((element) => {
        switch (element) {
          case "uint8":
          case "uint16":
          case "int16":
          case "float":
          case "double":
          default:
            return "number";
          case "string":
            return "string";
        }
      }).toString()} ] but received [ ${messageData.map((element) => typeof element).toString()} ]`);
      return;
    }
    let byteLength = 0;
    const textEncoder = new TextEncoder();
    messageData.forEach((element, idx) => {
      const type = messageFormat.structure[idx];
      switch (type) {
        case "uint8":
          byteLength += 1;
          break;
        case "uint16":
          byteLength += 2;
          break;
        case "int16":
          byteLength += 2;
          break;
        case "float":
          byteLength += 4;
          break;
        case "double":
          byteLength += 8;
          break;
        case "string":
          byteLength += 2;
          byteLength += 2 * textEncoder.encode(element).length;
          break;
      }
    });
    const data = new DataView(new ArrayBuffer(byteLength + 1));
    data.setUint8(0, messageFormat.id);
    let byteOffset = 1;
    messageData.forEach((element, idx) => {
      const type = messageFormat.structure[idx];
      switch (type) {
        case "uint8":
          data.setUint8(byteOffset, element);
          byteOffset += 1;
          break;
        case "uint16":
          data.setUint16(byteOffset, element, true);
          byteOffset += 2;
          break;
        case "int16":
          data.setInt16(byteOffset, element, true);
          byteOffset += 2;
          break;
        case "float":
          data.setFloat32(byteOffset, element, true);
          byteOffset += 4;
          break;
        case "double":
          data.setFloat64(byteOffset, element, true);
          byteOffset += 8;
          break;
        case "string":
          data.setUint16(byteOffset, element.length, true);
          byteOffset += 2;
          for (let i = 0; i < element.length; i++) {
            data.setUint16(byteOffset, element.charCodeAt(i), true);
            byteOffset += 2;
          }
          break;
      }
    });
    if (!this.dataChannelSender.canSend()) {
      Logger.Info(`Data channel cannot send yet, skipping sending message: ${messageType} - ${new Uint8Array(data.buffer)}`);
      return;
    }
    this.dataChannelSender.sendData(data.buffer);
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/UeInstanceMessage/ToStreamerMessagesController.js
var ToStreamerMessagesController = class {
  /**
   * @param sendMessageController - Stream message controller instance
   */
  constructor(sendMessageController) {
    this.sendMessageController = sendMessageController;
  }
  /**
   * Send Request to Take Quality Control to the UE Instance
   */
  SendRequestQualityControl() {
    this.sendMessageController.sendMessageToStreamer("RequestQualityControl");
  }
  /**
   * Send Max FPS Request to the UE Instance
   */
  SendMaxFpsRequest() {
    this.sendMessageController.sendMessageToStreamer("FpsRequest");
  }
  /**
   * Send Average Bitrate Request to the UE Instance
   */
  SendAverageBitrateRequest() {
    this.sendMessageController.sendMessageToStreamer("AverageBitrateRequest");
  }
  /**
   * Send a Start Streaming Message to the UE Instance
   */
  SendStartStreaming() {
    this.sendMessageController.sendMessageToStreamer("StartStreaming");
  }
  /**
   * Send a Stop Streaming Message to the UE Instance
   */
  SendStopStreaming() {
    this.sendMessageController.sendMessageToStreamer("StopStreaming");
  }
  /**
   * Send a Request Initial Settings to the UE Instance
   */
  SendRequestInitialSettings() {
    this.sendMessageController.sendMessageToStreamer("RequestInitialSettings");
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/DataChannel/DataChannelSender.js
var DataChannelSender = class {
  /**
   * @param dataChannelProvider - Data channel object type
   */
  constructor(dataChannelProvider) {
    this.dataChannelProvider = dataChannelProvider;
  }
  canSend() {
    return this.dataChannelProvider.getDataChannelInstance().dataChannel !== void 0 && this.dataChannelProvider.getDataChannelInstance().dataChannel.readyState == "open";
  }
  /**
   * Send Data over the Data channel to the UE Instance
   * @param data - Message Data Array Buffer
   */
  sendData(data) {
    const dataChannelInstance = this.dataChannelProvider.getDataChannelInstance();
    if (dataChannelInstance.dataChannel.readyState == "open") {
      dataChannelInstance.dataChannel.send(data);
      Logger.Info(`Message Sent: ${new Uint8Array(data)}`);
      this.resetAfkWarningTimerOnDataSend();
    } else {
      Logger.Error(`Message Failed: ${new Uint8Array(data)}`);
    }
  }
  /**
   * An override method for resetting the Afk warning timer when data is sent over the data channel
   */
  resetAfkWarningTimerOnDataSend() {
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Util/InputCoordTranslator.js
var InputCoordTranslator = class {
  // we dont use a constructor here because the object is created and passed around to various locations
  // possibly before this method is called.
  reconfigure(playerSize, videoSize) {
    const playerAspectRatio = playerSize.height / playerSize.width;
    const videoAspectRatio = videoSize.height / videoSize.width;
    this.playerIsLarger = playerAspectRatio > videoAspectRatio;
    this.playerSize = playerSize;
    this.ratio = this.playerIsLarger ? playerAspectRatio / videoAspectRatio : videoAspectRatio / playerAspectRatio;
  }
  translateUnsigned(x, y) {
    const normalizedX = this.playerIsLarger ? x / this.playerSize.width : this.ratio * (x / this.playerSize.width - 0.5) + 0.5;
    const normalizedY = this.playerIsLarger ? this.ratio * (y / this.playerSize.height - 0.5) + 0.5 : y / this.playerSize.height;
    if (normalizedX < 0 || normalizedX > 1 || normalizedY < 0 || normalizedY > 1) {
      return { inRange: false, x: 65535, y: 65535 };
    } else {
      return { inRange: true, x: normalizedX * 65536, y: normalizedY * 65536 };
    }
  }
  translateSigned(x, y) {
    const normalizedX = this.playerIsLarger ? x / (0.5 * this.playerSize.width) : this.ratio * x / (0.5 * this.playerSize.width);
    const normalizedY = this.playerIsLarger ? this.ratio * y / (0.5 * this.playerSize.height) : y / (0.5 * this.playerSize.height);
    return { x: normalizedX * 32767, y: normalizedY * 32767 };
  }
  untranslateUnsigned(x, y) {
    const normalizedX = this.playerIsLarger ? x / 65536 : (x / 65536 - 0.5) / this.ratio + 0.5;
    const normalizedY = this.playerIsLarger ? (y / 65536 - 0.5) / this.ratio + 0.5 : y / 65536;
    return { x: normalizedX * this.playerSize.width, y: normalizedY * this.playerSize.height };
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Util/IURLSearchParams.js
var IURLSearchParams = class {
  constructor(search) {
    this._urlParams = {};
    const urlParams = new URLSearchParams(search);
    for (const [name, value] of urlParams) {
      this._urlParams[name.toLowerCase()] = value;
    }
  }
  has(name) {
    return name.toLowerCase() in this._urlParams;
  }
  get(name) {
    if (this.has(name)) {
      return this._urlParams[name.toLowerCase()];
    }
    return null;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/WebRtcPlayer/WebRtcPlayerController.js
var WebRtcPlayerController = class {
  /**
   *
   * @param config - the frontend config object
   * @param pixelStreaming - the PixelStreaming object
   */
  constructor(config2, pixelStreaming) {
    this.shouldShowPlayOverlay = true;
    this.autoJoinTimer = void 0;
    this.config = config2;
    this.pixelStreaming = pixelStreaming;
    this.responseController = new ResponseController();
    this.file = new FileTemplate();
    this.sdpConstraints = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    };
    this.afkController = new AFKController(this.config, this.pixelStreaming, this.onAfkTriggered.bind(this));
    this.afkController.onAFKTimedOutCallback = () => {
      this.closeSignalingServer("You have been disconnected due to inactivity.", false);
    };
    this.freezeFrameController = new FreezeFrameController(this.pixelStreaming.videoElementParent);
    this.videoPlayer = new VideoPlayer(this.pixelStreaming.videoElementParent, this.config);
    this.videoPlayer.onVideoInitialized = () => this.handleVideoInitialized();
    this.videoPlayer.onMatchViewportResolutionCallback = (width, height) => {
      const descriptor = {
        "Resolution.Width": width,
        "Resolution.Height": height
      };
      this.streamMessageController.toStreamerHandlers.get("Command")([JSON.stringify(descriptor)]);
    };
    this.videoPlayer.onResizePlayerCallback = () => {
      this.setUpMouseAndFreezeFrame();
    };
    this.streamController = new StreamController(this.videoPlayer);
    this.coordinateConverter = new InputCoordTranslator();
    this.sendrecvDataChannelController = new DataChannelController();
    this.recvDataChannelController = new DataChannelController();
    this.registerDataChannelEventEmitters(this.sendrecvDataChannelController);
    this.registerDataChannelEventEmitters(this.recvDataChannelController);
    this.dataChannelSender = new DataChannelSender(this.sendrecvDataChannelController);
    this.dataChannelSender.resetAfkWarningTimerOnDataSend = () => this.afkController.resetAfkWarningTimer();
    this.streamMessageController = new StreamMessageController();
    this.transport = new WebSocketTransport(config2.webSocketProtocols);
    this.protocol = new SignallingProtocol(this.transport);
    this.protocol.addListener(signalling_messages_exports.config.typeName, (msg) => this.handleOnConfigMessage(msg));
    this.protocol.addListener(signalling_messages_exports.ping.typeName, (msg) => this.handlePingMessage(msg));
    this.protocol.addListener(signalling_messages_exports.streamerList.typeName, (msg) => this.handleStreamerListMessage(msg));
    this.protocol.addListener(signalling_messages_exports.subscribeFailed.typeName, (msg) => this.handleSubscribeFailedMessage(msg));
    this.protocol.addListener(signalling_messages_exports.streamerIdChanged.typeName, (msg) => this.handleStreamerIDChangedMessage(msg));
    this.protocol.addListener(signalling_messages_exports.playerCount.typeName, (msg) => {
      const playerCountMessage = msg;
      this.pixelStreaming._onPlayerCount(playerCountMessage.count);
    });
    this.protocol.addListener(signalling_messages_exports.answer.typeName, (msg) => this.handleWebRtcAnswer(msg));
    this.protocol.addListener(signalling_messages_exports.offer.typeName, (msg) => this.handleWebRtcOffer(msg));
    this.protocol.addListener(signalling_messages_exports.peerDataChannels.typeName, (msg) => this.handleWebRtcSFUPeerDatachannels(msg));
    this.protocol.addListener(signalling_messages_exports.iceCandidate.typeName, (msg) => {
      const iceCandidateMessage = msg;
      this.handleIceCandidate(iceCandidateMessage.candidate);
    });
    this.protocol.transport.addListener("open", () => {
      const BrowserSendOffer = this.config.isFlagEnabled(Flags.BrowserSendOffer);
      if (!BrowserSendOffer) {
        const message = message_helpers_exports.createMessage(signalling_messages_exports.listStreamers);
        this.protocol.sendMessage(message);
      }
      this.reconnectAttempt = 0;
      this.isReconnecting = false;
    });
    this.protocol.transport.addListener("error", () => {
      Logger.Error(`Got a transport error.`);
    });
    this.protocol.transport.addListener("close", (event) => {
      const CODE_GOING_AWAY = 1001;
      const maxReconnectAttempts = this.config.getNumericSettingValue(NumericParameters.MaxReconnectAttempts);
      const attemptsLeft = this.reconnectAttempt < maxReconnectAttempts;
      const reconnectEnabled = this.forceReconnect || this.enableAutoReconnect && maxReconnectAttempts > 0 && attemptsLeft;
      const willTryReconnect = reconnectEnabled && event.code != CODE_GOING_AWAY;
      const allowClickToReconnect = !willTryReconnect;
      const disconnectMessage = this.disconnectMessage ? this.disconnectMessage : event.reason;
      this.forceReconnect = false;
      this.config.getSettingOption(OptionParameters.PreferredCodec).options = BrowserUtils.getSupportedVideoCodecs();
      this.pixelStreaming._onDisconnect(disconnectMessage, allowClickToReconnect);
      this.afkController.stopAfkWarningTimer();
      if (this.statsTimerHandle && this.statsTimerHandle !== void 0) {
        window.clearInterval(this.statsTimerHandle);
      }
      this.setVideoEncoderAvgQP(0);
      this.setTouchInputEnabled(false);
      this.setMouseInputEnabled(false);
      this.setKeyboardInputEnabled(false);
      this.setGamePadInputEnabled(false);
      if (willTryReconnect) {
        setTimeout(() => {
          this.reconnectAttempt++;
          this.doReconnect(event.reason);
        }, 2e3);
      }
    });
    this.sendMessageController = new SendMessageController(this.dataChannelSender, this.streamMessageController);
    this.toStreamerMessagesController = new ToStreamerMessagesController(this.sendMessageController);
    this.registerMessageHandlers();
    this.streamMessageController.populateDefaultProtocol();
    this.inputClassesFactory = new InputClassesFactory(this.streamMessageController, this.videoPlayer, this.coordinateConverter);
    this.isUsingSFU = false;
    this.isUsingSVC = false;
    this.isQualityController = false;
    this.preferredCodec = "";
    this.enableAutoReconnect = true;
    this.forceReconnect = false;
    this.reconnectAttempt = 0;
    this.isReconnecting = false;
    this.config._addOnOptionSettingChangedListener(OptionParameters.StreamerId, (streamerid) => {
      if (streamerid === void 0 || streamerid === "") {
        return;
      }
      this.peerConnectionController.peerConnection.close();
      this.peerConnectionController.createPeerConnection(this.peerConfig, this.preferredCodec);
      this.subscribedStream = streamerid;
      const message = message_helpers_exports.createMessage(signalling_messages_exports.subscribe, { streamerId: streamerid });
      this.protocol.sendMessage(message);
    });
    this.config._addOnOptionSettingChangedListener(OptionParameters.PreferredQuality, (preferredQuality) => {
      if (preferredQuality === void 0 || preferredQuality === "") {
        return;
      }
      let message;
      if (this.isUsingSVC) {
        message = message_helpers_exports.createMessage(signalling_messages_exports.layerPreference, {
          spatialLayer: +preferredQuality[1] - 1,
          temporalLayer: +preferredQuality[3] - 1
        });
      } else {
        const allQualities = this.config.getSettingOption(OptionParameters.PreferredQuality).options;
        const qualityIndex = allQualities.indexOf(preferredQuality);
        message = message_helpers_exports.createMessage(signalling_messages_exports.layerPreference, {
          spatialLayer: qualityIndex,
          temporalLayer: 0
        });
      }
      this.protocol.sendMessage(message);
    });
    this.setVideoEncoderAvgQP(-1);
    this.signallingUrlBuilder = () => {
      const signallingServerUrl = this.config.getTextSettingValue(TextParameters.SignallingServerUrl);
      return signallingServerUrl;
    };
  }
  /**
   * Destroys the video player and makes sure resources are freed. This helps to prevent the issue in chrome
   * where it refuses to make new video players.
   */
  destroyVideoPlayer() {
    this.videoPlayer.destroy();
  }
  /**
   * Handles when a message is received
   * @param event - Message Event
   */
  handleOnMessage(event) {
    const message = new Uint8Array(event.data);
    Logger.Info("Message incoming:" + message);
    const messageType = this.streamMessageController.fromStreamerMessages.get(message[0]);
    this.streamMessageController.fromStreamerHandlers.get(messageType)(event.data);
  }
  /**
   * Register message all handlers
   */
  registerMessageHandlers() {
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "QualityControlOwnership", (data) => this.onQualityControlOwnership(data));
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "Response", (data) => this.responseController.onResponse(data));
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "Command", (data) => {
      this.onCommand(data);
    });
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "FreezeFrame", (data) => this.onFreezeFrameMessage(data));
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "UnfreezeFrame", () => this.invalidateFreezeFrameAndEnableVideo());
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "VideoEncoderAvgQP", (data) => this.handleVideoEncoderAvgQP(data));
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "LatencyTest", (data) => this.handleLatencyTestResult(data));
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "DataChannelLatencyTest", (data) => this.handleDataChannelLatencyTestResponse(data));
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "InitialSettings", (data) => this.handleInitialSettings(data));
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "FileExtension", (data) => this.onFileExtension(data));
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "FileMimeType", (data) => this.onFileMimeType(data));
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "FileContents", (data) => this.onFileContents(data));
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "TestEcho", () => {
    });
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "InputControlOwnership", (data) => this.onInputControlOwnership(data));
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "GamepadResponse", (data) => this.onGamepadResponse(data));
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "Multiplexed", () => {
    });
    this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "Protocol", (data) => this.onProtocolMessage(data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "IFrameRequest", () => this.sendMessageController.sendMessageToStreamer("IFrameRequest"));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "RequestQualityControl", () => this.sendMessageController.sendMessageToStreamer("RequestQualityControl"));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "FpsRequest", () => this.sendMessageController.sendMessageToStreamer("FpsRequest"));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "AverageBitrateRequest", () => this.sendMessageController.sendMessageToStreamer("AverageBitrateRequest"));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "StartStreaming", () => this.sendMessageController.sendMessageToStreamer("StartStreaming"));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "StopStreaming", () => this.sendMessageController.sendMessageToStreamer("StopStreaming"));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "LatencyTest", (data) => this.sendMessageController.sendMessageToStreamer("LatencyTest", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "RequestInitialSettings", () => this.sendMessageController.sendMessageToStreamer("RequestInitialSettings"));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "TestEcho", () => {
    });
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "UIInteraction", (data) => this.sendMessageController.sendMessageToStreamer("UIInteraction", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "Command", (data) => this.sendMessageController.sendMessageToStreamer("Command", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "TextboxEntry", (data) => this.sendMessageController.sendMessageToStreamer("TextboxEntry", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "KeyDown", (data) => this.sendMessageController.sendMessageToStreamer("KeyDown", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "KeyUp", (data) => this.sendMessageController.sendMessageToStreamer("KeyUp", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "KeyPress", (data) => this.sendMessageController.sendMessageToStreamer("KeyPress", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "MouseEnter", (data) => this.sendMessageController.sendMessageToStreamer("MouseEnter", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "MouseLeave", (data) => this.sendMessageController.sendMessageToStreamer("MouseLeave", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "MouseDown", (data) => this.sendMessageController.sendMessageToStreamer("MouseDown", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "MouseUp", (data) => this.sendMessageController.sendMessageToStreamer("MouseUp", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "MouseMove", (data) => this.sendMessageController.sendMessageToStreamer("MouseMove", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "MouseWheel", (data) => this.sendMessageController.sendMessageToStreamer("MouseWheel", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "MouseDouble", (data) => this.sendMessageController.sendMessageToStreamer("MouseDouble", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "TouchStart", (data) => this.sendMessageController.sendMessageToStreamer("TouchStart", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "TouchEnd", (data) => this.sendMessageController.sendMessageToStreamer("TouchEnd", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "TouchMove", (data) => this.sendMessageController.sendMessageToStreamer("TouchMove", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "GamepadConnected", () => this.sendMessageController.sendMessageToStreamer("GamepadConnected"));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "GamepadButtonPressed", (data) => this.sendMessageController.sendMessageToStreamer("GamepadButtonPressed", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "GamepadButtonReleased", (data) => this.sendMessageController.sendMessageToStreamer("GamepadButtonReleased", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "GamepadAnalog", (data) => this.sendMessageController.sendMessageToStreamer("GamepadAnalog", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "GamepadDisconnected", (data) => this.sendMessageController.sendMessageToStreamer("GamepadDisconnected", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "XREyeViews", (data) => this.sendMessageController.sendMessageToStreamer("XREyeViews", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "XRHMDTransform", (data) => this.sendMessageController.sendMessageToStreamer("XRHMDTransform", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "XRControllerTransform", (data) => this.sendMessageController.sendMessageToStreamer("XRControllerTransform", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "XRSystem", (data) => this.sendMessageController.sendMessageToStreamer("XRSystem", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "XRButtonTouched", (data) => this.sendMessageController.sendMessageToStreamer("XRButtonTouched", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "XRButtonTouchReleased", (data) => this.sendMessageController.sendMessageToStreamer("XRButtonTouchReleased", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "XRButtonPressed", (data) => this.sendMessageController.sendMessageToStreamer("XRButtonPressed", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "XRButtonReleased", (data) => this.sendMessageController.sendMessageToStreamer("XRButtonReleased", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "XRAnalog", (data) => this.sendMessageController.sendMessageToStreamer("XRAnalog", data));
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "ChannelRelayStatus", () => {
    });
    this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "Multiplexed", () => {
    });
  }
  /**
   * Activate the logic associated with a command from UE
   * @param message
   */
  onCommand(message) {
    Logger.Info("DataChannelReceiveMessageType.Command");
    const commandAsString = new TextDecoder("utf-16").decode(message.slice(1));
    Logger.Info("Data Channel Command: " + commandAsString);
    const command = JSON.parse(commandAsString);
    if (command.command === "onScreenKeyboard") {
      this.handleOnScreenKeyboardCommand(command);
    }
  }
  handleOnScreenKeyboardCommand(command) {
    var _a, _b, _c, _d;
    const data = {
      showOnScreenKeyboard: (_a = command.showOnScreenKeyboard) !== null && _a !== void 0 ? _a : true,
      x: (_b = command.x) !== null && _b !== void 0 ? _b : 0,
      y: (_c = command.y) !== null && _c !== void 0 ? _c : 0,
      contents: (_d = command.contents) !== null && _d !== void 0 ? _d : ""
    };
    this.pixelStreaming.dispatchEvent(new ShowOnScreenKeyboardEvent(data));
  }
  /**
   * Handles a protocol message received from the streamer
   * @param message the message data from the streamer
   */
  onProtocolMessage(message) {
    try {
      const protocolString = new TextDecoder("utf-16").decode(message.slice(1));
      const protocolJSON = JSON.parse(protocolString);
      if (!Object.prototype.hasOwnProperty.call(protocolJSON, "Direction")) {
        Logger.Error("Malformed protocol received. Ensure the protocol message contains a direction");
      }
      const direction = protocolJSON.Direction;
      delete protocolJSON.Direction;
      Logger.Info(`Received new ${direction == MessageDirection.FromStreamer ? "FromStreamer" : "ToStreamer"} protocol. Updating existing protocol...`);
      Object.keys(protocolJSON).forEach((messageType) => {
        const message2 = protocolJSON[messageType];
        switch (direction) {
          case MessageDirection.ToStreamer:
            if (!Object.prototype.hasOwnProperty.call(message2, "id")) {
              Logger.Error(`ToStreamer->${messageType} protocol definition was malformed as it didn't contain at least an id

                                           Definition was: ${JSON.stringify(message2, null, 2)}`);
              return;
            }
            if (messageType === "UIInteraction" || messageType === "Command" || messageType === "LatencyTest") {
              return;
            }
            if (this.streamMessageController.toStreamerHandlers.get(messageType)) {
              this.streamMessageController.toStreamerMessages.set(messageType, message2);
            } else {
              Logger.Error(`There was no registered handler for "${messageType}" - try adding one using registerMessageHandler(MessageDirection.ToStreamer, "${messageType}", myHandler)`);
            }
            break;
          case MessageDirection.FromStreamer:
            if (!Object.prototype.hasOwnProperty.call(message2, "id")) {
              Logger.Error(`FromStreamer->${messageType} protocol definition was malformed as it didn't contain at least an id

                            Definition was: ${JSON.stringify(message2, null, 2)}`);
              return;
            }
            if (this.streamMessageController.fromStreamerHandlers.get(messageType)) {
              this.streamMessageController.fromStreamerMessages.set(message2.id, messageType);
            } else {
              Logger.Error(`There was no registered handler for "${message2}" - try adding one using registerMessageHandler(MessageDirection.FromStreamer, "${messageType}", myHandler)`);
            }
            break;
          default:
            Logger.Error(`Unknown direction: ${direction}`);
        }
      });
      this.toStreamerMessagesController.SendRequestInitialSettings();
      this.toStreamerMessagesController.SendRequestQualityControl();
    } catch (e) {
      Logger.Info(e);
    }
  }
  /**
   * Handles an input control message when it is received from the streamer
   * @param message The input control message
   */
  onInputControlOwnership(message) {
    const view = new Uint8Array(message);
    Logger.Info("DataChannelReceiveMessageType.InputControlOwnership");
    const inputControlOwnership = new Boolean(view[1]).valueOf();
    Logger.Info(`Received input controller message - will your input control the stream: ${inputControlOwnership}`);
    this.pixelStreaming._onInputControlOwnership(inputControlOwnership);
  }
  /**
   *
   * @param message
   */
  onGamepadResponse(message) {
    const responseString = new TextDecoder("utf-16").decode(message.slice(1));
    const responseJSON = JSON.parse(responseString);
    this.gamePadController.onGamepadResponseReceived(responseJSON.controllerId);
  }
  onAfkTriggered() {
    this.afkController.onAfkClick();
    if (this.videoPlayer.isPaused() && this.videoPlayer.hasVideoSource()) {
      this.playStream();
    }
  }
  /**
   * Set whether we should timeout when afk.
   * @param afkEnabled If true we timeout when idle for some given amount of time.
   */
  setAfkEnabled(afkEnabled) {
    if (afkEnabled) {
      this.onAfkTriggered();
    } else {
      this.afkController.stopAfkWarningTimer();
    }
  }
  /**
   * Attempt a reconnection to the signalling server. Manual trigger
   */
  tryReconnect(message) {
    this.forceReconnect = true;
    this.doReconnect(message);
  }
  /**
   * Does the actual reconnect work. Used by the auto reconnect feature to skip the manual flag.
   */
  doReconnect(message) {
    if (!this.protocol) {
      Logger.Info("This player has no protocol connection.");
      return;
    }
    this.isReconnecting = true;
    if (this.protocol.isConnected()) {
      if (!this.forceReconnect) {
        this.disconnectMessage = `${message} Reconnecting.`;
      }
      this.closeSignalingServer(message, true);
    } else {
      this.pixelStreaming._onWebRtcAutoConnect();
      this.connectToSignallingServer();
    }
  }
  /**
   * Loads a freeze frame if it is required otherwise shows the play overlay
   */
  loadFreezeFrameOrShowPlayOverlay() {
    this.pixelStreaming.dispatchEvent(new LoadFreezeFrameEvent({
      shouldShowPlayOverlay: this.shouldShowPlayOverlay,
      isValid: this.freezeFrameController.valid,
      jpegData: this.freezeFrameController.jpeg
    }));
    if (this.shouldShowPlayOverlay === true) {
      Logger.Info("showing play overlay");
      this.resizePlayerStyle();
    } else {
      Logger.Info("showing freeze frame");
      this.freezeFrameController.showFreezeFrame();
    }
    setTimeout(() => {
      this.videoPlayer.setVideoEnabled(false);
    }, this.freezeFrameController.freezeFrameDelay);
  }
  /**
   * Process the freeze frame and load it
   * @param message The freeze frame data in bytes
   */
  onFreezeFrameMessage(message) {
    Logger.Info("DataChannelReceiveMessageType.FreezeFrame");
    const view = new Uint8Array(message);
    this.freezeFrameController.processFreezeFrameMessage(view, () => this.loadFreezeFrameOrShowPlayOverlay());
  }
  /**
   * Enable the video after hiding a freeze frame
   */
  invalidateFreezeFrameAndEnableVideo() {
    Logger.Info("DataChannelReceiveMessageType.FreezeFrame");
    setTimeout(() => {
      this.pixelStreaming.dispatchEvent(new HideFreezeFrameEvent());
      this.freezeFrameController.hideFreezeFrame();
    }, this.freezeFrameController.freezeFrameDelay);
    if (this.videoPlayer.getVideoElement()) {
      this.videoPlayer.setVideoEnabled(true);
    }
  }
  /**
   * Prep datachannel data for processing file extension
   * @param data the file extension data
   */
  onFileExtension(data) {
    const view = new Uint8Array(data);
    FileUtil.setExtensionFromBytes(view, this.file);
  }
  /**
   * Prep datachannel data for processing the file mime type
   * @param data the file mime type data
   */
  onFileMimeType(data) {
    const view = new Uint8Array(data);
    FileUtil.setMimeTypeFromBytes(view, this.file);
  }
  /**
   * Prep datachannel data for processing the file contents
   * @param data the file contents data
   */
  onFileContents(data) {
    const view = new Uint8Array(data);
    FileUtil.setContentsFromBytes(view, this.file);
  }
  /**
   * Plays the stream audio and video source and sets up other pieces while the stream starts
   */
  playStream() {
    if (!this.videoPlayer.getVideoElement()) {
      const message = "Could not play video stream because the video player was not initialized correctly.";
      this.pixelStreaming.dispatchEvent(new PlayStreamErrorEvent({ message }));
      Logger.Error(message);
      this.closeSignalingServer("Stream not initialized correctly", false);
      return;
    }
    if (!this.videoPlayer.hasVideoSource()) {
      Logger.Warning("Cannot play stream, the video element has no srcObject to play.");
      return;
    }
    this.setTouchInputEnabled(this.config.isFlagEnabled(Flags.TouchInput));
    this.pixelStreaming.dispatchEvent(new PlayStreamEvent());
    if (this.streamController.audioElement.srcObject) {
      const startMuted = this.config.isFlagEnabled(Flags.StartVideoMuted);
      this.streamController.audioElement.muted = startMuted;
      if (startMuted) {
        this.playVideo();
      } else {
        this.streamController.audioElement.play().then(() => {
          this.playVideo();
        }).catch((onRejectedReason) => {
          Logger.Info(onRejectedReason);
          Logger.Info("Browser does not support autoplaying video without interaction - to resolve this we are going to show the play button overlay.");
          this.pixelStreaming.dispatchEvent(new PlayStreamRejectedEvent({
            reason: onRejectedReason
          }));
        });
      }
    } else {
      this.playVideo();
    }
    this.shouldShowPlayOverlay = false;
    this.freezeFrameController.showFreezeFrame();
  }
  /**
   * Plays the video stream
   */
  playVideo() {
    this.videoPlayer.play().catch((onRejectedReason) => {
      if (this.streamController.audioElement.srcObject) {
        this.streamController.audioElement.pause();
      }
      Logger.Info(onRejectedReason);
      Logger.Info("Browser does not support autoplaying video without interaction - to resolve this we are going to show the play button overlay.");
      this.pixelStreaming.dispatchEvent(new PlayStreamRejectedEvent({ reason: onRejectedReason }));
    });
  }
  /**
   * Enable the video to play automatically if enableAutoplay is true
   */
  autoPlayVideoOrSetUpPlayOverlay() {
    if (this.config.isFlagEnabled(Flags.AutoPlayVideo)) {
      this.playStream();
    }
    this.resizePlayerStyle();
  }
  /**
   * Connect to the Signaling server
   */
  connectToSignallingServer() {
    this.locallyClosed = false;
    this.enableAutoReconnect = true;
    this.disconnectMessage = null;
    const signallingUrl = this.signallingUrlBuilder();
    this.protocol.connect(signallingUrl);
    const keepaliveDelay = this.config.getNumericSettingValue(NumericParameters.KeepaliveDelay);
    if (keepaliveDelay > 0) {
      this.keepalive = new KeepaliveMonitor(this.protocol, keepaliveDelay);
      this.keepalive.onTimeout = () => {
        Logger.Error(`Protocol timeout`);
        this.protocol.disconnect();
      };
    }
  }
  /**
   * This will start the handshake to the signalling server
   * @param peerConfig  - RTC Configuration Options from the Signaling server
   * @remark RTC Peer Connection on Ice Candidate event have it handled by handle Send Ice Candidate
   */
  startSession(peerConfig) {
    this.peerConfig = peerConfig;
    if (this.config.isFlagEnabled(Flags.ForceTURN)) {
      const hasTurnServer = this.checkTurnServerAvailability(peerConfig);
      if (!hasTurnServer) {
        Logger.Info("No turn server was found in the Peer Connection Options. TURN cannot be forced, closing connection. Please use STUN instead");
        this.closeSignalingServer("TURN cannot be forced, closing connection. Please use STUN instead.", false);
        return;
      }
    }
    this.peerConnectionController = new PeerConnectionController(this.peerConfig, this.config, this.preferredCodec);
    this.peerConnectionController.onVideoStats = (event) => {
      this.handleVideoStats(event);
    };
    this.peerConnectionController.onLatencyCalculated = (latencyInfo) => {
      this.pixelStreaming._onLatencyCalculated(latencyInfo);
    };
    this.peerConnectionController.onSendWebRTCOffer = (offer2) => {
      this.handleSendWebRTCOffer(offer2);
    };
    this.peerConnectionController.onSetLocalDescription = (sdp) => {
      if (sdp.type === "offer") {
        this.handleSendWebRTCOffer(sdp);
      } else if (sdp.type === "answer") {
        this.handleSendWebRTCAnswer(sdp);
      } else {
        Logger.Error(`PeerConnectionController onSetLocalDescription was called with unexpected type ${sdp.type}`);
      }
    };
    this.peerConnectionController.onSetRemoteDescription = (sdp) => {
      if (sdp.type === "offer") {
        this.pixelStreaming._onWebRtcSdpOffer(sdp);
      } else if (sdp.type === "answer") {
        this.pixelStreaming._onWebRtcSdpAnswer(sdp);
      } else {
        Logger.Error(`PeerConnectionController onSetRemoteDescription was called with unexpected type ${sdp.type}`);
      }
    };
    this.peerConnectionController.onPeerIceCandidate = (peerConnectionIceEvent) => this.handleSendIceCandidate(peerConnectionIceEvent);
    this.peerConnectionController.onDataChannel = (datachannelEvent) => this.handleDataChannel(datachannelEvent);
    this.peerConnectionController.showTextOverlayConnecting = () => this.pixelStreaming._onWebRtcConnecting();
    this.peerConnectionController.showTextOverlaySetupFailure = () => this.pixelStreaming._onWebRtcFailed();
    let webRtcConnectedSent = false;
    this.peerConnectionController.onIceConnectionStateChange = () => {
      if (!webRtcConnectedSent && ["connected", "completed"].includes(this.peerConnectionController.peerConnection.iceConnectionState)) {
        this.pixelStreaming._onWebRtcConnected();
        webRtcConnectedSent = true;
      }
    };
    this.peerConnectionController.onTrack = (trackEvent) => this.streamController.handleOnTrack(trackEvent);
    const BrowserSendOffer = this.config.isFlagEnabled(Flags.BrowserSendOffer);
    if (BrowserSendOffer) {
      this.sendrecvDataChannelController.createDataChannel(this.peerConnectionController.peerConnection, "cirrus", this.datachannelOptions);
      this.sendrecvDataChannelController.handleOnMessage = (ev) => this.handleOnMessage(ev);
      this.peerConnectionController.createOffer(this.sdpConstraints, this.config);
    }
  }
  /**
   * Checks the peer connection options for a turn server and returns true or false
   */
  checkTurnServerAvailability(options) {
    if (!options.iceServers) {
      Logger.Info("A turn sever was not found");
      return false;
    }
    for (const iceServer of options.iceServers) {
      for (const url of iceServer.urls) {
        if (url.includes("turn")) {
          Logger.Info(`A turn sever was found at ${url}`);
          return true;
        }
      }
    }
    Logger.Info("A turn sever was not found");
    return false;
  }
  /**
   * Handles when a Config Message is received contains the Peer Connection Options required (STUN and TURN Server Info)
   * @param messageConfig - Config Message received from the signaling server
   */
  handleOnConfigMessage(messageConfig) {
    this.resizePlayerStyle();
    this.startSession(messageConfig.peerConnectionOptions);
  }
  handlePingMessage(pingMessage) {
    this.protocol.sendMessage(message_helpers_exports.createMessage(signalling_messages_exports.pong, { time: pingMessage.time }));
  }
  /**
   * Handles when the signalling server gives us the list of streamer ids.
   */
  handleStreamerListMessage(messageStreamerList) {
    Logger.Info(`Got streamer list ${messageStreamerList.ids}`);
    let wantedStreamerId = "";
    const streamerIDOption = this.config.getSettingOption(OptionParameters.StreamerId);
    const existingSelection = streamerIDOption.selected.toString().trim();
    if (existingSelection) {
      wantedStreamerId = streamerIDOption.selected;
    }
    const settingOptions = [...messageStreamerList.ids];
    settingOptions.unshift("");
    this.config.setOptionSettingOptions(OptionParameters.StreamerId, settingOptions);
    let autoSelectedStreamerId = "";
    const waitForStreamer = this.config.isFlagEnabled(Flags.WaitForStreamer);
    const reconnectLimit = this.config.getNumericSettingValue(NumericParameters.MaxReconnectAttempts);
    const reconnectDelay = this.config.getNumericSettingValue(NumericParameters.StreamerAutoJoinInterval);
    const useUrlParams = this.config.useUrlParams;
    const urlParams = new IURLSearchParams(window.location.search);
    if (useUrlParams && urlParams.has(OptionParameters.StreamerId)) {
      wantedStreamerId = urlParams.get(OptionParameters.StreamerId);
    } else if (this.subscribedStream) {
      wantedStreamerId = this.subscribedStream;
    }
    if (wantedStreamerId && messageStreamerList.ids.includes(wantedStreamerId)) {
      autoSelectedStreamerId = wantedStreamerId;
    } else if ((!wantedStreamerId || !waitForStreamer) && messageStreamerList.ids.length == 1) {
      autoSelectedStreamerId = messageStreamerList.ids[0];
    }
    if (autoSelectedStreamerId) {
      this.reconnectAttempt = 0;
      this.isReconnecting = false;
      this.config.setOptionSettingValue(OptionParameters.StreamerId, autoSelectedStreamerId);
    } else {
      if (waitForStreamer) {
        if (this.reconnectAttempt < reconnectLimit) {
          this.reconnectAttempt++;
          this.isReconnecting = true;
          setTimeout(() => {
            this.protocol.sendMessage(message_helpers_exports.createMessage(signalling_messages_exports.listStreamers));
          }, reconnectDelay);
        } else {
          this.reconnectAttempt = 0;
          this.isReconnecting = false;
          this.enableAutoReconnect = false;
        }
      }
    }
    this.pixelStreaming.dispatchEvent(new StreamerListMessageEvent({
      messageStreamerList,
      autoSelectedStreamerId,
      wantedStreamerId
    }));
  }
  handleSubscribeFailedMessage(subscribeFailedMessage) {
    this.reconnectAttempt = 0;
    this.isReconnecting = false;
    this.enableAutoReconnect = false;
    this.pixelStreaming._onSubscribeFailed(subscribeFailedMessage.message);
  }
  handleStreamerIDChangedMessage(streamerIDChangedMessage) {
    const newID = streamerIDChangedMessage.newID;
    const streamerListOptions = this.config.getSettingOption(OptionParameters.StreamerId);
    const oldOnChange = streamerListOptions.onChange;
    streamerListOptions.onChange = () => {
    };
    const streamerList2 = streamerListOptions.options;
    for (let i = 0; i < streamerList2.length; ++i) {
      if (streamerList2[i] == this.subscribedStream) {
        streamerList2[i] = newID;
        break;
      }
    }
    streamerListOptions.options = streamerList2;
    streamerListOptions.selected = newID;
    streamerListOptions.onChange = oldOnChange;
    this.subscribedStream = streamerIDChangedMessage.newID;
    this.pixelStreaming.dispatchEvent(new StreamerIDChangedMessageEvent({
      newID
    }));
  }
  /**
   * Handle the RTC Answer from the signaling server
   * @param Answer - Answer SDP from the peer.
   */
  handleWebRtcAnswer(Answer) {
    Logger.Info(`Got answer sdp ${Answer.sdp}`);
    const sdpAnswer = {
      sdp: Answer.sdp,
      type: "answer"
    };
    this.peerConnectionController.receiveAnswer(sdpAnswer);
    this.handlePostWebrtcNegotiation();
  }
  /**
   * Handle the RTC offer from a WebRTC peer (received through the signalling server).
   * @param Offer - Offer SDP from the peer.
   */
  handleWebRtcOffer(Offer) {
    Logger.Info(`Got offer sdp ${Offer.sdp}`);
    this.isUsingSFU = Offer.sfu ? Offer.sfu : false;
    this.isUsingSVC = Offer.scalabilityMode ? Offer.scalabilityMode != "L1T1" : false;
    if (this.isUsingSFU || this.isUsingSVC) {
      this.peerConnectionController.preferredCodec = "";
    }
    const scalabilityMode = Offer.scalabilityMode ? Offer.scalabilityMode : "L1T1";
    let availableQualities = ["Default"];
    if (this.isUsingSFU) {
      if (!this.isUsingSVC) {
        availableQualities = ["High", "Medium", "Low"];
      } else {
        availableQualities = [];
        const maxSpatialLayers = +scalabilityMode[1];
        const maxTemporalLayers = +scalabilityMode[3];
        for (let s = 1; s <= maxSpatialLayers; s++) {
          for (let t = 1; t <= maxTemporalLayers; t++) {
            availableQualities.push(`S${s}T${t}`);
          }
        }
      }
    }
    this.config.setOptionSettingOptions(OptionParameters.PreferredQuality, availableQualities);
    this.config.setOptionSettingValue(OptionParameters.PreferredQuality, availableQualities[0]);
    const sdpOffer = {
      sdp: Offer.sdp,
      type: "offer"
    };
    this.peerConnectionController.receiveOffer(sdpOffer, this.config);
    this.handlePostWebrtcNegotiation();
  }
  /**
   * Handle when the SFU provides the peer with its data channels
   * @param DataChannels - The message from the SFU containing the data channels ids
   */
  handleWebRtcSFUPeerDatachannels(DataChannels) {
    const SendOptions = {
      ordered: true,
      negotiated: true,
      id: DataChannels.sendStreamId
    };
    const unidirectional = DataChannels.sendStreamId != DataChannels.recvStreamId;
    this.sendrecvDataChannelController.createDataChannel(this.peerConnectionController.peerConnection, unidirectional ? "send-datachannel" : "datachannel", SendOptions);
    if (unidirectional) {
      const RecvOptions = {
        ordered: true,
        negotiated: true,
        id: DataChannels.recvStreamId
      };
      this.recvDataChannelController.createDataChannel(this.peerConnectionController.peerConnection, "recv-datachannel", RecvOptions);
      this.recvDataChannelController.handleOnOpen = () => this.protocol.sendMessage(message_helpers_exports.createMessage(signalling_messages_exports.peerDataChannelsReady));
      this.recvDataChannelController.handleOnMessage = (ev) => this.handleOnMessage(ev);
    } else {
      this.sendrecvDataChannelController.handleOnMessage = (ev) => this.handleOnMessage(ev);
    }
  }
  handlePostWebrtcNegotiation() {
    this.afkController.startAfkWarningTimer();
    this.pixelStreaming._onWebRtcSdp();
    if (this.statsTimerHandle && this.statsTimerHandle !== void 0) {
      window.clearInterval(this.statsTimerHandle);
    }
    this.statsTimerHandle = window.setInterval(() => this.getStats(), 1e3);
    this.setMouseInputEnabled(this.config.isFlagEnabled(Flags.MouseInput));
    this.setKeyboardInputEnabled(this.config.isFlagEnabled(Flags.KeyboardInput));
    this.setGamePadInputEnabled(this.config.isFlagEnabled(Flags.GamepadInput));
  }
  /**
   * Handler for when a remote ICE candidate is received.
   * @param iceCandidateInit - Initialization data used to make the actual ICE Candidate.
   */
  handleIceCandidate(iceCandidateInit) {
    Logger.Info(`Remote ICE candidate information received: ${JSON.stringify(iceCandidateInit)}`);
    const remoteIceCandidate = new RTCIceCandidate({
      candidate: iceCandidateInit.candidate,
      sdpMLineIndex: 0
    });
    this.peerConnectionController.handleOnIce(remoteIceCandidate);
  }
  /**
   * Send the ice Candidate to the signaling server via websocket
   * @param iceEvent - RTC Peer ConnectionIceEvent) {
   */
  handleSendIceCandidate(iceEvent) {
    if (iceEvent.candidate && iceEvent.candidate.candidate) {
      Logger.Info(`Local ICE candidate generated: ` + JSON.stringify(iceEvent.candidate));
      this.protocol.sendMessage(message_helpers_exports.createMessage(signalling_messages_exports.iceCandidate, { candidate: iceEvent.candidate }));
    }
  }
  /**
   * Send the ice Candidate to the signaling server via websocket
   * @param iceEvent - RTC Peer ConnectionIceEvent) {
   */
  handleDataChannel(datachannelEvent) {
    Logger.Info("Data channel created for us by browser as we are a receiving peer.");
    this.sendrecvDataChannelController.dataChannel = datachannelEvent.channel;
    this.sendrecvDataChannelController.setupDataChannel();
    this.sendrecvDataChannelController.handleOnMessage = (ev) => this.handleOnMessage(ev);
  }
  /**
   * Send the RTC Offer Session to the Signaling server via websocket
   * @param offer - RTC Session Description
   */
  handleSendWebRTCOffer(offer2) {
    if (offer2.type !== "offer") {
      Logger.Error(`handleSendWebRTCOffer was called with type ${offer2.type} - it only expects "offer"`);
      return;
    }
    Logger.Info("Sending the offer to the Server");
    const extraParams = {
      sdp: offer2.sdp,
      minBitrateBps: 1e3 * this.config.getNumericSettingValue(NumericParameters.WebRTCMinBitrate),
      maxBitrateBps: 1e3 * this.config.getNumericSettingValue(NumericParameters.WebRTCMaxBitrate)
    };
    this.protocol.sendMessage(message_helpers_exports.createMessage(signalling_messages_exports.offer, extraParams));
    this.pixelStreaming._onWebRtcSdpOffer(offer2);
  }
  /**
   * Send the RTC Offer Session to the Signaling server via websocket
   * @param answer - RTC Session Description
   */
  handleSendWebRTCAnswer(answer2) {
    if (answer2.type !== "answer") {
      Logger.Error(`handleSendWebRTCAnswer was called with type ${answer2.type} - it only expects "answer"`);
      return;
    }
    Logger.Info("Sending the answer to the Server");
    const extraParams = {
      sdp: answer2.sdp,
      minBitrateBps: 1e3 * this.config.getNumericSettingValue(NumericParameters.WebRTCMinBitrate),
      maxBitrateBps: 1e3 * this.config.getNumericSettingValue(NumericParameters.WebRTCMaxBitrate)
    };
    this.protocol.sendMessage(message_helpers_exports.createMessage(signalling_messages_exports.answer, extraParams));
    if (this.isUsingSFU) {
      this.protocol.sendMessage(message_helpers_exports.createMessage(signalling_messages_exports.dataChannelRequest));
    }
    this.pixelStreaming._onWebRtcSdpAnswer(answer2);
  }
  /**
   * Set the freeze frame overlay to the player div
   */
  setUpMouseAndFreezeFrame() {
    const playerElement = this.videoPlayer.getVideoParentElement();
    const videoElement = this.videoPlayer.getVideoElement();
    this.coordinateConverter.reconfigure({ width: playerElement.clientWidth, height: playerElement.clientHeight }, { width: videoElement.videoWidth, height: videoElement.videoHeight });
    this.freezeFrameController.freezeFrame.resize();
  }
  /**
   * Close the Connection to the signaling server
   */
  closeSignalingServer(message, allowReconnect) {
    var _a;
    this.locallyClosed = true;
    this.enableAutoReconnect = allowReconnect;
    this.disconnectMessage = message;
    (_a = this.protocol) === null || _a === void 0 ? void 0 : _a.disconnect(1e3, message);
  }
  /**
   * Close the peer connection
   */
  closePeerConnection() {
    var _a;
    (_a = this.peerConnectionController) === null || _a === void 0 ? void 0 : _a.close();
  }
  /**
   * Close all connections
   */
  close() {
    this.closeSignalingServer("", false);
    this.closePeerConnection();
  }
  /**
   * Fires a Video Stats Event in the RTC Peer Connection
   */
  getStats() {
    this.peerConnectionController.generateStats();
  }
  /**
   * Send a Latency Test Request to the UE Instance
   */
  sendLatencyTest() {
    this.latencyStartTime = Date.now();
    this.streamMessageController.toStreamerHandlers.get("LatencyTest")([
      JSON.stringify({
        StartTime: this.latencyStartTime
      })
    ]);
  }
  /**
   * Send a Data Channel Latency Test Request to the UE Instance
   */
  sendDataChannelLatencyTest(descriptor) {
    this.streamMessageController.toStreamerHandlers.get("DataChannelLatencyTest")([
      JSON.stringify(descriptor)
    ]);
  }
  /**
   * Send the MinQP encoder setting to the UE Instance.
   * @param minQP - The lower bound for QP when encoding
   * valid values are (1-51) where:
   * 1 = Best quality but highest bitrate.
   * 51 = Worst quality but lowest bitrate.
   * By default the minQP is 1 meaning the encoder is free
   * to aim for the best quality it can on the given network link.
   */
  sendEncoderMinQP(minQP) {
    Logger.Info(`MinQP=${minQP}
`);
    if (minQP != null) {
      this.streamMessageController.toStreamerHandlers.get("Command")([
        JSON.stringify({
          "Encoder.MinQP": minQP
        })
      ]);
    }
  }
  /**
   * Send the MaxQP encoder setting to the UE Instance.
   * @param maxQP - The upper bound for QP when encoding
   * valid values are (1-51) where:
   * 1 = Best quality but highest bitrate.
   * 51 = Worst quality but lowest bitrate.
   * By default the maxQP is 51 meaning the encoder is free
   * to drop quality as low as needed on the given network link.
   */
  sendEncoderMaxQP(maxQP) {
    Logger.Info(`MaxQP=${maxQP}
`);
    if (maxQP != null) {
      this.streamMessageController.toStreamerHandlers.get("Command")([
        JSON.stringify({
          "Encoder.MaxQP": maxQP
        })
      ]);
    }
  }
  /**
   * Send the MinQuality encoder setting to the UE Instance.
   * @param minQuality - The lower bound for quality when encoding
   * valid values are (0-100) where:
   * 0 = Worst quality.
   * 100 = Best quality.
   */
  sendEncoderMinQuality(minQuality) {
    Logger.Info(`MinQuality=${minQuality}
`);
    if (minQuality != null) {
      this.streamMessageController.toStreamerHandlers.get("Command")([
        JSON.stringify({
          "Encoder.MinQuality": minQuality
        })
      ]);
    }
  }
  /**
   * Send the MaxQuality encoder setting to the UE Instance.
   * @param maxQuality - The upper bound for quality when encoding
   * valid values are (0-100) where:
   * 0 = Worst quality.
   * 100 = Best quality.
   */
  sendEncoderMaxQuality(maxQuality) {
    Logger.Info(`MaxQuality=${maxQuality}
`);
    if (maxQuality != null) {
      this.streamMessageController.toStreamerHandlers.get("Command")([
        JSON.stringify({
          "Encoder.MaxQuality": maxQuality
        })
      ]);
    }
  }
  /**
   * Send the { WebRTC.MinBitrate: SomeNumber }} command to UE to set
   * the minimum bitrate that we allow WebRTC to use
   * (note setting this too high in poor networks can be problematic).
   * @param minBitrate - The minimum bitrate we would like WebRTC to not fall below.
   */
  sendWebRTCMinBitrate(minBitrate) {
    Logger.Info(`WebRTC Min Bitrate=${minBitrate}`);
    if (minBitrate != null) {
      this.streamMessageController.toStreamerHandlers.get("Command")([
        JSON.stringify({
          "WebRTC.MinBitrate": minBitrate
        })
      ]);
    }
  }
  /**
   * Send the { WebRTC.MaxBitrate: SomeNumber }} command to UE to set
   * the minimum bitrate that we allow WebRTC to use
   * (note setting this too low could result in blocky video).
   * @param minBitrate - The minimum bitrate we would like WebRTC to not fall below.
   */
  sendWebRTCMaxBitrate(maxBitrate) {
    Logger.Info(`WebRTC Max Bitrate=${maxBitrate}`);
    if (maxBitrate != null) {
      this.streamMessageController.toStreamerHandlers.get("Command")([
        JSON.stringify({
          "WebRTC.MaxBitrate": maxBitrate
        })
      ]);
    }
  }
  /**
   * Send the { WebRTC.Fps: SomeNumber }} UE 5.0+
   * and { WebRTC.MaxFps } UE 4.27 command to set
   * the maximum fps we would like WebRTC to stream at.
   * @param fps - The maximum stream fps.
   */
  sendWebRTCFps(fps) {
    Logger.Info(`WebRTC FPS=${fps}`);
    if (fps != null) {
      this.streamMessageController.toStreamerHandlers.get("Command")([
        JSON.stringify({ "WebRTC.Fps": fps })
      ]);
      this.streamMessageController.toStreamerHandlers.get("Command")([
        JSON.stringify({ "WebRTC.MaxFps": fps })
      ]);
    }
  }
  /**
   * Sends the UI Descriptor `stat fps` to the UE Instance
   */
  sendShowFps() {
    Logger.Info("----   Sending show stat to UE   ----");
    this.streamMessageController.toStreamerHandlers.get("Command")([JSON.stringify({ "stat.fps": "" })]);
  }
  /**
   * Send an Iframe request to the streamer
   */
  sendIframeRequest() {
    Logger.Info("----   Sending Request for an IFrame  ----");
    this.streamMessageController.toStreamerHandlers.get("IFrameRequest")();
  }
  /**
   * Send a UIInteraction message
   */
  emitUIInteraction(descriptor) {
    Logger.Info("----   Sending custom UIInteraction message   ----");
    this.streamMessageController.toStreamerHandlers.get("UIInteraction")([JSON.stringify(descriptor)]);
  }
  /**
   * Send a Command message
   */
  emitCommand(descriptor) {
    Logger.Info("----   Sending custom Command message   ----");
    this.streamMessageController.toStreamerHandlers.get("Command")([JSON.stringify(descriptor)]);
  }
  /**
   * Send a console command message
   */
  emitConsoleCommand(command) {
    Logger.Info("----   Sending custom Command:ConsoleCommand message   ----");
    this.streamMessageController.toStreamerHandlers.get("Command")([
      JSON.stringify({
        ConsoleCommand: command
      })
    ]);
  }
  /**
   * Sends a request to the UE Instance to have ownership of Quality
   */
  sendRequestQualityControlOwnership() {
    Logger.Info("----   Sending Request to Control Quality  ----");
    this.toStreamerMessagesController.SendRequestQualityControl();
  }
  /**
   * Send a `TextBoxEntry` message back to UE.
   * @param contents The new contents of the UE side text box.
   */
  sendTextboxEntry(contents) {
    var _a;
    Logger.Info("----   Sending TextboxEntry message  ----");
    (_a = this.streamMessageController.toStreamerHandlers.get("TextboxEntry")) === null || _a === void 0 ? void 0 : _a([contents]);
  }
  /**
   * Handles when a Latency Test Result are received from the UE Instance
   * @param message - Latency Test Timings
   */
  handleLatencyTestResult(message) {
    Logger.Info("DataChannelReceiveMessageType.latencyTest");
    const latencyAsString = new TextDecoder("utf-16").decode(message.slice(1));
    const latencyTestResults = new LatencyTestResults();
    Object.assign(latencyTestResults, JSON.parse(latencyAsString));
    latencyTestResults.processFields();
    latencyTestResults.testStartTimeMs = this.latencyStartTime;
    latencyTestResults.browserReceiptTimeMs = Date.now();
    latencyTestResults.latencyExcludingDecode = ~~(latencyTestResults.browserReceiptTimeMs - latencyTestResults.testStartTimeMs);
    latencyTestResults.testDuration = ~~(latencyTestResults.TransmissionTimeMs - latencyTestResults.ReceiptTimeMs);
    latencyTestResults.networkLatency = ~~(latencyTestResults.latencyExcludingDecode - latencyTestResults.testDuration);
    if (latencyTestResults.frameDisplayDeltaTimeMs && latencyTestResults.browserReceiptTimeMs) {
      latencyTestResults.endToEndLatency = ~~(latencyTestResults.frameDisplayDeltaTimeMs + latencyTestResults.networkLatency, +latencyTestResults.CaptureToSendMs);
    }
    this.pixelStreaming._onLatencyTestResult(latencyTestResults);
  }
  /**
   * Handles when a Data Channel Latency Test Response is received from the UE Instance
   * @param message - Data Channel Latency Test Response
   */
  handleDataChannelLatencyTestResponse(message) {
    Logger.Info("DataChannelReceiveMessageType.dataChannelLatencyResponse");
    const responseAsString = new TextDecoder("utf-16").decode(message.slice(1));
    const latencyTestResponse = JSON.parse(responseAsString);
    this.pixelStreaming._onDataChannelLatencyTestResponse(latencyTestResponse);
  }
  /**
   * Handles when the Encoder and Web RTC Settings are received from the UE Instance
   * @param message - Initial Encoder and Web RTC Settings
   */
  handleInitialSettings(message) {
    Logger.Info("DataChannelReceiveMessageType.InitialSettings");
    const payloadAsString = new TextDecoder("utf-16").decode(message.slice(1));
    const parsedInitialSettings = JSON.parse(payloadAsString);
    const initialSettings = new InitialSettings();
    if (parsedInitialSettings.Encoder) {
      initialSettings.EncoderSettings = parsedInitialSettings.Encoder;
    }
    if (parsedInitialSettings.WebRTC) {
      initialSettings.WebRTCSettings = parsedInitialSettings.WebRTC;
    }
    if (parsedInitialSettings.PixelStreaming) {
      initialSettings.PixelStreamingSettings = parsedInitialSettings.PixelStreaming;
    }
    if (parsedInitialSettings.ConfigOptions && parsedInitialSettings.ConfigOptions.DefaultToHover !== void 0) {
      this.config.setFlagEnabled(Flags.HoveringMouseMode, !!parsedInitialSettings.ConfigOptions.DefaultToHover);
    }
    initialSettings.ueCompatible();
    Logger.Info(payloadAsString);
    this.pixelStreaming._onInitialSettings(initialSettings);
  }
  /**
   * Handles when the Quantization Parameter are received from the UE Instance
   * @param message - Encoders Quantization Parameter
   */
  handleVideoEncoderAvgQP(message) {
    Logger.Info("DataChannelReceiveMessageType.VideoEncoderAvgQP");
    const AvgQP = Number(new TextDecoder("utf-16").decode(message.slice(1)));
    this.setVideoEncoderAvgQP(AvgQP);
  }
  /**
   * Handles when the video element has been loaded with a srcObject
   */
  handleVideoInitialized() {
    this.pixelStreaming._onVideoInitialized();
    this.autoPlayVideoOrSetUpPlayOverlay();
    this.resizePlayerStyle();
    this.videoPlayer.updateVideoStreamSize();
  }
  /**
   * Flag set if the user has Quality Ownership
   * @param message - Does the current client have Quality Ownership
   */
  onQualityControlOwnership(message) {
    const view = new Uint8Array(message);
    Logger.Info("DataChannelReceiveMessageType.QualityControlOwnership");
    this.isQualityController = new Boolean(view[1]).valueOf();
    Logger.Info(`Received quality controller message, will control quality: ${this.isQualityController}`);
    this.pixelStreaming._onQualityControlOwnership(this.isQualityController);
  }
  /**
   * Handles when the Aggregated stats are Collected
   * @param stats - Aggregated Stats
   */
  handleVideoStats(stats2) {
    this.pixelStreaming._onVideoStats(stats2);
  }
  /**
   * To Resize the Video Player element
   */
  resizePlayerStyle() {
    this.videoPlayer.resizePlayerStyle();
  }
  setPreferredCodec(codec) {
    this.preferredCodec = codec;
    if (this.peerConnectionController) {
      this.peerConnectionController.preferredCodec = codec;
      this.peerConnectionController.updateCodecSelection = false;
    }
  }
  setVideoEncoderAvgQP(avgQP) {
    this.videoAvgQp = avgQP;
    this.pixelStreaming._onVideoEncoderAvgQP(this.videoAvgQp);
  }
  /**
   * enables/disables keyboard event listeners
   */
  setKeyboardInputEnabled(isEnabled) {
    var _a;
    (_a = this.keyboardController) === null || _a === void 0 ? void 0 : _a.unregister();
    if (isEnabled) {
      this.keyboardController = this.inputClassesFactory.registerKeyBoard(this.config);
    }
  }
  /**
   * enables/disables mouse event listeners
   */
  setMouseInputEnabled(isEnabled) {
    var _a;
    (_a = this.mouseController) === null || _a === void 0 ? void 0 : _a.unregister();
    if (isEnabled) {
      const mouseMode = this.config.isFlagEnabled(Flags.HoveringMouseMode) ? ControlSchemeType.HoveringMouse : ControlSchemeType.LockedMouse;
      this.mouseController = this.inputClassesFactory.registerMouse(mouseMode);
    }
  }
  /**
   * enables/disables touch event listeners
   */
  setTouchInputEnabled(isEnabled) {
    var _a;
    (_a = this.touchController) === null || _a === void 0 ? void 0 : _a.unregister();
    if (isEnabled) {
      this.touchController = this.inputClassesFactory.registerTouch(this.config.isFlagEnabled(Flags.FakeMouseWithTouches));
    }
  }
  /**
   * enables/disables game pad event listeners
   */
  setGamePadInputEnabled(isEnabled) {
    var _a;
    (_a = this.gamePadController) === null || _a === void 0 ? void 0 : _a.unregister();
    if (isEnabled) {
      this.gamePadController = this.inputClassesFactory.registerGamePad();
    }
  }
  registerDataChannelEventEmitters(dataChannel) {
    dataChannel.onOpen = (label, event) => this.pixelStreaming.dispatchEvent(new DataChannelOpenEvent({ label, event }));
    dataChannel.onClose = (label, event) => this.pixelStreaming.dispatchEvent(new DataChannelCloseEvent({ label, event }));
    dataChannel.onError = (label, event) => this.pixelStreaming.dispatchEvent(new DataChannelErrorEvent({ label, event }));
  }
  registerMessageHandler(name, direction, handler) {
    if (direction === MessageDirection.FromStreamer && typeof handler === "undefined") {
      Logger.Warning(`Unable to register handler for ${name} as no handler was passed`);
    }
    this.streamMessageController.registerMessageHandler(direction, name, (data) => typeof handler === "undefined" && direction === MessageDirection.ToStreamer ? this.sendMessageController.sendMessageToStreamer(name, data) : handler(data));
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/Inputs/XRGamepadController.js
var XRGamepadController = class {
  /**
   * @param toStreamerMessagesProvider - Stream message instance
   */
  constructor(toStreamerMessagesProvider) {
    this.toStreamerMessagesProvider = toStreamerMessagesProvider;
    this.controllers = [];
  }
  updateStatus(source, frame, refSpace) {
    if (source.gamepad) {
      const gamepadPose = frame.getPose(source.gripSpace, refSpace);
      if (!gamepadPose) {
        return;
      }
      let system = 0;
      if (source.profiles.includes("htc-vive")) {
        system = 1;
      } else if (source.profiles.includes("oculus-touch")) {
        system = 2;
      }
      this.toStreamerMessagesProvider.toStreamerHandlers.get("XRSystem")([system]);
      let handedness = 2;
      switch (source.handedness) {
        case "left":
          handedness = 0;
          break;
        case "right":
          handedness = 1;
          break;
      }
      const matrix = gamepadPose.transform.matrix;
      const mat = [];
      for (let i = 0; i < 16; i++) {
        mat[i] = new Float32Array([matrix[i]])[0];
      }
      this.toStreamerMessagesProvider.toStreamerHandlers.get("XRControllerTransform")([
        mat[0],
        mat[4],
        mat[8],
        mat[12],
        mat[1],
        mat[5],
        mat[9],
        mat[13],
        mat[2],
        mat[6],
        mat[10],
        mat[14],
        mat[3],
        mat[7],
        mat[11],
        mat[15],
        handedness
      ]);
      if (this.controllers[handedness] === void 0) {
        this.controllers[handedness] = {
          prevState: void 0,
          currentState: void 0,
          id: void 0
        };
        this.controllers[handedness].prevState = deepCopyGamepad(source.gamepad);
      }
      this.controllers[handedness].currentState = deepCopyGamepad(source.gamepad);
      const controller = this.controllers[handedness];
      const currState = controller.currentState;
      const prevState = controller.prevState;
      for (let i = 0; i < currState.buttons.length; i++) {
        const currButton = currState.buttons[i];
        const prevButton = prevState.buttons[i];
        if (currButton.pressed) {
          const isRepeat = prevButton.pressed ? 1 : 0;
          this.toStreamerMessagesProvider.toStreamerHandlers.get("XRButtonPressed")([
            handedness,
            i,
            isRepeat,
            currButton.value
          ]);
        } else if (prevButton.pressed) {
          this.toStreamerMessagesProvider.toStreamerHandlers.get("XRButtonReleased")([
            handedness,
            i,
            0
          ]);
        }
        if (currButton.touched) {
          const isRepeat = prevButton.touched ? 1 : 0;
          this.toStreamerMessagesProvider.toStreamerHandlers.get("XRButtonTouched")([
            handedness,
            i,
            isRepeat
          ]);
        } else if (prevButton.touched) {
          this.toStreamerMessagesProvider.toStreamerHandlers.get("XRButtonTouchReleased")([
            handedness,
            i,
            0
          ]);
        }
      }
      for (let i = 0; i < currState.axes.length; i++) {
        const curAxisValue = currState.axes[i];
        const prevAxisValue = prevState.axes[i];
        if (curAxisValue != prevAxisValue) {
          this.toStreamerMessagesProvider.toStreamerHandlers.get("XRAnalog")([
            handedness,
            i,
            curAxisValue
          ]);
        }
      }
      this.controllers[handedness].prevState = currState;
    }
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/WebXR/WebXRController.js
var WebXRController = class {
  constructor(webRtcPlayerController) {
    this.xrViewerPose = null;
    this.EPSILON = 1e-7;
    this.videoTexture = null;
    this.prevVideoWidth = 0;
    this.prevVideoHeight = 0;
    this.leftView = null;
    this.rightView = null;
    this.lastSentLeftEyeProj = null;
    this.lastSentRightEyeProj = null;
    this.lastSentRelativeLeftEyePos = null;
    this.lastSentRelativeRightEyePos = null;
    this.xrSession = null;
    this.webRtcController = webRtcPlayerController;
    this.xrGamepadController = new XRGamepadController(this.webRtcController.streamMessageController);
    this.onSessionEnded = new EventTarget();
    this.onSessionStarted = new EventTarget();
    this.onFrame = new EventTarget();
  }
  xrClicked() {
    if (!this.xrSession) {
      if (!navigator.xr) {
        Logger.Error("This browser does not support XR.");
        return;
      }
      navigator.xr.requestSession("immersive-vr", { optionalFeatures: [] }).then((session) => {
        this.onXrSessionStarted(session);
      });
    } else {
      this.xrSession.end();
    }
  }
  onXrSessionEnded() {
    Logger.Info("XR Session ended");
    this.xrSession = null;
    this.onSessionEnded.dispatchEvent(new Event("xrSessionEnded"));
  }
  initGL() {
    if (this.gl) {
      return;
    }
    const canvas = document.createElement("canvas");
    this.gl = canvas.getContext("webgl2", {
      xrCompatible: true
    });
    this.gl.clearColor(0, 0, 0, 1);
  }
  initShaders() {
    const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;

        // varyings
        varying vec2 v_texCoord;

        void main() {
           gl_Position = vec4(a_position.x, a_position.y, 0, 1);
           // pass the texCoord to the fragment shader
           // The GPU will interpolate this value between points.
           v_texCoord = a_texCoord;
        }
        `;
    const fragmentShaderSource = `
        precision mediump float;

        // our texture
        uniform sampler2D u_image;

        // the texCoords passed in from the vertex shader.
        varying vec2 v_texCoord;

        void main() {
           gl_FragColor = texture2D(u_image, v_texCoord);
        }
        `;
    const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(vertexShader, vertexShaderSource);
    this.gl.compileShader(vertexShader);
    const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(fragmentShader, fragmentShaderSource);
    this.gl.compileShader(fragmentShader);
    const shaderProgram = this.gl.createProgram();
    this.gl.attachShader(shaderProgram, vertexShader);
    this.gl.attachShader(shaderProgram, fragmentShader);
    this.gl.linkProgram(shaderProgram);
    this.gl.useProgram(shaderProgram);
    this.positionLocation = this.gl.getAttribLocation(shaderProgram, "a_position");
    this.texcoordLocation = this.gl.getAttribLocation(shaderProgram, "a_texCoord");
  }
  updateVideoTexture() {
    if (!this.videoTexture) {
      this.videoTexture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.videoTexture);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    }
    const videoHeight = this.webRtcController.videoPlayer.getVideoElement().videoHeight;
    const videoWidth = this.webRtcController.videoPlayer.getVideoElement().videoWidth;
    if (this.prevVideoHeight != videoHeight || this.prevVideoWidth != videoWidth) {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, videoWidth, videoHeight, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.webRtcController.videoPlayer.getVideoElement());
    } else {
      this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, 0, 0, videoWidth, videoHeight, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.webRtcController.videoPlayer.getVideoElement());
    }
    this.prevVideoHeight = videoHeight;
    this.prevVideoWidth = videoWidth;
  }
  initBuffers() {
    {
      this.positionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.enableVertexAttribArray(this.positionLocation);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
        -1,
        1,
        1,
        1,
        -1,
        -1,
        -1,
        -1,
        1,
        1,
        1,
        -1
      ]), this.gl.STATIC_DRAW);
      this.gl.vertexAttribPointer(
        this.positionLocation,
        2,
        this.gl.FLOAT,
        false,
        0,
        0
        /*offset*/
      );
    }
    {
      this.texcoordBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
      this.gl.enableVertexAttribArray(this.texcoordLocation);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), this.gl.STATIC_DRAW);
      this.gl.vertexAttribPointer(
        this.texcoordLocation,
        2,
        this.gl.FLOAT,
        false,
        0,
        0
        /*offset*/
      );
    }
  }
  onXrSessionStarted(session) {
    Logger.Info("XR Session started");
    this.xrSession = session;
    this.xrSession.addEventListener("end", () => {
      this.onXrSessionEnded();
    });
    this.initGL();
    this.initShaders();
    this.initBuffers();
    session.requestReferenceSpace("local").then((refSpace) => {
      this.xrRefSpace = refSpace;
      this.xrSession.updateRenderState({
        baseLayer: new XRWebGLLayer(this.xrSession, this.gl)
      });
      if (this.xrSession.supportedFrameRates) {
        for (const frameRate of this.xrSession.supportedFrameRates) {
          if (frameRate == 90) {
            session.updateTargetFrameRate(90);
          }
        }
      }
      this.xrSession.requestAnimationFrame(this.onXrFrame.bind(this));
    });
    this.onSessionStarted.dispatchEvent(new Event("xrSessionStarted"));
  }
  areArraysEqual(a, b) {
    return a.length === b.length && a.every((element, index) => Math.abs(element - b[index]) <= this.EPSILON);
  }
  arePointsEqual(a, b) {
    return Math.abs(a.x - b.x) >= this.EPSILON && Math.abs(a.y - b.y) >= this.EPSILON && Math.abs(a.z - b.z) >= this.EPSILON;
  }
  sendXRDataToUE() {
    if (this.leftView == null || this.rightView == null) {
      return;
    }
    let shouldSendEyeViews = this.lastSentLeftEyeProj == null || this.lastSentRightEyeProj == null || this.lastSentRelativeLeftEyePos == null || this.lastSentRelativeRightEyePos == null;
    const leftEyeTrans = this.leftView.transform.matrix;
    const leftEyeProj = this.leftView.projectionMatrix;
    const rightEyeTrans = this.rightView.transform.matrix;
    const rightEyeProj = this.rightView.projectionMatrix;
    const hmdTrans = this.xrViewerPose.transform.matrix;
    if (!shouldSendEyeViews && this.lastSentLeftEyeProj != null && this.lastSentRightEyeProj != null) {
      const leftEyeProjUnchanged = this.areArraysEqual(leftEyeProj, this.lastSentLeftEyeProj);
      const rightEyeProjUnchanged = this.areArraysEqual(rightEyeProj, this.lastSentRightEyeProj);
      shouldSendEyeViews = leftEyeProjUnchanged == false || rightEyeProjUnchanged == false;
    }
    const leftEyeRelativePos = new DOMPointReadOnly(this.leftView.transform.position.x - this.xrViewerPose.transform.position.x, this.leftView.transform.position.y - this.xrViewerPose.transform.position.y, this.leftView.transform.position.z - this.xrViewerPose.transform.position.z, 1);
    const rightEyeRelativePos = new DOMPointReadOnly(this.leftView.transform.position.x - this.xrViewerPose.transform.position.x, this.leftView.transform.position.y - this.xrViewerPose.transform.position.y, this.leftView.transform.position.z - this.xrViewerPose.transform.position.z, 1);
    if (!shouldSendEyeViews && this.lastSentRelativeLeftEyePos != null && this.lastSentRelativeRightEyePos != null) {
      const leftEyePosUnchanged = this.arePointsEqual(leftEyeRelativePos, this.lastSentRelativeLeftEyePos);
      const rightEyePosUnchanged = this.arePointsEqual(rightEyeRelativePos, this.lastSentRelativeRightEyePos);
      shouldSendEyeViews = leftEyePosUnchanged == false || rightEyePosUnchanged == false;
    }
    if (shouldSendEyeViews) {
      this.webRtcController.streamMessageController.toStreamerHandlers.get("XREyeViews")([
        // Left eye 4x4 transform matrix
        leftEyeTrans[0],
        leftEyeTrans[4],
        leftEyeTrans[8],
        leftEyeTrans[12],
        leftEyeTrans[1],
        leftEyeTrans[5],
        leftEyeTrans[9],
        leftEyeTrans[13],
        leftEyeTrans[2],
        leftEyeTrans[6],
        leftEyeTrans[10],
        leftEyeTrans[14],
        leftEyeTrans[3],
        leftEyeTrans[7],
        leftEyeTrans[11],
        leftEyeTrans[15],
        // Left eye 4x4 projection matrix
        leftEyeProj[0],
        leftEyeProj[4],
        leftEyeProj[8],
        leftEyeProj[12],
        leftEyeProj[1],
        leftEyeProj[5],
        leftEyeProj[9],
        leftEyeProj[13],
        leftEyeProj[2],
        leftEyeProj[6],
        leftEyeProj[10],
        leftEyeProj[14],
        leftEyeProj[3],
        leftEyeProj[7],
        leftEyeProj[11],
        leftEyeProj[15],
        // Right eye 4x4 transform matrix
        rightEyeTrans[0],
        rightEyeTrans[4],
        rightEyeTrans[8],
        rightEyeTrans[12],
        rightEyeTrans[1],
        rightEyeTrans[5],
        rightEyeTrans[9],
        rightEyeTrans[13],
        rightEyeTrans[2],
        rightEyeTrans[6],
        rightEyeTrans[10],
        rightEyeTrans[14],
        rightEyeTrans[3],
        rightEyeTrans[7],
        rightEyeTrans[11],
        rightEyeTrans[15],
        // right eye 4x4 projection matrix
        rightEyeProj[0],
        rightEyeProj[4],
        rightEyeProj[8],
        rightEyeProj[12],
        rightEyeProj[1],
        rightEyeProj[5],
        rightEyeProj[9],
        rightEyeProj[13],
        rightEyeProj[2],
        rightEyeProj[6],
        rightEyeProj[10],
        rightEyeProj[14],
        rightEyeProj[3],
        rightEyeProj[7],
        rightEyeProj[11],
        rightEyeProj[15],
        // HMD 4x4 transform
        hmdTrans[0],
        hmdTrans[4],
        hmdTrans[8],
        hmdTrans[12],
        hmdTrans[1],
        hmdTrans[5],
        hmdTrans[9],
        hmdTrans[13],
        hmdTrans[2],
        hmdTrans[6],
        hmdTrans[10],
        hmdTrans[14],
        hmdTrans[3],
        hmdTrans[7],
        hmdTrans[11],
        hmdTrans[15]
      ]);
      this.lastSentLeftEyeProj = leftEyeProj;
      this.lastSentRightEyeProj = rightEyeProj;
      this.lastSentRelativeLeftEyePos = leftEyeRelativePos;
      this.lastSentRelativeRightEyePos = rightEyeRelativePos;
    } else {
      this.webRtcController.streamMessageController.toStreamerHandlers.get("XRHMDTransform")([
        // HMD 4x4 transform
        hmdTrans[0],
        hmdTrans[4],
        hmdTrans[8],
        hmdTrans[12],
        hmdTrans[1],
        hmdTrans[5],
        hmdTrans[9],
        hmdTrans[13],
        hmdTrans[2],
        hmdTrans[6],
        hmdTrans[10],
        hmdTrans[14],
        hmdTrans[3],
        hmdTrans[7],
        hmdTrans[11],
        hmdTrans[15]
      ]);
    }
  }
  onXrFrame(time, frame) {
    this.xrViewerPose = frame.getViewerPose(this.xrRefSpace);
    if (this.xrViewerPose) {
      this.updateViews();
      if (this.leftView == null || this.rightView == null) {
        return;
      }
      this.sendXRDataToUE();
      this.updateVideoTexture();
      this.render();
    }
    if (this.webRtcController.config.isFlagEnabled(Flags.XRControllerInput)) {
      this.xrSession.inputSources.forEach((source, _index, _array) => {
        this.xrGamepadController.updateStatus(source, frame, this.xrRefSpace);
      }, this);
    }
    this.xrSession.requestAnimationFrame((time2, frame2) => this.onXrFrame(time2, frame2));
    this.onFrame.dispatchEvent(new XrFrameEvent({ time, frame }));
  }
  updateViews() {
    if (!this.xrViewerPose) {
      return;
    }
    for (const view of this.xrViewerPose.views) {
      if (view.eye === "left") {
        this.leftView = view;
      } else if (view.eye === "right") {
        this.rightView = view;
      }
    }
  }
  render() {
    if (!this.gl) {
      return;
    }
    const glLayer = this.xrSession.renderState.baseLayer;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, glLayer.framebuffer);
    this.gl.viewport(0, 0, glLayer.framebufferWidth, glLayer.framebufferHeight);
    this.gl.drawArrays(
      this.gl.TRIANGLES,
      0,
      6
      /*count*/
    );
  }
  static isSessionSupported(mode) {
    if (location.protocol !== "https:") {
      Logger.Info("WebXR requires https, if you want WebXR use https.");
    }
    if (navigator.xr) {
      return navigator.xr.isSessionSupported(mode);
    } else {
      return new Promise(() => {
        return false;
      });
    }
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/DataChannel/DataChannelLatencyTestResults.js
var DataChannelLatencyTestRecord = class {
  constructor(request) {
    this.seq = request.Seq;
    this.playerSentTimestamp = Date.now();
    this.requestFillerSize = request.Filler ? request.Filler.length : 0;
  }
  update(response) {
    this.playerReceivedTimestamp = Date.now();
    this.streamerReceivedTimestamp = response.ReceivedTimestamp;
    this.streamerSentTimestamp = response.SentTimestamp;
    this.responseFillerSize = response.Filler ? response.Filler.length : 0;
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/DataChannel/DataChannelLatencyTestController.js
var DataChannelLatencyTestController = class {
  constructor(sink, callback) {
    this.intervalHandle = void 0;
    this.sink = sink;
    this.callback = callback;
    this.records = /* @__PURE__ */ new Map();
    this.seq = 0;
  }
  start(config2) {
    if (this.isRunning()) {
      return false;
    }
    this.startTime = Date.now();
    this.records.clear();
    this.intervalHandle = window.setInterval((() => {
      if (Date.now() - this.startTime >= config2.duration) {
        this.stop();
      } else {
        this.sendRequest(config2.requestSize, config2.responseSize);
      }
    }).bind(this), Math.floor(1e3 / config2.rps));
    return true;
  }
  stop() {
    if (this.intervalHandle) {
      window.clearInterval(this.intervalHandle);
      this.intervalHandle = void 0;
      this.callback(this.produceResult());
    }
  }
  produceResult() {
    const resultRecords = new Map(this.records);
    return {
      records: resultRecords,
      dataChannelRtt: Math.ceil(Array.from(this.records.values()).reduce((acc, next) => {
        return acc + (next.playerReceivedTimestamp - next.playerSentTimestamp);
      }, 0) / this.records.size),
      playerToStreamerTime: Math.ceil(Array.from(this.records.values()).reduce((acc, next) => {
        return acc + (next.streamerReceivedTimestamp - next.playerSentTimestamp);
      }, 0) / this.records.size),
      streamerToPlayerTime: Math.ceil(Array.from(this.records.values()).reduce((acc, next) => {
        return acc + (next.playerReceivedTimestamp - next.streamerSentTimestamp);
      }, 0) / this.records.size),
      exportLatencyAsCSV: () => {
        let csv = "Timestamp;RTT;PlayerToStreamer;StreamerToPlayer;\n";
        resultRecords.forEach((record) => {
          csv += record.playerSentTimestamp + ";";
          csv += record.playerReceivedTimestamp - record.playerSentTimestamp + ";";
          csv += record.streamerReceivedTimestamp - record.playerSentTimestamp + ";";
          csv += record.playerReceivedTimestamp - record.streamerSentTimestamp + ";";
          csv += "\n";
        });
        return csv;
      }
    };
  }
  isRunning() {
    return !!this.intervalHandle;
  }
  receive(response) {
    if (!this.isRunning()) {
      return;
    }
    if (!response) {
      Logger.Error("Undefined response from server");
      return;
    }
    const record = this.records.get(response.Seq);
    if (record) {
      record.update(response);
    }
  }
  sendRequest(requestSize, responseSize) {
    const request = this.createRequest(requestSize, responseSize);
    const record = new DataChannelLatencyTestRecord(request);
    this.records.set(record.seq, record);
    this.sink(request);
  }
  createRequest(requestSize, responseSize) {
    return {
      Seq: this.seq++,
      FillResponseSize: responseSize,
      Filler: requestSize ? "A".repeat(requestSize) : ""
    };
  }
};

// node_modules/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7/dist/esm/PixelStreaming/PixelStreaming.js
var PixelStreaming = class {
  /**
   * @param config - A newly instantiated config object
   * @param overrides - Parameters to override default behaviour
   * returns the base Pixel streaming object
   */
  constructor(config2, overrides) {
    this.allowConsoleCommands = false;
    this.config = config2;
    if (overrides === null || overrides === void 0 ? void 0 : overrides.videoElementParent) {
      this._videoElementParent = overrides.videoElementParent;
    }
    this._eventEmitter = new PixelStreamingEventEmitter();
    this.configureSettings();
    this.setWebRtcPlayerController(new WebRtcPlayerController(this.config, this));
    this._webXrController = new WebXRController(this._webRtcController);
    this._setupWebRtcTCPRelayDetection = this._setupWebRtcTCPRelayDetection.bind(this);
    this._eventEmitter.addEventListener("webRtcConnected", (_) => {
      this._eventEmitter.addEventListener("statsReceived", this._setupWebRtcTCPRelayDetection);
    });
  }
  /**
   * Gets the element that contains the video stream element.
   */
  get videoElementParent() {
    if (!this._videoElementParent) {
      this._videoElementParent = document.createElement("div");
      this._videoElementParent.id = "videoElementParent";
    }
    return this._videoElementParent;
  }
  /**
   * Configure the settings with on change listeners and any additional per experience settings.
   */
  configureSettings() {
    this.config._addOnSettingChangedListener(Flags.IsQualityController, (wantsQualityController) => {
      if (wantsQualityController === true && !this._webRtcController.isQualityController) {
        this._webRtcController.sendRequestQualityControlOwnership();
      }
    });
    this.config._addOnSettingChangedListener(Flags.AFKDetection, (isAFKEnabled) => {
      this._webRtcController.setAfkEnabled(isAFKEnabled);
    });
    this.config._addOnSettingChangedListener(Flags.MatchViewportResolution, () => {
      this._webRtcController.videoPlayer.updateVideoStreamSize();
    });
    this.config._addOnSettingChangedListener(Flags.HoveringMouseMode, (isHoveringMouse) => {
      this.config.setFlagLabel(Flags.HoveringMouseMode, `Control Scheme: ${isHoveringMouse ? "Hovering" : "Locked"} Mouse`);
      this._webRtcController.setMouseInputEnabled(this.config.isFlagEnabled(Flags.MouseInput));
    });
    this.config._addOnSettingChangedListener(Flags.KeyboardInput, (isEnabled) => {
      this._webRtcController.setKeyboardInputEnabled(isEnabled);
    });
    this.config._addOnSettingChangedListener(Flags.MouseInput, (isEnabled) => {
      this._webRtcController.setMouseInputEnabled(isEnabled);
    });
    this.config._addOnSettingChangedListener(Flags.FakeMouseWithTouches, (_isFakeMouseEnabled) => {
      this._webRtcController.setTouchInputEnabled(this.config.isFlagEnabled(Flags.TouchInput));
    });
    this.config._addOnSettingChangedListener(Flags.TouchInput, (isEnabled) => {
      this._webRtcController.setTouchInputEnabled(isEnabled);
    });
    this.config._addOnSettingChangedListener(Flags.GamepadInput, (isEnabled) => {
      this._webRtcController.setGamePadInputEnabled(isEnabled);
    });
    this.config._addOnNumericSettingChangedListener(NumericParameters.MinQP, (newValue) => {
      Logger.Info("--------  Sending MinQP  --------");
      this._webRtcController.sendEncoderMinQP(newValue);
      Logger.Info("-------------------------------------------");
      const quality = Math.trunc(100 * (1 - newValue / 51));
      this.config.setNumericSetting(NumericParameters.CompatQualityMax, quality);
    });
    this.config._addOnNumericSettingChangedListener(NumericParameters.MaxQP, (newValue) => {
      Logger.Info("--------  Sending MaxQP  --------");
      this._webRtcController.sendEncoderMaxQP(newValue);
      Logger.Info("-------------------------------------------");
      const quality = Math.trunc(100 * (1 - newValue / 51));
      this.config.setNumericSetting(NumericParameters.CompatQualityMin, quality);
    });
    this.config._addOnNumericSettingChangedListener(NumericParameters.MinQuality, (newValue) => {
      Logger.Info("--------  Sending MinQuality  --------");
      this._webRtcController.sendEncoderMinQuality(newValue);
      Logger.Info("-------------------------------------------");
      this.config.setNumericSetting(NumericParameters.CompatQualityMin, newValue);
    });
    this.config._addOnNumericSettingChangedListener(NumericParameters.MaxQuality, (newValue) => {
      Logger.Info("--------  Sending MaxQuality  --------");
      this._webRtcController.sendEncoderMaxQuality(newValue);
      Logger.Info("-------------------------------------------");
      this.config.setNumericSetting(NumericParameters.CompatQualityMax, newValue);
    });
    this.config._addOnNumericSettingChangedListener(NumericParameters.CompatQualityMin, (newValue) => {
      newValue = 51 - newValue / 100 * 51;
      Logger.Info("--------  Sending MinQP from quality value  --------");
      this._webRtcController.sendEncoderMaxQP(newValue);
      Logger.Info("-------------------------------------------");
    });
    this.config._addOnNumericSettingChangedListener(NumericParameters.CompatQualityMax, (newValue) => {
      newValue = 51 - newValue / 100 * 51;
      Logger.Info("--------  Sending MaxQP from quality value  --------");
      this._webRtcController.sendEncoderMinQP(newValue);
      Logger.Info("-------------------------------------------");
    });
    this.config._addOnNumericSettingChangedListener(NumericParameters.WebRTCMinBitrate, (newValue) => {
      Logger.Info("--------  Sending web rtc settings  --------");
      this._webRtcController.sendWebRTCMinBitrate(
        newValue * 1e3
        /* kbps to bps */
      );
      Logger.Info("-------------------------------------------");
    });
    this.config._addOnNumericSettingChangedListener(NumericParameters.WebRTCMaxBitrate, (newValue) => {
      Logger.Info("--------  Sending web rtc settings  --------");
      this._webRtcController.sendWebRTCMaxBitrate(
        newValue * 1e3
        /* kbps to bps */
      );
      Logger.Info("-------------------------------------------");
    });
    this.config._addOnNumericSettingChangedListener(NumericParameters.WebRTCFPS, (newValue) => {
      Logger.Info("--------  Sending web rtc settings  --------");
      this._webRtcController.sendWebRTCFps(newValue);
      Logger.Info("-------------------------------------------");
    });
    this.config._addOnOptionSettingChangedListener(OptionParameters.PreferredCodec, (newValue) => {
      if (this._webRtcController) {
        this._webRtcController.setPreferredCodec(newValue);
      }
    });
    this.config._registerOnChangeEvents(this._eventEmitter);
  }
  /**
   * Set the input control ownership
   * @param inputControlOwnership - does the user have input control ownership
   */
  _onInputControlOwnership(inputControlOwnership) {
    this._inputController = inputControlOwnership;
  }
  /**
   * Instantiate the WebRTCPlayerController interface to provide WebRTCPlayerController functionality within this class and set up anything that requires it
   * @param webRtcPlayerController - a WebRtcPlayerController controller instance
   */
  setWebRtcPlayerController(webRtcPlayerController) {
    this._webRtcController = webRtcPlayerController;
    this._webRtcController.setPreferredCodec(this.config.getSettingOption(OptionParameters.PreferredCodec).selected);
    this._webRtcController.resizePlayerStyle();
    this.checkForAutoConnect();
  }
  /**
   * Connect to signaling server.
   */
  connect() {
    this._eventEmitter.dispatchEvent(new StreamPreConnectEvent());
    this._webRtcController.connectToSignallingServer();
  }
  /**
   * Reconnects to the signaling server. If connection is up, disconnects first
   * before establishing a new connection
   */
  reconnect() {
    this._eventEmitter.dispatchEvent(new StreamReconnectEvent());
    this._webRtcController.tryReconnect("Reconnecting...");
  }
  /**
   * Disconnect from the signaling server and close open peer connections.
   */
  disconnect() {
    this._eventEmitter.dispatchEvent(new StreamPreDisconnectEvent());
    this._webRtcController.close();
  }
  /**
   * Play the stream. Can be called only after a peer connection has been established.
   */
  play() {
    this._onStreamLoading();
    this._webRtcController.playStream();
  }
  /**
   * Auto connect if AutoConnect flag is enabled
   */
  checkForAutoConnect() {
    if (this.config.isFlagEnabled(Flags.AutoConnect)) {
      this._onWebRtcAutoConnect();
      this._webRtcController.connectToSignallingServer();
    }
  }
  /**
   * Will unmute the microphone track which is sent to Unreal Engine.
   * By default, will only unmute an existing mic track.
   *
   * @param forceEnable Can be used for cases when this object wasn't initialized with a mic track.
   * If this parameter is true, the connection will be restarted with a microphone.
   * Warning: this takes some time, as a full renegotiation and reconnection will happen.
   */
  unmuteMicrophone(forceEnable = false) {
    if (this.config.isFlagEnabled("UseMic")) {
      this.setMicrophoneMuted(false);
      return;
    }
    if (forceEnable) {
      this.config.setFlagEnabled("UseMic", true);
      this.reconnect();
      return;
    }
    Logger.Warning("Trying to unmute mic, but PixelStreaming was initialized with no microphone track. Call with forceEnable == true to re-connect with a mic track.");
  }
  muteMicrophone() {
    if (this.config.isFlagEnabled("UseMic")) {
      this.setMicrophoneMuted(true);
      return;
    }
    Logger.Info("Trying to mute mic, but PixelStreaming has no microphone track, so sending sound is already disabled.");
  }
  setMicrophoneMuted(mute) {
    var _a, _b, _c, _d;
    for (const transceiver of (_d = (_c = (_b = (_a = this._webRtcController) === null || _a === void 0 ? void 0 : _a.peerConnectionController) === null || _b === void 0 ? void 0 : _b.peerConnection) === null || _c === void 0 ? void 0 : _c.getTransceivers()) !== null && _d !== void 0 ? _d : []) {
      if (RTCUtils.canTransceiverSendAudio(transceiver)) {
        transceiver.sender.track.enabled = !mute;
      }
    }
  }
  /**
   * Will unmute the video track which is sent to Unreal Engine.
   * By default, will only unmute an existing video track.
   *
   * @param forceEnable Can be used for cases when this object wasn't initialized with a video track.
   * If this parameter is true, the connection will be restarted with a camera.
   * Warning: this takes some time, as a full renegotiation and reconnection will happen.
   */
  unmuteCamera(forceEnable = false) {
    if (this.config.isFlagEnabled("UseCamera")) {
      this.setCameraMuted(false);
      return;
    }
    if (forceEnable) {
      this.config.setFlagEnabled("UseCamera", true);
      this.reconnect();
      return;
    }
    Logger.Warning("Trying to unmute video, but PixelStreaming was initialized with no video track. Call with forceEnable == true to re-connect with a video track.");
  }
  muteCamera() {
    if (this.config.isFlagEnabled("UseCamera")) {
      this.setCameraMuted(true);
      return;
    }
    Logger.Info("Trying to mute camera, but PixelStreaming has no video track, so sending video is already disabled.");
  }
  setCameraMuted(mute) {
    var _a, _b, _c, _d;
    for (const transceiver of (_d = (_c = (_b = (_a = this._webRtcController) === null || _a === void 0 ? void 0 : _a.peerConnectionController) === null || _b === void 0 ? void 0 : _b.peerConnection) === null || _c === void 0 ? void 0 : _c.getTransceivers()) !== null && _d !== void 0 ? _d : []) {
      if (RTCUtils.canTransceiverSendVideo(transceiver)) {
        transceiver.sender.track.enabled = !mute;
      }
    }
  }
  /**
   * Internal function to emit an event when auto connecting occurs
   */
  _onWebRtcAutoConnect() {
    this._eventEmitter.dispatchEvent(new WebRtcAutoConnectEvent());
  }
  /**
   * Internal function to emit an event for when SDP negotiation is fully finished.
   */
  _onWebRtcSdp() {
    this._eventEmitter.dispatchEvent(new WebRtcSdpEvent());
  }
  /**
   * Internal function to emit an SDP offer after it has been set.
   */
  _onWebRtcSdpOffer(offer2) {
    this._eventEmitter.dispatchEvent(new WebRtcSdpOfferEvent({ sdp: offer2 }));
  }
  /**
   * Internal function to emit an SDP answer after it has been set.
   */
  _onWebRtcSdpAnswer(answer2) {
    this._eventEmitter.dispatchEvent(new WebRtcSdpAnswerEvent({ sdp: answer2 }));
  }
  /**
   * Internal function call to emit a `latencyCalculated` event.
   */
  _onLatencyCalculated(latencyInfo) {
    this._eventEmitter.dispatchEvent(new LatencyCalculatedEvent({ latencyInfo }));
  }
  /**
   * Internal function to emits a StreamLoading event
   */
  _onStreamLoading() {
    this._eventEmitter.dispatchEvent(new StreamLoadingEvent());
  }
  /**
   * Event fired when the video is disconnected - emits given eventString or an override
   * message from webRtcController if one has been set
   * @param eventString - a string describing why the connection closed
   * @param allowClickToReconnect - true if we want to allow the user to retry the connection with a click
   */
  _onDisconnect(eventString, allowClickToReconnect) {
    this._eventEmitter.dispatchEvent(new WebRtcDisconnectedEvent({
      eventString,
      allowClickToReconnect
    }));
  }
  /**
   * Handles when Web Rtc is connecting
   */
  _onWebRtcConnecting() {
    this._eventEmitter.dispatchEvent(new WebRtcConnectingEvent());
  }
  /**
   * Handles when Web Rtc has connected
   */
  _onWebRtcConnected() {
    this._eventEmitter.dispatchEvent(new WebRtcConnectedEvent());
  }
  /**
   * Handles when Web Rtc fails to connect
   */
  _onWebRtcFailed() {
    this._eventEmitter.dispatchEvent(new WebRtcFailedEvent());
  }
  /**
   * Handle when the Video has been Initialized
   */
  _onVideoInitialized() {
    this._eventEmitter.dispatchEvent(new VideoInitializedEvent());
    this._videoStartTime = Date.now();
  }
  /**
   * Set up functionality to happen when receiving latency test results
   * @param latency - latency test results object
   */
  _onLatencyTestResult(latencyTimings) {
    this._eventEmitter.dispatchEvent(new LatencyTestResultEvent({ latencyTimings }));
  }
  _onDataChannelLatencyTestResponse(response) {
    this._eventEmitter.dispatchEvent(new DataChannelLatencyTestResponseEvent({ response }));
  }
  /**
   * Set up functionality to happen when receiving video statistics
   * @param videoStats - video statistics as a aggregate stats object
   */
  _onVideoStats(videoStats) {
    if (!this._videoStartTime || this._videoStartTime === void 0) {
      this._videoStartTime = Date.now();
    }
    videoStats.handleSessionStatistics(this._videoStartTime, this._inputController, this._webRtcController.videoAvgQp);
    this._eventEmitter.dispatchEvent(new StatsReceivedEvent({ aggregatedStats: videoStats }));
  }
  /**
   * Set up functionality to happen when calculating the average video encoder qp
   * @param QP - the quality number of the stream
   */
  _onVideoEncoderAvgQP(QP) {
    this._eventEmitter.dispatchEvent(new VideoEncoderAvgQPEvent({ avgQP: QP }));
  }
  /**
   * Set up functionality to happen when receiving and handling initial settings for the UE app
   * @param settings - initial UE app settings
   */
  _onInitialSettings(settings) {
    var _a;
    this._eventEmitter.dispatchEvent(new InitialSettingsEvent({ settings }));
    if (settings.PixelStreamingSettings) {
      this.allowConsoleCommands = (_a = settings.PixelStreamingSettings.AllowPixelStreamingCommands) !== null && _a !== void 0 ? _a : false;
      if (this.allowConsoleCommands === false) {
        Logger.Info("-AllowPixelStreamingCommands=false, sending arbitrary console commands from browser to UE is disabled.");
      }
    }
    const useUrlParams = this.config.useUrlParams;
    const urlParams = new IURLSearchParams(window.location.search);
    Logger.Info(`using URL parameters ${useUrlParams}`);
    if (settings.EncoderSettings) {
      if (settings.EncoderSettings.MinQP) {
        this.config.setNumericSetting(
          NumericParameters.MinQP,
          // If a setting is set in the URL, make sure we respect that value as opposed to what the application sends us
          useUrlParams && urlParams.has(NumericParameters.MinQP) ? Number.parseFloat(urlParams.get(NumericParameters.MinQP)) : settings.EncoderSettings.MinQP || 0
        );
        this.config.setNumericSetting(NumericParameters.MaxQP, useUrlParams && urlParams.has(NumericParameters.MaxQP) ? Number.parseFloat(urlParams.get(NumericParameters.MaxQP)) : settings.EncoderSettings.MaxQP || 51);
      }
      if (settings.EncoderSettings.MinQuality) {
        this.config.setNumericSetting(
          NumericParameters.MinQuality,
          // If a setting is set in the URL, make sure we respect that value as opposed to what the application sends us
          useUrlParams && urlParams.has(NumericParameters.MinQuality) ? Number.parseFloat(urlParams.get(NumericParameters.MinQuality)) : settings.EncoderSettings.MinQuality || 0
        );
        this.config.setNumericSetting(NumericParameters.MaxQuality, useUrlParams && urlParams.has(NumericParameters.MaxQuality) ? Number.parseFloat(urlParams.get(NumericParameters.MaxQuality)) : settings.EncoderSettings.MaxQuality || 100);
      }
      if (useUrlParams) {
        if (urlParams.has(NumericParameters.CompatQualityMin)) {
          this.config.setNumericSetting(NumericParameters.CompatQualityMin, Number.parseFloat(urlParams.get(NumericParameters.CompatQualityMin)));
        }
        if (urlParams.has(NumericParameters.CompatQualityMax)) {
          this.config.setNumericSetting(NumericParameters.CompatQualityMax, Number.parseFloat(urlParams.get(NumericParameters.CompatQualityMax)));
        }
      }
    }
    if (settings.WebRTCSettings) {
      this.config.setNumericSetting(
        NumericParameters.WebRTCMinBitrate,
        useUrlParams && urlParams.has(NumericParameters.WebRTCMinBitrate) ? Number.parseFloat(urlParams.get(NumericParameters.WebRTCMinBitrate)) : settings.WebRTCSettings.MinBitrate / 1e3
        /* bps to kbps */
      );
      this.config.setNumericSetting(
        NumericParameters.WebRTCMaxBitrate,
        useUrlParams && urlParams.has(NumericParameters.WebRTCMaxBitrate) ? Number.parseFloat(urlParams.get(NumericParameters.WebRTCMaxBitrate)) : settings.WebRTCSettings.MaxBitrate / 1e3
        /* bps to kbps */
      );
      this.config.setNumericSetting(NumericParameters.WebRTCFPS, useUrlParams && urlParams.has(NumericParameters.WebRTCFPS) ? Number.parseFloat(urlParams.get(NumericParameters.WebRTCFPS)) : settings.WebRTCSettings.FPS);
    }
  }
  /**
   * Set up functionality to happen when setting quality control ownership of a stream
   * @param hasQualityOwnership - does this user have quality ownership of the stream true / false
   */
  _onQualityControlOwnership(hasQualityOwnership) {
    this.config.setFlagEnabled(Flags.IsQualityController, hasQualityOwnership);
  }
  _onPlayerCount(playerCount2) {
    this._eventEmitter.dispatchEvent(new PlayerCountEvent({ count: playerCount2 }));
  }
  _onSubscribeFailed(message) {
    this._eventEmitter.dispatchEvent(new SubscribeFailedEvent({ message }));
  }
  // Sets up to emit the webrtc tcp relay detect event
  _setupWebRtcTCPRelayDetection(statsReceivedEvent) {
    const activeCandidatePair = statsReceivedEvent.data.aggregatedStats.getActiveCandidatePair();
    if (activeCandidatePair != null) {
      const localCandidate = statsReceivedEvent.data.aggregatedStats.localCandidates.find((candidate) => candidate.id == activeCandidatePair.localCandidateId, null);
      if (localCandidate != null && localCandidate.candidateType == "relay" && localCandidate.relayProtocol == "tcp") {
        this._eventEmitter.dispatchEvent(new WebRtcTCPRelayDetectedEvent());
      }
      this._eventEmitter.removeEventListener("statsReceived", this._setupWebRtcTCPRelayDetection);
    }
  }
  /**
   * Request a connection latency test.
   * NOTE: There are plans to refactor all request* functions. Expect changes if you use this!
   * @returns
   */
  requestLatencyTest() {
    if (!this._webRtcController.videoPlayer.isVideoReady()) {
      return false;
    }
    this._webRtcController.sendLatencyTest();
    return true;
  }
  /**
   * Request a data channel latency test.
   * NOTE: There are plans to refactor all request* functions. Expect changes if you use this!
   */
  requestDataChannelLatencyTest(config2) {
    if (!this._webRtcController.videoPlayer.isVideoReady()) {
      return false;
    }
    if (!this._dataChannelLatencyTestController) {
      this._dataChannelLatencyTestController = new DataChannelLatencyTestController(this._webRtcController.sendDataChannelLatencyTest.bind(this._webRtcController), (result) => {
        this._eventEmitter.dispatchEvent(new DataChannelLatencyTestResultEvent({ result }));
      });
      this.addEventListener("dataChannelLatencyTestResponse", ({ data: { response } }) => {
        this._dataChannelLatencyTestController.receive(response);
      });
    }
    return this._dataChannelLatencyTestController.start(config2);
  }
  /**
   * Request for the UE application to show FPS counter.
   * NOTE: There are plans to refactor all request* functions. Expect changes if you use this!
   * @returns
   */
  requestShowFps() {
    if (!this._webRtcController.videoPlayer.isVideoReady()) {
      return false;
    }
    this._webRtcController.sendShowFps();
    return true;
  }
  /**
   * Request for a new IFrame from the UE application.
   * NOTE: There are plans to refactor all request* functions. Expect changes if you use this!
   * @returns
   */
  requestIframe() {
    if (!this._webRtcController.videoPlayer.isVideoReady()) {
      return false;
    }
    this._webRtcController.sendIframeRequest();
    return true;
  }
  /**
   * Send data to UE application. The data will be run through JSON.stringify() so e.g. strings
   * and any serializable plain JSON objects with no recurrence can be sent.
   * @returns true if succeeded, false if rejected
   */
  emitUIInteraction(descriptor) {
    if (!this._webRtcController.videoPlayer.isVideoReady()) {
      return false;
    }
    this._webRtcController.emitUIInteraction(descriptor);
    return true;
  }
  /**
   * Send a command to UE application. Blocks ConsoleCommand descriptors unless UE
   * has signaled that it allows console commands.
   * @returns true if succeeded, false if rejected
   */
  emitCommand(descriptor) {
    if (!this._webRtcController.videoPlayer.isVideoReady()) {
      return false;
    }
    if (!this.allowConsoleCommands && "ConsoleCommand" in descriptor) {
      return false;
    }
    this._webRtcController.emitCommand(descriptor);
    return true;
  }
  /**
   * Send a console command to UE application. Only allowed if UE has signaled that it allows
   * console commands.
   * @returns true if succeeded, false if rejected
   */
  emitConsoleCommand(command) {
    if (!this.allowConsoleCommands || !this._webRtcController.videoPlayer.isVideoReady()) {
      return false;
    }
    this._webRtcController.emitConsoleCommand(command);
    return true;
  }
  /**
   * Sets the text contents of the currently focused UE text box widget.
   * @param contents The new contents of the UE text box.
   * @returns True if the message could be sent.
   */
  sendTextboxEntry(contents) {
    if (!this._webRtcController.videoPlayer.isVideoReady()) {
      return false;
    }
    this._webRtcController.sendTextboxEntry(contents);
    return true;
  }
  /**
   * Add a UE -> browser response event listener
   * @param name - The name of the response handler
   * @param listener - The method to be activated when a message is received
   */
  addResponseEventListener(name, listener) {
    this._webRtcController.responseController.addResponseEventListener(name, listener);
  }
  /**
   * Remove a UE -> browser response event listener
   * @param name - The name of the response handler
   */
  removeResponseEventListener(name) {
    this._webRtcController.responseController.removeResponseEventListener(name);
  }
  /**
   * Dispatch a new event.
   * @param e event
   * @returns
   */
  dispatchEvent(e) {
    return this._eventEmitter.dispatchEvent(e);
  }
  /**
   * Register an event handler.
   * @param type event name
   * @param listener event handler function
   */
  addEventListener(type, listener) {
    this._eventEmitter.addEventListener(type, listener);
  }
  /**
   * Remove an event handler.
   * @param type event name
   * @param listener event handler function
   */
  removeEventListener(type, listener) {
    this._eventEmitter.removeEventListener(type, listener);
  }
  /**
   * Enable/disable XR mode.
   */
  toggleXR() {
    this.webXrController.xrClicked();
  }
  /**
   * Pass in a function to generate a signalling server URL.
   * This function is useful if you need to programmatically construct your signalling server URL.
   * @param signallingUrlBuilderFunc A function that generates a signalling server url.
   */
  setSignallingUrlBuilder(signallingUrlBuilderFunc) {
    this._webRtcController.signallingUrlBuilder = signallingUrlBuilderFunc;
  }
  get webRtcController() {
    return this._webRtcController;
  }
  /**
   * Public getter for the websocket controller. Access to this property allows you to send
   * custom websocket messages.
   */
  get signallingProtocol() {
    return this._webRtcController.protocol;
  }
  /**
   * Public getter for the webXrController controller. Used for all XR features.
   */
  get webXrController() {
    return this._webXrController;
  }
  registerMessageHandler(name, direction, handler) {
    if (direction === MessageDirection.FromStreamer && typeof handler === "undefined") {
      Logger.Warning(`Unable to register an undefined handler for ${name}`);
      return;
    }
    if (direction === MessageDirection.ToStreamer && typeof handler === "undefined") {
      this._webRtcController.streamMessageController.registerMessageHandler(direction, name, (data) => this._webRtcController.sendMessageController.sendMessageToStreamer(name, data));
    } else {
      this._webRtcController.streamMessageController.registerMessageHandler(direction, name, (data) => handler(data));
    }
  }
  get toStreamerHandlers() {
    return this._webRtcController.streamMessageController.toStreamerHandlers;
  }
  isReconnecting() {
    return this._webRtcController.isReconnecting;
  }
};

// src/connection.ts
function orderedCodecPreferences(primary, fallback, unrealVersion) {
  if (typeof RTCRtpReceiver === "undefined" || !RTCRtpReceiver.getCapabilities) return [];
  const caps = RTCRtpReceiver.getCapabilities("video")?.codecs ?? [];
  const matcher = /(VP\d|H26\d|AV1).*/;
  const supported = [];
  for (const codec of caps) {
    const str = `${codec.mimeType.split("/")[1]} ${codec.sdpFmtpLine ?? ""}`;
    if (matcher.test(str)) supported.push(str);
  }
  const av1Ok = unrealVersion > 5.3;
  const matches = (want) => {
    if (!want) return [];
    const hits = supported.filter((s) => s.toLowerCase().includes(want.toLowerCase()));
    if (want === "AV1" && (!av1Ok || hits.every((h) => h.trim().length < 6))) return [];
    return hits;
  };
  const preferred = matches(primary);
  if (preferred.length > 0) {
    return [...preferred, ...supported.filter((s) => !preferred.includes(s))];
  }
  const second = matches(fallback);
  if (second.length > 0) {
    return [...second, ...supported.filter((s) => !second.includes(s))];
  }
  return supported;
}
function codecFamily(entry) {
  const match = entry?.match(/^(AV1|H26\d|VP\d)/i);
  return match?.[1]?.toUpperCase() ?? null;
}
var Connection = class {
  constructor(params, cb) {
    this.detachFns = [];
    const { signallingHost, streamerId, sessionId, projectId, ticket, config: config2, options, resX, resY } = params;
    const host = signallingHost.replace(/^wss?:\/\//, "").replace(/\/+$/, "");
    const shared = options.shared;
    const watchOnly = shared?.role === "viewer";
    const sfuParams = shared?.role === "host" ? "&SFU_HOST=true" : shared?.role === "viewer" ? "&SFU_PLAYER=true" : "";
    const ssUrl = `wss://${host}/?StreamerId=${streamerId}&ProjectId=${projectId}&resX=${resX}&resY=${resY}&sessionId=${sessionId}&ticket=${encodeURIComponent(ticket)}&sdk=core${sfuParams}`;
    Logger.InitLogging(LogLevel.Warning, true);
    const psConfig = new Config({
      initialSettings: {
        AutoConnect: true,
        ss: ssUrl,
        WaitForStreamer: true,
        StreamerId: streamerId,
        TouchInput: !watchOnly && (options.input?.touch ?? asBool(config2.touchInput, true)),
        XRControllerInput: options.input?.xr ?? asBool(config2.xrInput, false)
      }
    });
    this.psConfig = psConfig;
    const codecs = orderedCodecPreferences(
      options.codec?.primary ?? config2.primaryCodec,
      options.codec?.fallback ?? config2.fallbaCodec,
      Number(config2.unrealVersion) || 5.2
    );
    this.selectedCodec = codecFamily(codecs[0]);
    if (codecs.length > 0) {
      const isFirefox = typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);
      if (!isFirefox) psConfig.setOptionSettingOptions(OptionParameters.PreferredCodec, codecs);
      psConfig.setOptionSettingValue(OptionParameters.PreferredCodec, codecs[0]);
    }
    const f = (flag, value) => psConfig.setFlagEnabled(flag, value);
    f(Flags.UseCamera, options.media?.camera ?? asBool(config2.showCamera, false));
    f(Flags.ForceTURN, options.advanced?.iceTransportPolicy === "relay" || asBool(config2.forceTurn, false));
    f(Flags.WaitForStreamer, true);
    f(Flags.MatchViewportResolution, false);
    f(Flags.TouchInput, !watchOnly && (options.input?.touch ?? asBool(config2.touchInput, true)));
    f(Flags.FakeMouseWithTouches, options.input?.fakeMouseWithTouches ?? asBool(config2.fakeMouseTouch, false));
    f(Flags.StartVideoMuted, true);
    f(Flags.BrowserSendOffer, false);
    f(Flags.AFKDetection, true);
    f(Flags.ForceMonoAudio, false);
    f(Flags.AutoPlayVideo, true);
    f(Flags.HideUI, true);
    f(Flags.GamepadInput, !watchOnly && (options.input?.gamepad ?? asBool(config2.gamepadInput, false)));
    f(Flags.HoveringMouseMode, options.input?.hover ?? asBool(config2.hoverMouse, false));
    f(Flags.MouseInput, !watchOnly && (options.input?.mouse ?? asBool(config2.mouseInput, true)));
    f(Flags.IsQualityController, !watchOnly);
    f(Flags.KeyboardInput, !watchOnly && (options.input?.keyboard ?? asBool(config2.keyBoardInput, true)));
    f(Flags.UseMic, options.media?.mic ?? asBool(config2.showMic, false));
    const n = (param, value) => {
      if (value !== void 0 && Number.isFinite(value)) psConfig.setNumericSetting(param, value);
    };
    n(NumericParameters.WebRTCFPS, 60);
    n(NumericParameters.AFKTimeoutSecs, options.afk?.timeoutSec ?? asNum(config2.afktimeout) ?? 600);
    n(NumericParameters.WebRTCMinBitrate, options.bitrate?.min);
    n(NumericParameters.WebRTCMaxBitrate, options.bitrate?.max);
    n(NumericParameters.StreamerAutoJoinInterval, 3e3);
    n(NumericParameters.MaxReconnectAttempts, 0);
    this.stream = new PixelStreaming(psConfig);
    const listen = (type, fn) => {
      this.stream.addEventListener(type, fn);
      this.detachFns.push(() => this.stream.removeEventListener(type, fn));
    };
    listen("webRtcConnecting", () => cb.onConnecting());
    listen("webRtcConnected", () => cb.onConnected());
    listen("playStream", () => cb.onPlaying());
    listen("webRtcSdpOffer", () => cb.onSdpOffer());
    listen("webRtcSdpAnswer", () => cb.onSdpAnswer());
    listen("afkTimedOut", () => cb.onAfkTimedOut());
    listen("afkWarningActivate", (ev) => {
      const data = ev?.data;
      cb.onAfkWarning(data?.countDown ?? 0, data?.dismissAfk ?? (() => void 0));
    });
    listen("afkWarningUpdate", (ev) => {
      const data = ev?.data;
      cb.onAfkWarningUpdate(data?.countDown ?? 0);
    });
    listen("afkWarningDeactivate", () => cb.onAfkWarningDismissed());
    this.stream.addResponseEventListener("handle_responses", cb.onUeMessage);
    this.detachFns.push(() => this.stream.removeResponseEventListener("handle_responses"));
    const wrc = this.webRtcController;
    if (wrc) {
      wrc.onCommand = (rawMessage) => {
        try {
          const asString = new TextDecoder("utf-16").decode(rawMessage.slice(1));
          const command = JSON.parse(asString);
          if (command.showOnScreenKeyboard === true) cb.onOsk(String(command.contents ?? ""));
        } catch {
        }
      };
    }
    const proto = this.stream.signallingProtocol;
    if (proto?.transport?.on) {
      proto.transport.on("open", () => cb.onSignallingOpen());
      proto.transport.on(
        "error",
        (error) => cb.onSignallingError(error?.message ?? String(error))
      );
      proto.transport.on("close", (data) => {
        cb.onClose(data?.code ?? 1006, data?.reason ?? "");
      });
      proto.transport.on(
        "message",
        (msg) => {
          if (msg?.message === "You are in Queue") {
            cb.onQueue(Number(msg.position ?? 0), msg.message);
          } else if (msg?.message === "locationData" && msg.data) {
            cb.onLocationData({
              country: msg.data.country,
              countryCode: msg.data.country_code,
              state: msg.data.state,
              city: msg.data.city,
              latitude: msg.data.latitude,
              longitude: msg.data.longitude,
              zip: msg.data.zip
            });
          } else if (msg?.type === "config") {
            const servers = msg.peerConnectionOptions?.iceServers ?? [];
            cb.onConfigMessage(
              servers.map((s) => ({ urls: s.urls, hasCreds: !!(s.username || s.credential) }))
            );
          }
        }
      );
    }
  }
  // ---- accessors ----------------------------------------------------------
  /** The live RTCPeerConnection, or null before negotiation starts. */
  get peerConnection() {
    return this.webRtcController?.peerConnectionController?.peerConnection ?? null;
  }
  /** The container the lib renders video into — hand to the host page to attach. */
  get videoParent() {
    return this.stream.videoElementParent ?? null;
  }
  /**
   * The lib routes audio through its OWN <audio> element, not the <video> —
   * muting the video element silences nothing.
   */
  get audioElement() {
    return this.webRtcController?.streamController?.audioElement ?? null;
  }
  get webRtcController() {
    return this.stream._webRtcController;
  }
  // ---- outbound to UE -----------------------------------------------------
  send(payload) {
    this.stream.emitUIInteraction(payload);
  }
  consoleCommand(cmd) {
    this.stream.emitConsoleCommand(cmd);
  }
  /**
   * Suffix semantics are the player's: 'f' fixes the res, 'wf' is the
   * windowed-fullscreen variant sent on dynamic resizes.
   */
  setRes(width, height, suffix = "f") {
    this.stream.emitConsoleCommand(`r.SetRes ${width}x${height}${suffix}`);
  }
  /** Reply to the on-screen keyboard (pairs with onOsk). */
  sendTextboxEntry(text) {
    this.toStreamer("TextboxEntry", [text]);
  }
  /** Encoder/engine key-value commands (QP overrides etc.). */
  sendEncoderCommand(command) {
    this.toStreamer("Command", [JSON.stringify(command)]);
  }
  setHoverMouse(enabled) {
    this.psConfig.setFlagEnabled(Flags.HoveringMouseMode, enabled);
  }
  toggleXR() {
    this.stream.toggleXR?.();
  }
  unmuteMicrophone() {
    this.stream.unmuteMicrophone?.(true);
  }
  unmuteCamera() {
    this.stream.unmuteCamera?.(true);
  }
  /** PNG data URL of the current frame, or null before first decoded frame. */
  captureScreenshot() {
    const video = this.videoParent?.querySelector("video");
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }
  /**
   * Re-dial ONLY the signalling socket, keeping the WebRTC controller (and the
   * live media) intact — the player's production reconnect. Returns false when
   * the lib doesn't expose the method (escalate to a full rebuild instead).
   */
  reconnectSignalling() {
    const wrc = this.webRtcController;
    if (typeof wrc?.connectToSignallingServer !== "function") return false;
    try {
      wrc.connectToSignallingServer();
      return true;
    } catch {
      return false;
    }
  }
  toStreamer(handler, payload) {
    try {
      this.webRtcController?.streamMessageController?.toStreamerHandlers?.get(handler)?.(payload);
    } catch {
    }
  }
  disconnect() {
    for (const detach of this.detachFns.splice(0)) {
      try {
        detach();
      } catch {
      }
    }
    try {
      this.stream.disconnect();
    } catch {
    }
  }
};
function asBool(v, dflt) {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return dflt;
}
function asNum(v) {
  const num = Number(v);
  return Number.isFinite(num) ? num : void 0;
}

// src/diagnostics.ts
async function collectDiagnostics(pc, startTime) {
  const base = {
    timeSinceStart: Date.now() - startTime,
    iceConnectionState: pc.iceConnectionState ?? "unknown",
    connectionState: pc.connectionState ?? "unknown",
    signalingState: pc.signalingState ?? "unknown",
    iceGatheringState: pc.iceGatheringState ?? "unknown"
  };
  const stats2 = await pc.getStats().catch(() => null);
  const snap = {
    ...base,
    statsAvailable: !!stats2,
    srflxCandidatesFound: false,
    relayCandidatesFound: false,
    hostCandidatesFound: false,
    candidatePairs: 0,
    connectedPairs: 0,
    failedPairs: 0,
    turnServerUrls: [],
    localCandidates: [],
    remoteCandidates: [],
    candidatePairsDetails: [],
    verdict: ""
  };
  let selectedCandidatePairId = null;
  if (stats2) {
    stats2.forEach((report) => {
      if (report.type === "local-candidate") {
        const info = {
          id: report.id,
          type: report.candidateType,
          protocol: report.protocol,
          address: report.address,
          port: report.port,
          priority: report.priority
        };
        snap.localCandidates.push(info);
        if (report.candidateType === "relay") {
          snap.relayCandidatesFound = true;
          if (report.address) snap.turnServerUrls.push(report.address);
        }
        if (report.candidateType === "host") snap.hostCandidatesFound = true;
        if (report.candidateType === "srflx") snap.srflxCandidatesFound = true;
      } else if (report.type === "remote-candidate") {
        snap.remoteCandidates.push({
          id: report.id,
          type: report.candidateType,
          protocol: report.protocol,
          address: report.address,
          port: report.port
        });
      } else if (report.type === "candidate-pair") {
        snap.candidatePairsDetails.push({
          id: report.id,
          state: report.state,
          localCandidateId: report.localCandidateId,
          remoteCandidateId: report.remoteCandidateId,
          nominated: report.nominated,
          bytesSent: report.bytesSent,
          bytesReceived: report.bytesReceived,
          roundTripTime: report.currentRoundTripTime
        });
        snap.candidatePairs++;
        if (report.state === "succeeded") snap.connectedPairs++;
        if (report.state === "failed") snap.failedPairs++;
      } else if (report.type === "transport") {
        snap.transport = {
          dtlsState: report.dtlsState,
          selectedCandidatePairId: report.selectedCandidatePairId,
          bytesReceived: report.bytesReceived,
          bytesSent: report.bytesSent
        };
        selectedCandidatePairId = report.selectedCandidatePairId ?? null;
      } else if (report.type === "inbound-rtp" && report.kind === "video") {
        snap.inboundRtp = {
          codecId: report.codecId,
          packetsReceived: report.packetsReceived,
          packetsLost: report.packetsLost,
          bytesReceived: report.bytesReceived,
          jitter: report.jitter,
          framesDecoded: report.framesDecoded,
          framesDropped: report.framesDropped
        };
      }
    });
    if (selectedCandidatePairId) {
      const pair = snap.candidatePairsDetails.find((p) => p.id === selectedCandidatePairId);
      const local = pair && snap.localCandidates.find((c) => c.id === pair.localCandidateId);
      if (local) {
        snap.connectionType = local.type === "relay" ? "TURN" : String(local.type).toUpperCase();
        snap.selectedServer = `${local.address}:${local.port}`;
        if (local.type === "relay") {
          snap.selectedTurn = { relay: { address: local.address, port: local.port, protocol: local.protocol } };
        }
      }
    }
  }
  const issues = [];
  if (base.iceConnectionState === "failed") issues.push("ICE_FAILED");
  if (base.iceConnectionState === "disconnected") issues.push("ICE_DISCONNECTED");
  if (base.connectionState === "failed") issues.push("PEER_CONNECTION_FAILED");
  if (snap.statsAvailable) {
    const earlyStage = base.iceGatheringState === "new" || base.iceConnectionState === "new" || base.iceGatheringState === "gathering" && snap.timeSinceStart < 5e3;
    const checkingOrFailed = ["checking", "failed", "disconnected"].includes(base.iceConnectionState);
    const gatheringComplete = base.iceGatheringState === "complete";
    const connected = ["connected", "completed"].includes(base.iceConnectionState);
    if (!snap.relayCandidatesFound && !earlyStage && (checkingOrFailed || gatheringComplete) && !connected) {
      issues.push("NO_TURN");
    }
    if (!snap.hostCandidatesFound && !snap.srflxCandidatesFound && !snap.relayCandidatesFound && (gatheringComplete || checkingOrFailed) && !earlyStage) {
      issues.push("NO_CANDIDATES");
    }
    if (snap.failedPairs > 0 && snap.connectedPairs === 0 && snap.candidatePairs > 0) {
      issues.push("ALL_CANDIDATE_PAIRS_FAILED");
    }
  }
  if (base.iceConnectionState === "checking" && snap.timeSinceStart > 3e4) {
    issues.push("ICE_CHECKING_TIMEOUT");
  }
  if (issues.length > 0) {
    snap.issues = issues;
    snap.likelyCause = issues.includes("NO_TURN") || issues.includes("ICE_FAILED") || issues.includes("ALL_CANDIDATE_PAIRS_FAILED") ? "TURN_SERVER_ISSUE" : issues.includes("ICE_CHECKING_TIMEOUT") ? "NETWORK_FIREWALL_ISSUE" : issues.includes("NO_CANDIDATES") ? "SIGNALLING_SERVER_ISSUE" : "UNKNOWN_ISSUE";
  }
  snap.verdict = verdictFor(snap);
  return snap;
}
function verdictFor(s) {
  if (!s.statsAvailable) return "connection too early for stats";
  if (!s.srflxCandidatesFound && !s.relayCandidatesFound && s.iceGatheringState === "complete") {
    return "network blocks UDP and TURN \u2014 only host candidates gathered (corporate firewall pattern)";
  }
  if (s.issues?.includes("ALL_CANDIDATE_PAIRS_FAILED")) return "every candidate pair failed \u2014 path to media blocked";
  if (s.issues?.includes("ICE_CHECKING_TIMEOUT")) return "ICE stuck in checking >30s \u2014 firewall or asymmetric block";
  if (s.connectionType === "TURN") return `relayed via TURN (${s.selectedServer ?? "unknown relay"})`;
  if (s.connectedPairs > 0) return `direct connection (${s.connectionType ?? "unknown"})`;
  return "gathering / negotiating";
}
async function relayTransport(pc) {
  const stats2 = await pc.getStats().catch(() => null);
  if (!stats2) return "";
  const locals = /* @__PURE__ */ new Map();
  const found = {
    pair: null,
    selectedId: null
  };
  stats2.forEach((r) => {
    if (r.type === "local-candidate") locals.set(r.id, r);
    else if (r.type === "candidate-pair" && r.nominated && r.state === "succeeded") found.pair = r;
    else if (r.type === "transport" && r.selectedCandidatePairId) found.selectedId = r.selectedCandidatePairId;
  });
  if (!found.pair && found.selectedId) {
    stats2.forEach((r) => {
      if (r.id === found.selectedId) found.pair = r;
    });
  }
  const local = found.pair && locals.get(String(found.pair.localCandidateId));
  if (!local || local.candidateType !== "relay") return "";
  const url = String(local.url ?? "").toLowerCase();
  if (url.startsWith("turns:")) return "tls";
  const proto = String(local.relayProtocol ?? local.protocol ?? "").toLowerCase();
  if (proto === "tcp" || url.includes("transport=tcp")) return "tcp";
  return "udp";
}

// src/emitter.ts
var Emitter = class {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  on(event, fn) {
    let set = this.listeners.get(event);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.listeners.set(event, set);
    }
    set.add(fn);
    return () => this.off(event, fn);
  }
  off(event, fn) {
    this.listeners.get(event)?.delete(fn);
  }
  emit(event, ...args) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of [...set]) {
      try {
        fn(...args);
      } catch (err) {
        console.error("[streampixel] listener error:", err);
      }
    }
  }
  clearListeners() {
    this.listeners.clear();
  }
};

// src/ids.ts
function uuidv7() {
  const time = BigInt(Date.now()) << 80n;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let rand = 0n;
  for (const b of bytes) rand = rand << 8n | BigInt(b);
  let uuid = time | rand & 0xffffffffffffffffffffn;
  uuid = uuid & ~(0xfn << 76n) | 0x7n << 76n;
  uuid = uuid & ~(0x3n << 62n) | 0x2n << 62n;
  const hex = uuid.toString(16).padStart(32, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function newSessionId() {
  return `session_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;
}

// src/loading.ts
var TEXT_ROTATE_MS = 4e3;
var LoadingOverlay = class {
  constructor(container, config2) {
    this.container = container;
    this.root = null;
    this.statusEl = null;
    this.textEl = null;
    this.rotateTimer = null;
    this.texts = [config2.loadingTextOne, config2.loadingTextTwo, config2.loadingTextThree].filter((t) => typeof t === "string" && t.trim().length > 0);
    if (this.texts.length === 0) this.texts.push("Preparing your stream\u2026");
    const root = document.createElement("div");
    root.setAttribute("data-streampixel", "loading");
    root.style.cssText = "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:#0b0b0f;color:#e8e8ec;font:15px/1.5 system-ui,-apple-system,sans-serif;text-align:center;z-index:10;";
    if (config2.loadingBannerUrl) {
      root.style.background = `#0b0b0f url(${JSON.stringify(String(config2.loadingBannerUrl))}) center/cover no-repeat`;
    }
    if (config2.customLogo) {
      const logo = document.createElement("img");
      logo.src = String(config2.customLogo);
      logo.alt = "";
      logo.style.cssText = "max-width:min(40%,240px);max-height:96px;object-fit:contain;";
      root.append(logo);
    }
    const text = document.createElement("div");
    text.style.cssText = "opacity:.9;padding:0 24px;max-width:60ch;";
    text.textContent = this.texts[0] ?? "";
    root.append(text);
    this.textEl = text;
    const status = document.createElement("div");
    status.style.cssText = "font-size:13px;opacity:.6;min-height:1.5em;";
    root.append(status);
    this.statusEl = status;
    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }
    container.append(root);
    this.root = root;
    if (this.texts.length > 1) {
      let i = 0;
      this.rotateTimer = setInterval(() => {
        i = (i + 1) % this.texts.length;
        if (this.textEl) this.textEl.textContent = this.texts[i] ?? "";
      }, TEXT_ROTATE_MS);
    }
  }
  onState(state) {
    if (!this.root) return;
    switch (state.kind) {
      case "streaming":
        this.root.style.display = "none";
        return;
      case "queued":
        this.setStatus(`You are in queue \u2014 position ${state.position}`);
        return;
      case "reconnecting":
        this.show();
        this.setStatus("Reconnecting\u2026");
        return;
      case "recovering":
        this.show();
        this.setStatus("Restarting the stream\u2026");
        return;
      case "ended":
        this.show();
        this.setStatus(state.reason || "Disconnected");
        if (this.rotateTimer) clearInterval(this.rotateTimer);
        this.rotateTimer = null;
        if (this.textEl) this.textEl.textContent = "";
        return;
      default:
        this.setStatus("");
    }
  }
  destroy() {
    if (this.rotateTimer) clearInterval(this.rotateTimer);
    this.rotateTimer = null;
    this.root?.remove();
    this.root = null;
    this.statusEl = null;
    this.textEl = null;
  }
  show() {
    if (!this.root) return;
    this.root.style.display = "flex";
    if (!this.root.isConnected) this.container.append(this.root);
  }
  setStatus(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }
};

// src/resolution.ts
var RESOLUTION_LADDER = [
  "360p (640x360)",
  "480p (854x480)",
  "720p (1280x720)",
  "1080p (1920x1080)",
  "1440p (2560x1440)",
  "4K (3840x2160)"
];
function parseResString(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/\((\d+)x(\d+)\)/);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}
function allowedResolutions(maxStreamQuality) {
  const idx = RESOLUTION_LADDER.findIndex((r) => r === maxStreamQuality);
  return idx === -1 ? [...RESOLUTION_LADDER] : RESOLUTION_LADDER.slice(0, idx + 1);
}
function fromOption(res) {
  if (!res) return null;
  if (typeof res === "object") return res;
  return parseResString(res);
}
function pickStartResolution(config2, options, device) {
  const optionPick = device === "mobile" ? fromOption(options.mobileStart) ?? fromOption(options.start) : device === "tablet" ? fromOption(options.tabletStart) ?? fromOption(options.start) : fromOption(options.start);
  if (optionPick) return optionPick;
  const configPick = device === "mobile" ? parseResString(config2.startResolutionMobile) : device === "tablet" ? parseResString(config2.startResolutionTab) : parseResString(config2.startResolution);
  if (configPick) return configPick;
  return { width: 1920, height: 1080 };
}
function pickMaxResolution(config2, max, fallback) {
  return fromOption(max) ?? parseResString(config2.maxStreamQuality) ?? fallback;
}
function fitToViewport(max) {
  const vw = Math.floor(window.innerWidth * window.devicePixelRatio);
  const vh = Math.floor(window.innerHeight * window.devicePixelRatio);
  const scale = Math.min(max.width / vw, max.height / vh, 1);
  let width = Math.floor(scale * vw);
  let height = Math.floor(scale * vh);
  if (width % 2 !== 0) width -= 1;
  if (height % 2 !== 0) height -= 1;
  return { width, height };
}
function resolveMode(config2, override) {
  if (override) return override;
  const raw = String(config2.resolutionMode ?? "");
  if (raw === "Dynamic Resolution Mode") return "dynamic";
  if (raw === "Crop on Resize Mode") return "crop";
  return "fixed";
}

// src/resilience.ts
var RECONNECT_WINDOW_MS = 18e4;
var NO_MEDIA_TIMEOUT_MS = 1e4;
var NETWORK_BLOCK_TIMEOUT_MS = 8e3;
var STATS_EVENT_INTERVAL_MS = 1e3;
var STATS_TELEMETRY_INTERVAL_MS = 6e4;
var ReconnectPolicy = class {
  constructor() {
    this.windowStart = 0;
    this._attempt = 0;
  }
  get attempt() {
    return this._attempt;
  }
  /** Deadline (epoch ms) the whole window expires at; 0 until started. */
  get deadline() {
    return this.windowStart ? this.windowStart + RECONNECT_WINDOW_MS : 0;
  }
  /** ms to wait before the next try, or null when the window is spent. */
  next() {
    const now = Date.now();
    if (!this.windowStart) this.windowStart = now;
    if (now - this.windowStart >= RECONNECT_WINDOW_MS) return null;
    const delay = Math.min(15e3, 1e3 * 2 ** this._attempt);
    this._attempt++;
    return Math.min(delay, this.windowStart + RECONNECT_WINDOW_MS - now);
  }
  reset() {
    this.windowStart = 0;
    this._attempt = 0;
  }
};
var NoMediaWatchdog = class {
  constructor(getPc, startTime, onStalled) {
    this.getPc = getPc;
    this.startTime = startTime;
    this.onStalled = onStalled;
    this.timer = null;
    this.lastFrames = -1;
    this.stagnantSince = 0;
  }
  start() {
    this.stop();
    this.lastFrames = -1;
    this.stagnantSince = 0;
    this.timer = setInterval(() => void this.tick(), 2e3);
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  async tick() {
    const pc = this.getPc();
    if (!pc || !["connected", "completed"].includes(pc.iceConnectionState)) {
      this.stagnantSince = 0;
      return;
    }
    const frames = await framesDecoded(pc);
    if (frames > this.lastFrames) {
      this.lastFrames = frames;
      this.stagnantSince = 0;
      return;
    }
    if (!this.stagnantSince) {
      this.stagnantSince = Date.now();
      return;
    }
    if (Date.now() - this.stagnantSince >= NO_MEDIA_TIMEOUT_MS) {
      this.stop();
      const d = await collectDiagnostics(pc, this.startTime);
      this.onStalled(d);
    }
  }
};
var NetworkBlockDetector = class {
  constructor(getPc, startTime, onBlocked) {
    this.getPc = getPc;
    this.startTime = startTime;
    this.onBlocked = onBlocked;
    this.timer = null;
  }
  arm() {
    this.disarm();
    this.timer = setTimeout(() => void this.check(), NETWORK_BLOCK_TIMEOUT_MS);
  }
  disarm() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
  async check() {
    const pc = this.getPc();
    if (!pc) return;
    if (["connected", "completed"].includes(pc.iceConnectionState)) return;
    const d = await collectDiagnostics(pc, this.startTime);
    if (!d.srflxCandidatesFound && !d.relayCandidatesFound && d.statsAvailable) {
      this.onBlocked(d);
    }
  }
};
async function framesDecoded(pc) {
  const stats2 = await pc.getStats().catch(() => null);
  if (!stats2) return -1;
  let frames = -1;
  stats2.forEach((r) => {
    if (r.type === "inbound-rtp" && r.kind === "video" && typeof r.framesDecoded === "number") {
      frames = r.framesDecoded;
    }
  });
  return frames;
}

// src/ua.ts
function detectEnv() {
  if (typeof navigator === "undefined") {
    return { osName: "unknown", browserName: "unknown", device: "desktop" };
  }
  const ua = navigator.userAgent;
  const isIpad = /iPad/.test(ua) || /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  const isIos = /iPhone|iPod/.test(ua) || isIpad;
  const isAndroid = /Android/.test(ua);
  const osName = isIos ? "iOS" : isAndroid ? "Android" : /Windows/.test(ua) ? "Windows" : /Macintosh|Mac OS X/.test(ua) ? "Mac OS" : /Linux/.test(ua) ? "Linux" : "unknown";
  const browserName = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "unknown";
  const device = isIpad || isAndroid && !/Mobile/.test(ua) ? "tablet" : isIos || isAndroid && /Mobile/.test(ua) ? "mobile" : "desktop";
  return { osName, browserName, device };
}

// src/telemetry.ts
var INGEST_PATH = "/api/frontend-streaming-logs";
var DEFAULT_TELEMETRY_HOST = "https://telemetry.streampixel.io";
var POST_TIMEOUT_MS = 1500;
var LOADING_TEXT_BY_STATE = {
  connecting: "connecting",
  streaming: "loadingComplete",
  reconnecting: "reconnecting",
  ended: "Disconnected"
};
var TelemetryClient = class {
  constructor(identity, token, mode, host) {
    this.identity = identity;
    this.token = token;
    this.mode = mode;
    this.startTime = Date.now();
    this.unloadHooked = false;
    this.onUnload = () => this.flushOnUnload();
    this.env = detectEnv();
    this.geoData = {};
    this.finalEventFn = null;
    this.url = `${(host ?? DEFAULT_TELEMETRY_HOST).replace(/\/+$/, "")}${INGEST_PATH}`;
  }
  /** Location facts arrive over signalling (locationData) after connect. */
  setGeo(geo) {
    this.geoData = geo;
  }
  /** Stall-recovery starts a fresh session — retarget without rebuilding the client. */
  rotate(sessionId, token) {
    this.identity.sessionId = sessionId;
    if (token) this.token = token;
    this.startTime = Date.now();
  }
  /** Lifecycle events — sent in BOTH modes. */
  lifecycle(event, extra = {}) {
    this.post({ logType: "Lifecycle", event, ...extra });
  }
  stateChange(state) {
    const loadingText = LOADING_TEXT_BY_STATE[state.kind];
    this.lifecycle("state", {
      state: state.kind,
      stateDetail: state,
      ...loadingText ? { loadingText } : {},
      ...state.kind === "ended" ? { disconnectCode: state.code, reason: state.reason } : {}
    });
  }
  /** WebRTC diagnostics snapshots — standard mode only. */
  webrtc(event, diagnostics) {
    if (this.mode === "minimal") return;
    this.post({ logType: "Webrtc", event, ...diagnostics });
  }
  /** Interval stats — standard mode only. */
  stats(sample) {
    if (this.mode === "minimal") return;
    this.post({ logType: "Stats", event: "interval", ...sample });
  }
  /**
   * Arm the unload flush. v1 loses every tab-close disconnect; sendBeacon
   * survives page teardown where fetch is cancelled.
   */
  armUnloadFlush(finalEvent) {
    if (this.unloadHooked || typeof window === "undefined") return;
    this.unloadHooked = true;
    this.finalEventFn = finalEvent;
    window.addEventListener("pagehide", this.onUnload);
  }
  disarmUnloadFlush() {
    if (!this.unloadHooked || typeof window === "undefined") return;
    this.unloadHooked = false;
    window.removeEventListener("pagehide", this.onUnload);
  }
  flushOnUnload() {
    if (!this.finalEventFn) return;
    const body = this.envelope({ logType: "Lifecycle", event: "unload", ...this.finalEventFn() });
    try {
      navigator.sendBeacon(
        this.url,
        new Blob([JSON.stringify({ ...body, telemetryToken: this.token })], { type: "application/json" })
      );
    } catch {
    }
  }
  envelope(data) {
    return {
      streamerId: this.identity.streamerId,
      sessionId: this.identity.sessionId,
      projectId: this.identity.projectId,
      projectRegion: this.identity.projectRegion,
      // Same session-context fields the player has always sent (dashboards
      // segment on them), plus the sdk tag that marks this as an SDK session.
      os: this.env.osName,
      browserName: this.env.browserName,
      device: this.env.device,
      domainUrl: typeof location !== "undefined" ? location.href : "",
      geoData: this.geoData,
      sdk: `core@${this.identity.sdkVersion}`,
      sdkVersion: this.identity.sdkVersion,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      timeSinceStart: Date.now() - this.startTime,
      ...data
    };
  }
  post(data) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);
      void fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.token ? { Authorization: `Bearer ${this.token}` } : {}
        },
        body: JSON.stringify(this.envelope(data)),
        signal: controller.signal,
        keepalive: true
      }).catch(() => void 0).finally(() => clearTimeout(timer));
    } catch {
    }
  }
};

// src/types.ts
var DisconnectCodes = {
  CLEAN: 1e3,
  GOING_AWAY: 1001,
  ABNORMAL: 1006,
  // network drop — SDK auto-reconnects
  UNAUTHORIZED: 1008,
  // ticket rejected
  SESSION_TERMINATED: 4e3,
  APPLICATION_ERROR: 4003,
  APPLICATION_NOT_FOUND: 4002,
  MAX_RUNTIME_REACHED: 4004,
  STREAMER_TIMEOUT: 4005,
  // app never connected to signalling
  STREAMER_DISCONNECTED: 4006,
  // app crashed / closed mid-session
  RECONNECT_FAILED: 4007,
  // SDK gave up after the reconnect window
  SESSION_SETUP_FAILED: 4008
};

// src/StreamPixel.ts
var SDK_VERSION = "2.0.0-alpha.0";
var TERMINAL_REASONS = [
  "Project Inactive",
  "Worker Node Unavailable",
  "Application Not Found",
  "Application Error",
  "Maximum Runtime Reached",
  "No streamer connected"
];
var QP_BY_CODEC = {
  H264: { min: 24, max: 32 },
  H265: { min: 24, max: 32 },
  AV1: { min: 24, max: 120 }
};
var SDP_ANSWER_TIMEOUT_MS = 3e4;
var RESIZE_DEBOUNCE_MS = 250;
var StreamPixel = class _StreamPixel extends Emitter {
  constructor(options, projectId, ticket, config2, telemetry, wireStreamerId, sessionId, voiceToken) {
    super();
    this.options = options;
    this.projectId = projectId;
    this.ticket = ticket;
    this.config = config2;
    this.telemetry = telemetry;
    this.wireStreamerId = wireStreamerId;
    this.voiceToken = voiceToken;
    this._state = { kind: "idle" };
    this.connection = null;
    this.container = null;
    this.loadingOverlay = null;
    this.reconnectPolicy = new ReconnectPolicy();
    this.noMediaWatchdog = null;
    this.networkBlock = null;
    this.statsTimer = null;
    this.lastFrames = 0;
    this.lastBytes = 0;
    this.lastStatsAt = 0;
    this.lastTelemetryStatsAt = 0;
    this.startTime = Date.now();
    this.afkTimedOut = false;
    this.afkDismiss = null;
    this.userDisconnected = false;
    this.recoveredOnce = false;
    this.disposed = false;
    this.reconnectTimer = null;
    this.sdpAnswerTimer = null;
    this.tcpRecheckTimer = null;
    this.qpTimer = null;
    this.resizeTimer = null;
    this.pcListenersAttached = false;
    this.onWindowResize = () => this.handleWindowResize();
    this.onOffline = () => this.handleOffline();
    this.onOnline = () => this.handleOnline();
    /**
     * v1/Epic compatibility bridge. Registered listeners are re-attached to the
     * underlying Epic PixelStreaming instance across reconnect rebuilds, so
     * code written against the old event names keeps working unchanged.
     */
    this.epicListeners = /* @__PURE__ */ new Map();
    this.responseListeners = /* @__PURE__ */ new Map();
    this.sessionId = sessionId;
    this.container = options.container ?? null;
    const device = detectEnv().device;
    this.resMode = resolveMode(config2, options.resolution?.mode);
    this.startRes = pickStartResolution(config2, options.resolution ?? {}, device);
    this.maxRes = pickMaxResolution(config2, options.resolution?.max, this.startRes);
    if (options.loading && this.container) {
      this.loadingOverlay = new LoadingOverlay(this.container, config2);
    }
  }
  // ---------------------------------------------------------------- create --
  static async create(options) {
    if (typeof window === "undefined" || typeof RTCPeerConnection === "undefined") {
      throw new AuthError("StreamPixel requires a browser environment with WebRTC", "network");
    }
    const platformHost = options.advanced?.platformHost;
    const { projectId, descriptor } = await resolveAccess(platformHost, options.appId);
    const auth = options.auth ?? { mode: "auto" };
    if (auth.mode === "auto" && descriptor.mode === "password") {
      throw new AuthError("This project requires a password", "password-required", 401);
    }
    let ssoGrant;
    if (descriptor.mode === "sso" && (auth.mode === "auto" || auth.mode === "sso")) {
      const here = new URL(window.location.href);
      const grant = here.searchParams.get("ssoGrant");
      if (grant) {
        ssoGrant = grant;
        here.searchParams.delete("ssoGrant");
        window.history.replaceState(window.history.state, "", here.href);
      } else {
        const startUrl = ssoStartUrl(platformHost, projectId, `${here.origin}${here.pathname}${here.search}`);
        const err = new AuthError("SSO sign-in required", "sso-required", 401);
        err.ssoStartUrl = startUrl;
        if (auth.mode === "sso" && auth.redirect === "manual") throw err;
        window.location.assign(startUrl);
        throw err;
      }
    }
    const minted = await mintTicket(platformHost, projectId, auth, { ssoGrant });
    if (minted.config && minted.config.ready === false) {
      throw new AuthError("Project has no active build", "project-offline", 409);
    }
    const streamerId = options.shared?.role === "viewer" ? `SFU_${options.shared.hostStreamerId}` : options.advanced?.streamerId ?? uuidv7();
    const sessionId = newSessionId();
    const telemetry = new TelemetryClient(
      {
        streamerId,
        sessionId,
        projectId,
        projectRegion: minted.config?.region,
        sdkVersion: SDK_VERSION
      },
      minted.telemetryToken,
      options.telemetry ?? "standard",
      // Explicit option, else config-carried override if the platform ever ships one.
      options.advanced?.telemetryHost ?? minted.config?.telemetryUrl
    );
    const instance = new _StreamPixel(
      options,
      projectId,
      minted.ticket,
      minted.config,
      telemetry,
      streamerId,
      sessionId,
      minted.voiceToken
    );
    telemetry.lifecycle("sessionStart", { authMode: auth.mode, descriptorMode: descriptor.mode });
    telemetry.armUnloadFlush(() => ({ state: instance._state.kind }));
    setTimeout(() => instance.connect(), 0);
    return instance;
  }
  // ------------------------------------------------------------ public api --
  get state() {
    return this._state;
  }
  /**
   * This connection's wire streamer id. For a shared HOST, hand this to viewers
   * (`shared: { role: 'viewer', hostStreamerId }`) so they join your session.
   */
  get streamerId() {
    return this.wireStreamerId;
  }
  /**
   * The platform's stream config for this session, branding included
   * (customLogo, loadingBannerUrl, loadingTextOne/Two/Three, chatTheme…) —
   * everything a loading screen or overlay needs. Core renders none of it.
   */
  get streamConfig() {
    return this.config;
  }
  /** The resolution ladder this project allows (up to maxStreamQuality) — for pickers. */
  get allowedResolutions() {
    return allowedResolutions(this.config.maxStreamQuality);
  }
  /** Attach (or move) the video output into a container. Safe to call any time. */
  attach(container) {
    this.container = container;
    const parent = this.connection?.videoParent;
    if (parent) container.append(parent);
  }
  /** emitUIInteraction — payloads to the UE application. */
  send(payload) {
    this.connection?.send(payload);
  }
  consoleCommand(cmd) {
    this.connection?.consoleCommand(cmd);
  }
  setResolution(width, height) {
    this.connection?.setRes(width, height, "f");
  }
  /** Reply to the on-screen keyboard (pairs with the `osk` event). */
  sendTextboxEntry(text) {
    this.connection?.sendTextboxEntry(text);
  }
  setHoverMouse(enabled) {
    this.connection?.setHoverMouse(enabled);
  }
  toggleXR() {
    this.connection?.toggleXR();
  }
  /** PNG data URL of the current frame, or null before first decoded frame. */
  captureScreenshot() {
    return this.connection?.captureScreenshot() ?? null;
  }
  /**
   * Returns the new audible state. Audio rides the lib's own <audio> element —
   * NOT the <video> — so this drives that element, like the player does.
   */
  toggleAudio() {
    const audio = this.connection?.audioElement;
    if (!audio) return false;
    void audio.play().catch(() => void 0);
    audio.muted = !audio.muted;
    return !audio.muted;
  }
  async getDiagnostics() {
    const pc = this.connection?.peerConnection;
    return pc ? collectDiagnostics(pc, this.startTime) : null;
  }
  // ---------------------------------------------- v1 / Epic compat bridge --
  /**
   * Subscribe to the underlying Epic Pixel Streaming events by their ORIGINAL
   * names ('webRtcConnected', 'playStream', 'afkWarningActivate', …) — the v1
   * upgrade path. New code should prefer the typed `on('state' | ...)` surface;
   * this bridge exists so v1 integrations port without a rewrite, and it
   * survives the SDK's internal reconnect rebuilds (v1 never had those).
   */
  addEventListener(type, listener) {
    let set = this.epicListeners.get(type);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.epicListeners.set(type, set);
    }
    set.add(listener);
    this.connection?.stream.addEventListener(type, listener);
  }
  removeEventListener(type, listener) {
    this.epicListeners.get(type)?.delete(listener);
    this.connection?.stream.removeEventListener(type, listener);
  }
  /** v1 name for subscribing to UE application messages. */
  addResponseEventListener(name, listener) {
    this.responseListeners.set(name, listener);
  }
  removeResponseEventListener(name) {
    this.responseListeners.delete(name);
  }
  /** v1 method names — aliases for send()/consoleCommand(). */
  emitUIInteraction(descriptor) {
    this.send(descriptor);
  }
  emitConsoleCommand(command) {
    this.consoleCommand(command);
  }
  /** Deliberate teardown. Never reconnects, never retries. */
  disconnect() {
    if (this.disposed) return;
    this.userDisconnected = true;
    this.telemetry.lifecycle("userDisconnect");
    this.teardown();
    this.end(DisconnectCodes.CLEAN, "Disconnected by application", "user");
  }
  // -------------------------------------------------------- state machine --
  setState(state) {
    this._state = state;
    this.loadingOverlay?.onState(state);
    this.telemetry.stateChange(state);
    this.emit("state", state);
  }
  connect() {
    if (this.disposed) return;
    this.setState({ kind: "connecting" });
    const signallingHost = String(this.config.signallingHost ?? "");
    if (!signallingHost) {
      this.end(DisconnectCodes.SESSION_SETUP_FAILED, "No signalling host in stream config", "error");
      return;
    }
    const initial = this.resMode === "fixed" ? this.startRes : fitToViewport(this.maxRes);
    this.pcListenersAttached = false;
    this.connection = new Connection(
      {
        signallingHost,
        streamerId: this.wireStreamerId,
        sessionId: this.sessionId,
        projectId: this.projectId,
        ticket: this.ticket,
        config: this.config,
        options: this.options,
        resX: initial.width,
        resY: initial.height
      },
      {
        onConnecting: () => this.armNetworkBlockDetector(),
        onConnected: () => this.onConnected(),
        onPlaying: () => this.onPlaying(initial),
        onSdpOffer: () => {
          void this.logDiag("sdpOffer");
        },
        onSdpAnswer: () => this.onSdpAnswer(),
        onSignallingOpen: () => {
          this.telemetry.webrtc("signalingServerConnected", this.stamp());
          const pc = this.connection?.peerConnection;
          if (this._state.kind === "reconnecting" && pc && ["connected", "completed"].includes(pc.iceConnectionState)) {
            this.reconnectPolicy.reset();
            this.setState({ kind: "streaming" });
          }
        },
        onSignallingError: (error) => this.telemetry.webrtc("signalingServerError", { error, ...this.stamp() }),
        onConfigMessage: (iceServers) => {
          if (iceServers.length === 0) {
            this.telemetry.webrtc("configMessageMissingIceServers", {
              error: "Config message missing ICE servers",
              ...this.stamp()
            });
          } else {
            this.telemetry.webrtc("configMessageReceived", {
              iceServersCount: iceServers.length,
              iceServers,
              ...this.stamp()
            });
          }
        },
        onLocationData: (geo) => {
          this.telemetry.setGeo(geo);
          void this.logDiag("initialConnection");
        },
        onOsk: (contents) => this.emit("osk", { contents }),
        onAfkWarning: (secondsRemaining, dismiss) => {
          this.afkDismiss = dismiss;
          this.emit("afkWarning", { kind: "countdown", secondsRemaining, dismiss });
        },
        onAfkWarningUpdate: (secondsRemaining) => this.emit("afkWarning", {
          kind: "countdown",
          secondsRemaining,
          dismiss: this.afkDismiss ?? (() => void 0)
        }),
        onAfkWarningDismissed: () => {
          this.afkDismiss = null;
          this.emit("afkWarning", { kind: "dismissed" });
        },
        onAfkTimedOut: () => {
          this.afkTimedOut = true;
          this.afkDismiss = null;
          this.telemetry.lifecycle("afkTimedOut");
        },
        onClose: (code, reason) => this.onClose(code, reason),
        onQueue: (position, message) => {
          this.setState({ kind: "queued", position });
          this.emit("queue", { position, message });
        },
        onUeMessage: (message) => this.onUeMessage(message)
      }
    );
    if (this.container) {
      const parent = this.connection.videoParent;
      if (parent) this.container.append(parent);
    }
    for (const [type, set] of this.epicListeners) {
      for (const listener of set) {
        this.connection.stream.addEventListener(type, listener);
      }
    }
    window.addEventListener("offline", this.onOffline);
    window.addEventListener("online", this.onOnline);
  }
  stamp() {
    return { timeSinceStart: Date.now() - this.startTime };
  }
  async logDiag(event, extra = {}) {
    const pc = this.connection?.peerConnection;
    const diag = pc ? await collectDiagnostics(pc, this.startTime) : this.stamp();
    this.telemetry.webrtc(event, { ...diag, ...extra });
  }
  armNetworkBlockDetector() {
    if (this.networkBlock) return;
    this.networkBlock = new NetworkBlockDetector(
      () => this.connection?.peerConnection ?? null,
      this.startTime,
      (d) => {
        this.telemetry.webrtc("networkBlocked", d);
        this.teardown();
        this.end(
          0,
          "This network blocks WebRTC (UDP and TURN relay). Ask IT to allow *.turn.twilio.com on TCP/443, or try another network.",
          "network-blocked"
        );
      }
    );
    this.networkBlock.arm();
  }
  onSdpAnswer() {
    void this.logDiag("sdpAnswer");
    if (this.sdpAnswerTimer) clearTimeout(this.sdpAnswerTimer);
    this.sdpAnswerTimer = setTimeout(() => {
      const pc = this.connection?.peerConnection;
      if (!pc) return;
      const connected = ["connected", "completed"].includes(pc.iceConnectionState) || pc.connectionState === "connected";
      if (!connected) void this.logDiag("timeout");
    }, SDP_ANSWER_TIMEOUT_MS);
  }
  onConnected() {
    this.armNetworkBlockDetector();
    this.attachPcFailureListeners();
    void (async () => {
      const pc = this.connection?.peerConnection;
      const transport = pc ? await relayTransport(pc) : "";
      const tcpFallback = transport === "tcp" || transport === "tls";
      await this.logDiag("connected", { tcpFallback });
      if (tcpFallback) {
        this.telemetry.webrtc("tcpFallbackDetected", { when: "connected", ...this.stamp() });
      } else {
        this.tcpRecheckTimer = setTimeout(() => {
          void (async () => {
            const pcNow = this.connection?.peerConnection;
            const t = pcNow ? await relayTransport(pcNow) : "";
            if (t === "tcp" || t === "tls") {
              this.telemetry.webrtc("tcpFallbackDetected", { when: "+5s", ...this.stamp() });
            }
          })();
        }, 5e3);
      }
    })();
  }
  /** The player's iceFailure/connectionFailure captures — same event names. */
  attachPcFailureListeners() {
    if (this.pcListenersAttached) return;
    const pc = this.connection?.peerConnection;
    if (!pc) return;
    this.pcListenersAttached = true;
    pc.addEventListener("iceconnectionstatechange", () => {
      if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
        void this.logDiag("iceFailure", { failureState: pc.iceConnectionState });
      }
    });
    pc.addEventListener("connectionstatechange", () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        void this.logDiag("connectionFailure", { failureState: pc.connectionState });
      }
    });
  }
  onPlaying(initial) {
    this.networkBlock?.disarm();
    this.networkBlock = null;
    if (this.sdpAnswerTimer) clearTimeout(this.sdpAnswerTimer);
    this.sdpAnswerTimer = null;
    this.reconnectPolicy.reset();
    this.setState({ kind: "streaming" });
    setTimeout(() => this.connection?.setRes(initial.width, initial.height, "f"), 700);
    if (this.resMode !== "fixed") {
      window.addEventListener("resize", this.onWindowResize);
    }
    const selected = this.connection?.selectedCodec;
    const primary = codecFamily(
      String(this.options.codec?.primary ?? this.config.primaryCodec ?? "")
    );
    if (selected && primary && selected !== primary) {
      const qp = QP_BY_CODEC[selected];
      if (qp) {
        this.qpTimer = setTimeout(() => {
          this.connection?.sendEncoderCommand({ "Encoder.MinQP": qp.min });
          this.connection?.sendEncoderCommand({ "Encoder.MaxQP": qp.max });
        }, 2e3);
      }
    }
    const micWanted = this.options.media?.mic ?? this.config.showMic === true;
    const camWanted = this.options.media?.camera ?? this.config.showCamera === true;
    if (micWanted) {
      navigator.mediaDevices?.getUserMedia({ audio: true }).then((media) => {
        media.getTracks().forEach((t) => t.stop());
        this.connection?.unmuteMicrophone();
      }).catch((err) => this.telemetry.lifecycle("micPermissionDenied", { error: String(err) }));
    }
    if (camWanted) {
      navigator.mediaDevices?.getUserMedia({ video: true }).then((media) => {
        media.getTracks().forEach((t) => t.stop());
        this.connection?.unmuteCamera();
      }).catch((err) => this.telemetry.lifecycle("cameraPermissionDenied", { error: String(err) }));
    }
    this.noMediaWatchdog?.stop();
    this.noMediaWatchdog = new NoMediaWatchdog(
      () => this.connection?.peerConnection ?? null,
      this.startTime,
      (d) => this.onStalled(d)
    );
    this.noMediaWatchdog.start();
    this.startStatsSampler();
  }
  handleWindowResize() {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      const dims = fitToViewport(this.maxRes);
      this.connection?.setRes(dims.width, dims.height, "wf");
    }, RESIZE_DEBOUNCE_MS);
  }
  handleOffline() {
    if (this.disposed || !this.connection) return;
    this.telemetry.lifecycle("networkOffline");
    this.connection.disconnect();
    this.connection = null;
    this.tryReconnect();
  }
  handleOnline() {
    if (this.disposed) return;
    if (this._state.kind === "reconnecting" && this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      this.connect();
    }
  }
  onUeMessage(message) {
    try {
      const parsed = typeof message === "string" ? JSON.parse(message) : message;
      if (parsed?.message?.type === "heartbeat") {
        this.afkDismiss?.();
      }
    } catch {
    }
    this.emit("ueMessage", message);
    for (const listener of this.responseListeners.values()) {
      try {
        listener(typeof message === "string" ? message : JSON.stringify(message));
      } catch {
      }
    }
  }
  onStalled(d) {
    this.telemetry.webrtc("noMediaStall", d);
    this.emit("stalled", d);
    if (this.options.shared || this.recoveredOnce) {
      this.teardown();
      this.end(
        DisconnectCodes.APPLICATION_ERROR,
        this.recoveredOnce ? "Stream produced no media after recovery retry" : "Stream produced no media",
        "error"
      );
      return;
    }
    this.recoveredOnce = true;
    this.setState({ kind: "recovering", attempt: 1 });
    this.teardown();
    this.sessionId = newSessionId();
    this.telemetry.rotate(this.sessionId);
    this.telemetry.lifecycle("stallRecovery", { previousDiagnostics: d.verdict });
    this.connect();
  }
  onClose(code, reason) {
    if (this.disposed || this.userDisconnected) return;
    this.stopStatsSampler();
    this.noMediaWatchdog?.stop();
    this.networkBlock?.disarm();
    this.networkBlock = null;
    if (this.sdpAnswerTimer) clearTimeout(this.sdpAnswerTimer);
    this.sdpAnswerTimer = null;
    this.telemetry.webrtc("signalingServerDisconnected", {
      disconnectCode: code,
      reason,
      ...this.stamp()
    });
    if (this.afkTimedOut) {
      this.end(code, "Disconnected due to inactivity", "afk");
      return;
    }
    if (code === DisconnectCodes.UNAUTHORIZED || TERMINAL_REASONS.includes(reason)) {
      this.end(code, reason || "Access refused", "server");
      return;
    }
    if (code === 1005 || code === DisconnectCodes.ABNORMAL) {
      this.tryReconnect();
      return;
    }
    this.end(code, reason, code === DisconnectCodes.CLEAN ? "user" : "server");
  }
  tryReconnect() {
    const delay = this.reconnectPolicy.next();
    if (delay === null) {
      this.telemetry.webrtc("signalingServerDisconnected", {
        disconnectCode: DisconnectCodes.RECONNECT_FAILED,
        reason: "Reconnection Failed",
        ...this.stamp()
      });
      this.end(DisconnectCodes.RECONNECT_FAILED, "Could not reconnect to the stream", "error");
      return;
    }
    this.setState({
      kind: "reconnecting",
      attempt: this.reconnectPolicy.attempt,
      deadlineMs: this.reconnectPolicy.deadline
    });
    this.telemetry.lifecycle("reconnecting", { attempt: this.reconnectPolicy.attempt });
    const pc = this.connection?.peerConnection;
    const mediaAlive = !!pc && ["connected", "completed"].includes(pc.iceConnectionState);
    if (mediaAlive && this.connection) {
      const conn = this.connection;
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        if (this.disposed) return;
        if (conn === this.connection && conn.reconnectSignalling()) {
          this.telemetry.lifecycle("reconnectSoft", { attempt: this.reconnectPolicy.attempt });
        } else {
          this.connection?.disconnect();
          this.connection = null;
          this.connect();
        }
      }, delay);
      return;
    }
    this.connection?.disconnect();
    this.connection = null;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
  end(code, reason, endKind) {
    if (this.disposed) return;
    this.disposed = true;
    this.teardown();
    this.telemetry.lifecycle("sessionEnd", { disconnectCode: code, reason, endKind });
    this.telemetry.disarmUnloadFlush();
    this.setState({ kind: "ended", code, reason, endKind });
    this.emit("ended", { code, reason, endKind });
    this.clearListeners();
  }
  teardown() {
    window.removeEventListener("offline", this.onOffline);
    window.removeEventListener("online", this.onOnline);
    window.removeEventListener("resize", this.onWindowResize);
    for (const timer of [
      this.reconnectTimer,
      this.sdpAnswerTimer,
      this.tcpRecheckTimer,
      this.qpTimer,
      this.resizeTimer
    ]) {
      if (timer) clearTimeout(timer);
    }
    this.reconnectTimer = null;
    this.sdpAnswerTimer = null;
    this.tcpRecheckTimer = null;
    this.qpTimer = null;
    this.resizeTimer = null;
    this.stopStatsSampler();
    this.noMediaWatchdog?.stop();
    this.noMediaWatchdog = null;
    this.networkBlock?.disarm();
    this.networkBlock = null;
    this.connection?.disconnect();
    this.connection = null;
  }
  // ---------------------------------------------------------------- stats --
  startStatsSampler() {
    this.stopStatsSampler();
    this.lastFrames = 0;
    this.lastBytes = 0;
    this.lastStatsAt = Date.now();
    this.lastTelemetryStatsAt = Date.now();
    this.statsTimer = setInterval(() => void this.sampleStats(), STATS_EVENT_INTERVAL_MS);
  }
  stopStatsSampler() {
    if (this.statsTimer) clearInterval(this.statsTimer);
    this.statsTimer = null;
  }
  async sampleStats() {
    const pc = this.connection?.peerConnection;
    if (!pc) return;
    const stats2 = await pc.getStats().catch(() => null);
    if (!stats2) return;
    let frames = 0, dropped = 0, bytes = 0, rttMs = 0;
    let width = 0, height = 0;
    let codec = null;
    const codecs = /* @__PURE__ */ new Map();
    let codecId;
    stats2.forEach((r) => {
      if (r.type === "codec" && r.mimeType) codecs.set(r.id, String(r.mimeType));
      if (r.type === "inbound-rtp" && r.kind === "video") {
        frames = r.framesDecoded ?? 0;
        dropped = r.framesDropped ?? 0;
        bytes = r.bytesReceived ?? 0;
        width = r.frameWidth ?? 0;
        height = r.frameHeight ?? 0;
        codecId = r.codecId;
      }
      if (r.type === "candidate-pair" && r.nominated && r.state === "succeeded" && r.currentRoundTripTime) {
        rttMs = Math.round(r.currentRoundTripTime * 1e3);
      }
    });
    if (codecId) codec = codecs.get(codecId)?.replace("video/", "") ?? null;
    const now = Date.now();
    const dt = (now - this.lastStatsAt) / 1e3;
    const sample = {
      fps: dt > 0 ? Math.max(0, Math.round((frames - this.lastFrames) / dt)) : 0,
      latencyMs: rttMs,
      framesDecoded: frames,
      framesDropped: dropped,
      bitrateKbps: dt > 0 ? Math.max(0, Math.round((bytes - this.lastBytes) * 8 / dt / 1e3)) : null,
      resolution: width && height ? `${width}x${height}` : null,
      codec,
      relayTransport: await relayTransport(pc)
    };
    this.lastFrames = frames;
    this.lastBytes = bytes;
    this.lastStatsAt = now;
    this.emit("stats", sample);
    if (now - this.lastTelemetryStatsAt >= STATS_TELEMETRY_INTERVAL_MS) {
      this.lastTelemetryStatsAt = now;
      this.telemetry.stats({
        FPS: sample.fps,
        latency: sample.latencyMs,
        framesDecoded: sample.framesDecoded,
        framesDrop: sample.framesDropped,
        videoBitrate: sample.bitrateKbps,
        videoResolution: sample.resolution,
        videoCodec: sample.codec,
        relayTransport: sample.relayTransport
      });
    }
  }
};
export {
  AuthError,
  DisconnectCodes,
  RESOLUTION_LADDER,
  SDK_VERSION,
  StreamPixel,
  allowedResolutions,
  parseResString,
  ssoStartUrl
};
//# sourceMappingURL=index.js.map

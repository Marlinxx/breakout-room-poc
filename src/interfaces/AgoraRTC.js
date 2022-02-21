import AgoraRTC from "agora-rtc-sdk-ng";
import EventEmitter from "events";

export const AgoraClientConfig = {
  mode: "rtc",
  codec: "vp8",
};

export const AgoraRTCEventConstant = {
  USER_PUBLISHED: "user-published",
  USER_UNPUBLISHED: "user-unpublished",
  USER_LEFT: "user-left",
  USER_JOINED: "user-joined",
  VOLUME_INDICATOR: "volume-indicator",
  NETWORK_QUALITY: "network-quality",
};

class RTCInterface extends EventEmitter {
  constructor(appId, channelId, accessToken, clientId, config) {
    super();
    this.RTCClient = AgoraRTC.createClient(AgoraClientConfig);
    this.audioTrack = null;
    this.videoTrack = null;
    this.channelId = channelId;
    this.accessToken = accessToken;
    this.clientId = clientId;
    this.appId = appId;
    this.config = config;
    AgoraRTC.setLogLevel(4);
  }

  async initialise() {
    // Create microphone and video tracks
    try {
      const tracksPromise = [
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack(),
      ];
      return Promise.allSettled(tracksPromise).then(
        ([audioTrack, videoTrack]) => {
          let audio = {
            isSuccess: true,
          };
          let video = {
            isSuccess: true,
          };

          if (audioTrack.status === "rejected") {
            audio.isSuccess = false;
            audio.err = audioTrack.reason;
          } else {
            this.audioTrack = audioTrack.value;
          }

          if (videoTrack.status === "rejected") {
            video.isSuccess = false;
            video.err = videoTrack.reason;
          } else {
            this.videoTrack = videoTrack.value;
          }
          this.subscribeClientEvents();

          return { audio, video };
        }
      );
    } catch (error) {
      throw error;
    }
  }

  async startStreaming(publishAudioTrack = true, publishVideoTrack = true) {
    const { needDualStream } = this.config;
    try {
      return (async () => {
        await this.RTCClient.join(
          this.appId,
          this.channelId,
          this.accessToken,
          this.clientId
        );
        needDualStream && (await this.RTCClient.enableDualStream());
        let tracks = [];
        if (this.audioTrack && publishAudioTrack) {
          tracks.push(this.audioTrack);
        }
        if (this.videoTrack && publishVideoTrack) {
          tracks.push(this.videoTrack);
        }
        await this.RTCClient.publish(tracks);
        return { isSuccess: true };
      })();
    } catch (error) {
      throw error;
    }
  }

  publishTrack(publishAudio, publishVideo) {
    let tracks = [];
    if (publishAudio) {
      tracks.push(this.audioTrack);
    }
    if (publishVideo) {
      tracks.push(this.videoTrack);
    }
    return this.RTCClient.publish(tracks);
  }

  unpublishTrack(unpublishAudio, unpublishVideo) {
    let tracks = [];
    if (unpublishAudio) {
      tracks.push(this.audioTrack);
    }
    if (unpublishVideo) {
      tracks.push(this.videoTrack);
    }
    return this.RTCClient.unpublish(tracks);
  }

  setRemoteVideoStreamType(uid, type) {
    this.RTCClient.setRemoteVideoStreamType(uid, type);
  }

  muteAudio() {
    return this.audioTrack.setEnabled(false);
  }

  unmuteAudio() {
    return this.audioTrack.setEnabled(true);
  }

  muteVideo() {
    return this.videoTrack.setEnabled(false);
  }

  unmuteVideo() {
    return this.videoTrack.setEnabled(true);
  }

  stop() {
    this.videoTrack.stop();
  }

  playVideo(target) {
    if (this.videoTrack) return this.videoTrack.play(target);
  }

  playAudio() {
    if (this.audioTrack) return this.audioTrack.play();
  }

  subscribeClientEvents() {
    const events = [
      AgoraRTCEventConstant.USER_PUBLISHED,
      AgoraRTCEventConstant.USER_UNPUBLISHED,
      AgoraRTCEventConstant.USER_LEFT,
      AgoraRTCEventConstant.USER_JOINED,
      AgoraRTCEventConstant.VOLUME_INDICATOR,
      AgoraRTCEventConstant.NETWORK_QUALITY,
    ];
    events.forEach((event) => {
      this.RTCClient.on(event, (...args) => {
        this.emit(event, ...args);
      });
    });
  }

  subscribe(user, track) {
    return this.RTCClient.subscribe(user, track);
  }

  unsubscribe(user, track) {
    return this.RTCClient.unsubscribe(user, track);
  }

  removeAllListeners() {
    return this.RTCClient.removeAllListeners();
  }

  leave() {
    return this.RTCClient.leave();
  }
}

export default RTCInterface;

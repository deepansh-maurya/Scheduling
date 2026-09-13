async function getudioVideo() {
  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: true
  });

  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true
  });

  const audioContext = new AudioContext();

  const micSource = audioContext.createMediaStreamSource(micStream);

  const systemSource = audioContext.createMediaStreamSource(screenStream);

  const merger = audioContext.createChannelMerger(2);

  micSource.connect(merger, 0, 0);
  systemSource.connect(merger, 0, 1);

  const destination = audioContext.createMediaStreamDestination();

  merger.connect(destination);

  return { video: screenStream, channelledAudio: destination.stream };
}

export default getudioVideo;
